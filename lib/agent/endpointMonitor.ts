import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

// Configuration
const POLL_INTERVAL_MS = 10000;
const API_ENDPOINT = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/flag-ioc`
  : undefined;

// Cache to avoid spamming the same IPs
const seenConnections = new Set<string>();

// Beaconing detection: track connection frequency per process-IP pair
const connectionFrequency = new Map<string, number[]>();

// Process reputation
const SAFE_PROCESSES = new Set([
  "chrome", "firefox", "node", "nginx", "sshd", "python",
  "python3", "curl", "wget", "git", "npm", "next", "code", "slack", "zoom",
  "spotify", "docker", "kubectl", "postgres", "redis-server", "mongod",
]);

/**
 * Normalizes the osquery execution command based on the OS.
 */
function getOsqueryCommand(query: string): string {
  const escapedQuery = query.replace(/"/g, '\\"');
  return `osqueryi --json "${escapedQuery}"`;
}

/**
 * Fallback mechanism if osquery is not installed or fails
 */
async function fallbackNetworkCheck(): Promise<any[]> {
  const platform = os.platform();
  try {
    if (platform === "win32") {
      const { stdout } = await execAsync("netstat -ano");
      const lines = stdout.split("\\n").filter((l) => l.includes("ESTABLISHED"));
      return lines.map((line) => {
        const parts = line.trim().split(/\\s+/);
        return {
          name: "unknown_fallback",
          pid: parts[4] || "0",
          remote_address: parts[2]?.split(":")[0] || "unknown",
          remote_port: parts[2]?.split(":")[1] || "0",
        };
      });
    } else {
      const { stdout } = await execAsync("netstat -tnup");
      const lines = stdout.split("\\n").filter((l) => l.includes("ESTABLISHED"));
      return lines.map((line) => {
        const parts = line.trim().split(/\\s+/);
        const pidName = parts[6] || "/";
        return {
          name: pidName.split("/")[1] || "unknown_fallback",
          pid: pidName.split("/")[0] || "0",
          remote_address: parts[4]?.split(":")[0] || "unknown",
          remote_port: parts[4]?.split(":")[1] || "0",
        };
      });
    }
  } catch (error) {
    console.error("[EndpointMonitor] Fallback network check failed:", error);
    return [];
  }
}

/**
 * Detects beaconing behavior: 5+ connections to same target in < 60 seconds
 */
function checkBeaconing(processName: string, remoteAddress: string): boolean {
  const key = `${processName}-${remoteAddress}`;
  const now = Date.now();
  const timestamps = connectionFrequency.get(key) || [];
  timestamps.push(now);

  // Keep only timestamps from last 2 minutes to avoid memory leak
  const recent = timestamps.filter((t) => now - t < 120_000);
  connectionFrequency.set(key, recent);

  if (recent.length >= 5) {
    const span = recent[recent.length - 1] - recent[0];
    return span < 60_000;
  }
  return false;
}

/**
 * Polls active network connections using osquery
 */
async function pollNetworkActivity(userId: string) {
  if (!API_ENDPOINT) {
    console.error("[EndpointMonitor] NEXT_PUBLIC_SITE_URL not set. Skipping poll.");
    return;
  }

  const query = `
    SELECT p.name, p.pid, pos.remote_address, pos.remote_port 
    FROM process_open_sockets pos 
    JOIN processes p ON pos.pid = p.pid 
    WHERE pos.remote_address != '' 
      AND pos.remote_address != '127.0.0.1' 
      AND pos.remote_address != '::1'
      AND pos.remote_address != '0.0.0.0'
      AND pos.remote_address NOT LIKE '192.168.%'
      AND pos.remote_address NOT LIKE '10.%'
      AND pos.remote_address NOT LIKE '172.%';
  `;

  let connections: any[] = [];
  const command = getOsqueryCommand(query);

  try {
    const { stdout } = await execAsync(command);
    if (stdout.trim()) {
      connections = JSON.parse(stdout);
    }
  } catch (error: any) {
    console.warn(`[EndpointMonitor] osquery failed, using fallback: ${error.message}`);
    connections = await fallbackNetworkCheck();
  }

  // Process connections and find anomalies
  const anomalies = [];

  for (const conn of connections) {
    if (!conn.remote_address || conn.remote_address === "unknown") continue;

    const connectionKey = `${conn.pid}-${conn.remote_address}:${conn.remote_port}`;
    const processName = conn.name || "unknown";

    // Check beaconing regardless of seen status
    const isBeaconing = checkBeaconing(processName, conn.remote_address);

    // Check process reputation
    const suspiciousProcess = !SAFE_PROCESSES.has(processName.toLowerCase());

    if (!seenConnections.has(connectionKey) || isBeaconing) {
      seenConnections.add(connectionKey);

      console.log(
        `[EndpointMonitor] 🔍 ${isBeaconing ? "⚠️ BEACONING " : ""}Connection: ${processName} (PID: ${conn.pid}) -> ${conn.remote_address}:${conn.remote_port}${suspiciousProcess ? " [SUSPICIOUS PROCESS]" : ""}`
      );

      anomalies.push({
        userId,
        processName,
        pid: conn.pid,
        remoteAddress: conn.remote_address,
        remotePort: conn.remote_port,
        timestamp: new Date().toISOString(),
        threatLevel: isBeaconing ? "critical" : "medium",
        source: "agent_telemetry",
        isBeaconing,
        suspiciousProcess,
      });
    }
  }

  // POST anomalies to the dashboard API
  if (anomalies.length > 0) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.AGENT_SECRET || ""}`,
        },
        body: JSON.stringify({ events: anomalies }),
      });

      if (!response.ok) {
        console.error(`[EndpointMonitor] Failed to flag IOCs: ${response.status} ${response.statusText}`);
      } else {
        const result = await response.json();
        console.log(
          `[EndpointMonitor] 🛡️ Flagged ${anomalies.length} connections. Processed: ${result.processed}, Critical/High: ${result.flagged}`
        );
      }
    } catch (apiError) {
      console.error("[EndpointMonitor] API Request Error:", apiError);
    }
  }
}

/**
 * Starts the endpoint monitoring loop.
 */
export async function startMonitoring(userId: string) {
  console.log(`[EndpointMonitor] 🚀 Starting endpoint anomaly detection for user: ${userId}`);
  console.log(`[EndpointMonitor] Platform: ${os.platform()} | Polling Interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`[EndpointMonitor] API Endpoint: ${API_ENDPOINT || "NOT SET"}`);

  await pollNetworkActivity(userId);

  setInterval(async () => {
    await pollNetworkActivity(userId);
  }, POLL_INTERVAL_MS);
}
