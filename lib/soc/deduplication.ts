import { RawAlert, DeduplicatedGroup } from "./types";

const KNOWN_SCANNER_RANGES = ["45.33.32.0/24", "209.197.3.0/24", "71.6.135.0/24"];
const KNOWN_FP_RULES = ["5706", "5710", "5712"];

/**
 * Checks if an IP is within a CIDR range.
 */
function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split("/");
    const mask = ~(Math.pow(2, 32 - parseInt(bits, 10)) - 1);
    const ipInt = ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const rangeInt = range.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    return (ipInt & mask) === (rangeInt & mask);
  } catch {
    return false;
  }
}

/**
 * Returns string combining source_ip and rule_id
 */
export function generateGroupKey(source_ip: string, rule_id: string, _timestamp: string): string {
  return `${source_ip}|${rule_id}`;
}

/**
 * Groups alerts by source_ip and rule_id within 15 minute sliding windows.
 */
export function deduplicateAlerts(alerts: RawAlert[]): DeduplicatedGroup[] {
  if (alerts.length === 0) return [];

  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const WINDOW_MS = 15 * 60 * 1000;
  const groups: DeduplicatedGroup[] = [];
  const activeGroupsMap = new Map<string, DeduplicatedGroup>();

  for (const alert of sortedAlerts) {
    const key = generateGroupKey(alert.source_ip, alert.rule_id, alert.timestamp);
    const existingGroup = activeGroupsMap.get(key);
    const alertTime = new Date(alert.timestamp).getTime();

    if (existingGroup && alertTime - existingGroup.first_seen.getTime() <= WINDOW_MS) {
      existingGroup.alerts.push(alert);
      existingGroup.count++;
      existingGroup.last_seen = new Date(alert.timestamp);
      
      // Update representative alert if current alert has higher severity
      if (alert.severity_level > existingGroup.representative_alert.severity_level) {
        existingGroup.representative_alert = alert;
      }
    } else {
      const newGroup: DeduplicatedGroup = {
        group_key: key,
        rule_id: alert.rule_id,
        source_ip: alert.source_ip,
        alerts: [alert],
        count: 1,
        first_seen: new Date(alert.timestamp),
        last_seen: new Date(alert.timestamp),
        representative_alert: alert,
        suppressed: false,
        suppression_reason: null,
      };
      groups.push(newGroup);
      activeGroupsMap.set(key, newGroup);
    }
  }

  return groups;
}

/**
 * Suppresses groups based on scanner ranges, high-volume bursts, or known FP rules.
 */
export function applyNoiseFilter(groups: DeduplicatedGroup[]): DeduplicatedGroup[] {
  return groups.map((group) => {
    // 1. Scanner CIDR check
    const isScanner = KNOWN_SCANNER_RANGES.some((cidr) => isIpInCidr(group.source_ip, cidr));
    if (isScanner) {
      group.suppressed = true;
      group.suppression_reason = "Known scanner range";
      return group;
    }

    // 2. Burst/Volume check (1000+ alerts in < 60s)
    const durationS = (group.last_seen.getTime() - group.first_seen.getTime()) / 1000;
    if (group.count > 1000 && durationS < 60) {
      group.suppressed = true;
      group.suppression_reason = "Scanner-like volume burst";
      return group;
    }

    // 3. Known FP Rule check
    if (KNOWN_FP_RULES.includes(group.rule_id)) {
      group.suppressed = true;
      group.suppression_reason = "Known false positive rule ID";
      return group;
    }

    return group;
  });
}

/**
 * Returns statistics about the deduplication process.
 */
export function getDeduplicationStats(groups: DeduplicatedGroup[]) {
  const totalAlerts = groups.reduce((acc, g) => acc + g.count, 0);
  const suppressedGroups = groups.filter((g) => g.suppressed).length;
  
  const ipCounts: Record<string, number> = {};
  groups.forEach((g) => {
    ipCounts[g.source_ip] = (ipCounts[g.source_ip] || 0) + g.count;
  });

  const topTalkers = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  return {
    total_alerts: totalAlerts,
    unique_groups: groups.length,
    suppressed_groups: suppressedGroups,
    noise_reduction_percent: groups.length > 0 ? (1 - groups.length / totalAlerts) * 100 : 0,
    top_talkers: topTalkers,
  };
}
