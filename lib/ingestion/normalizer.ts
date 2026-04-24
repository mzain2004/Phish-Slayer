import { NormalizedLog } from "../soc/types";

/**
 * Normalizes Syslog (RFC 5424 / RFC 3164)
 */
export function normalizeSyslog(raw: string): NormalizedLog {
  try {
    const priMatch = raw.match(/^<(\d+)>/);
    const pri = priMatch ? parseInt(priMatch[1], 10) : 13;
    const severity = pri % 8;
    const mappedSeverity = (severity * 2) + 1;

    // Basic regex for timestamp, hostname, app_name
    const parts = raw.replace(/^<\d+>/, "").split(/\s+/);
    const timestamp = new Date(parts[0]).toString() !== "Invalid Date" ? new Date(parts[0]) : new Date();
    const hostname = parts[1] || null;
    const appName = parts[2] || "unknown";

    return {
      timestamp,
      source_ip: null,
      destination_ip: null,
      user: null,
      hostname,
      action: appName,
      outcome: "unknown",
      severity: mappedSeverity,
      category: "syslog",
      raw_event_id: null,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: { raw }
    };
  } catch (e) {
    return {
      timestamp: new Date(),
      source_ip: null,
      destination_ip: null,
      user: null,
      hostname: null,
      action: "parse_error",
      outcome: "unknown",
      severity: 5,
      category: "syslog",
      raw_event_id: null,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: { error: String(e), raw }
    };
  }
}

/**
 * Normalizes CEF (Common Event Format)
 */
export function normalizeCEF(raw: string): NormalizedLog {
  try {
    const parts = raw.split("|");
    const header = parts.slice(0, 7);
    const extStr = parts.slice(7).join("|");

    const extensions: Record<string, string> = {};
    const matches = extStr.match(/([^=\s]+)=([^=]*(?:\s+|$)(?=[^=\s]+=|$))/g);
    matches?.forEach(m => {
      const [k, v] = m.split("=");
      if (k && v) extensions[k.trim()] = v.trim();
    });

    const sev = parseInt(header[6]) || 0;
    const mappedSeverity = Math.round((sev / 10) * 14) + 1;

    return {
      timestamp: new Date(),
      source_ip: extensions.src || null,
      destination_ip: extensions.dst || null,
      user: extensions.suser || extensions.duser || null,
      hostname: extensions.dvchost || null,
      action: extensions.act || header[5],
      outcome: "unknown",
      severity: mappedSeverity,
      category: "cef",
      raw_event_id: header[4],
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: extensions
    };
  } catch (e) {
    return {
      timestamp: new Date(),
      source_ip: null,
      destination_ip: null,
      user: null,
      hostname: null,
      action: "parse_error",
      outcome: "unknown",
      severity: 5,
      category: "cef",
      raw_event_id: null,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: { error: String(e), raw }
    };
  }
}

/**
 * Normalizes LEEF (Log Event Extended Format)
 */
export function normalizeLEEF(raw: string): NormalizedLog {
  try {
    const parts = raw.split("|");
    const attrStr = parts.slice(5).join("|");
    const attrs: Record<string, string> = {};
    attrStr.split("\t").forEach(a => {
      const [k, v] = a.split("=");
      if (k && v) attrs[k] = v;
    });

    return {
      timestamp: attrs.devTime ? new Date(attrs.devTime) : new Date(),
      source_ip: attrs.src || null,
      destination_ip: attrs.dst || null,
      user: attrs.usrName || null,
      hostname: attrs.devHost || null,
      action: parts[4],
      outcome: "unknown",
      severity: 5,
      category: "leef",
      raw_event_id: null,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: attrs
    };
  } catch (e) {
    return {
      timestamp: new Date(),
      source_ip: null,
      destination_ip: null,
      user: null,
      hostname: null,
      action: "parse_error",
      outcome: "unknown",
      severity: 5,
      category: "leef",
      raw_event_id: null,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: { error: String(e), raw }
    };
  }
}

/**
 * Normalizes JSON
 */
export function normalizeJSON(raw: string): NormalizedLog {
  try {
    const data = JSON.parse(raw);
    const ts = data.timestamp || data.time || data["@timestamp"] || data.eventTime || data.TimeGenerated;
    const sip = data.src || data.source || data.sourceIP || data.source_ip || data.remoteIP;
    const user = data.user || data.username || data.userId || data.actor;

    return {
      timestamp: ts ? new Date(ts) : new Date(),
      source_ip: sip || null,
      destination_ip: data.dst || data.destinationIP || null,
      user: typeof user === 'string' ? user : (user?.name || null),
      hostname: data.hostname || data.host || null,
      action: data.action || data.eventName || "unknown",
      outcome: (data.outcome || data.result || "unknown").toLowerCase() as any,
      severity: data.severity || data.level || 5,
      category: data.category || "json",
      raw_event_id: data.id || data.eventId || null,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: data
    };
  } catch (e) {
    return {
      timestamp: new Date(),
      source_ip: null,
      destination_ip: null,
      user: null,
      hostname: null,
      action: "parse_error",
      outcome: "unknown",
      severity: 5,
      category: "json",
      raw_event_id: null,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: { error: String(e), raw }
    };
  }
}

/**
 * Normalizes AWS CloudTrail
 */
export function normalizeCloudTrail(raw: string): NormalizedLog {
  try {
    const data = JSON.parse(raw);
    return {
      timestamp: new Date(data.eventTime),
      source_ip: data.sourceIPAddress || null,
      destination_ip: null,
      user: data.userIdentity?.userName || data.userIdentity?.arn || null,
      hostname: data.awsRegion || null,
      action: data.eventName,
      outcome: data.errorCode ? "failure" : "success",
      severity: data.errorCode ? 8 : 3,
      category: "cloudtrail",
      raw_event_id: data.eventID,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: data
    };
  } catch (e) {
    return normalizeJSON(raw);
  }
}

/**
 * Normalizes Azure Activity
 */
export function normalizeAzureActivity(raw: string): NormalizedLog {
  try {
    const data = JSON.parse(raw);
    return {
      timestamp: new Date(data.eventTimestamp),
      source_ip: data.callerIpAddress || null,
      destination_ip: null,
      user: data.caller || null,
      hostname: data.resourceType || null,
      action: data.operationName?.value || "unknown",
      outcome: data.resultType === "Failed" ? "failure" : "success",
      severity: data.resultType === "Failed" ? 7 : 2,
      category: "azure_activity",
      raw_event_id: data.id,
      mitre_tactic: null,
      mitre_technique: null,
      extra_fields: data
    };
  } catch (e) {
    return normalizeJSON(raw);
  }
}

export function autoDetectAndNormalize(raw: string): NormalizedLog {
  const trimmed = raw.trim();
  if (trimmed.startsWith("CEF:0")) return normalizeCEF(trimmed);
  if (trimmed.startsWith("LEEF:")) return normalizeLEEF(trimmed);
  if (/^<\d+>/.test(trimmed)) return normalizeSyslog(trimmed);
  
  if (trimmed.startsWith("{")) {
    try {
      const data = JSON.parse(trimmed);
      if (data.eventSource === "s3.amazonaws.com" || data.userIdentity) return normalizeCloudTrail(trimmed);
      if (data.callerIpAddress || data.operationName) return normalizeAzureActivity(trimmed);
      return normalizeJSON(trimmed);
    } catch {
      // Fallback
    }
  }

  return normalizeSyslog(trimmed);
}
