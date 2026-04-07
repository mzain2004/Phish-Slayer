import { NextResponse } from "next/server";
import os from "os";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const connectedAgents = (global as any).connectedAgents as
    | Map<string, any>
    | undefined;
  const ipConnectionMap = (global as any).ipConnectionMap as
    | Map<string, number[]>
    | undefined;

  let rate_limited_ips = 0;
  if (ipConnectionMap) {
    const now = Date.now();
    for (const timestamps of ipConnectionMap.values()) {
      const recent = timestamps.filter((t) => now - t < 60000);
      if (recent.length > 10) {
        rate_limited_ips++;
      }
    }
  }

  return NextResponse.json({
    active_ws_connections: connectedAgents ? connectedAgents.size : 0,
    rate_limited_ips,
    memory_used_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    cpu_count: os.cpus().length,
    uptime_seconds: Math.round(process.uptime()),
  });
}

export async function POST() {
  try {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        uptime: 0,
      },
      { status: 500 },
    );
  }
}
