import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

// Configuration
const POLL_INTERVAL_MS = 10000;
const API_ENDPOINT = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/flag-ioc`
  : "http://localhost:3000/api/flag-ioc";

// Cache to avoid spamming the same IPs
const seenConnections = new Set<string>();

/**
 * Normalizes the osquery execution command based on the OS.
 */
function getOsqueryCommand(query: string): string {
  const platform = os.platform();
  const escapedQuery = query.replace(/"/g, '\\"');
  
  if (platform === "win32") {
    // Windows expects double quotes around the query
    return `osqueryi --json "${escapedQuery}"`;
  }
  // Linux / macOS
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
      // Basic heuristic for fallback: check established connections
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
 * Polls active network connections using osquery
 */
async function pollNetworkActivity(userId: string) {
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
    // Filter out typical empty / invalid IP addresses
    if (!conn.remote_address || conn.remote_address === "unknown") continue;

    const connectionKey = `${conn.pid}-${conn.remote_address}:${conn.remote_port}`;
    
    // If it's a new external connection we haven't seen during this session
    if (!seenConnections.has(connectionKey)) {
      seenConnections.add(connectionKey);
      
      console.log(`[EndpointMonitor] 🔍 New Connection Detected: ${conn.name} (PID: ${conn.pid}) -> ${conn.remote_address}:${conn.remote_port}`);
      
      anomalies.push({
        userId,
        processName: conn.name,
        pid: conn.pid,
        remoteAddress: conn.remote_address,
        remotePort: conn.remote_port,
        timestamp: new Date().toISOString(),
        threatLevel: "medium", // Default heuristic, API can upgrade this
        source: "agent_telemetry"
      });
    }
  }

  // If we found anomalies, POST them to the dashboard API
  if (anomalies.length > 0) {
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          events: anomalies
        })
      });

      if (!response.ok) {
        console.error(`[EndpointMonitor] Failed to flag IOCs to Supabase API: ${response.status} ${response.statusText}`);
      } else {
        console.log(`[EndpointMonitor] 🛡️ Successfully flagged ${anomalies.length} anomalous connections.`);
      }
    } catch (apiError) {
      console.error("[EndpointMonitor] API Request Error:", apiError);
    }
  }
}

/**
 * Starts the endpoint monitoring loop.
 * @param userId - The ID of the SOC analyst or current user context.
 */
export async function startMonitoring(userId: string) {
  console.log(`[EndpointMonitor] 🚀 Starting endpoint anomaly detection for user: ${userId}`);
  console.log(`[EndpointMonitor] Platform: ${os.platform()} | Polling Interval: ${POLL_INTERVAL_MS}ms`);

  // Initial poll execution
  await pollNetworkActivity(userId);

  // Set recurring interval
  setInterval(async () => {
    await pollNetworkActivity(userId);
  }, POLL_INTERVAL_MS);
}
