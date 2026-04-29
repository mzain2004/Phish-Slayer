import { SupabaseClient } from "@supabase/supabase-js";

export interface BeaconingResult {
  srcIp: string;
  dstIp: string;
  dstPort: number;
  interval: number;
  connectionCount: number;
  confidence: number;
}

export async function detectBeaconing(supabase: SupabaseClient, orgId: string, lookbackHours: number = 24): Promise<BeaconingResult[]> {
  try {
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();
    
    // In a real system, we'd query a specialized 'network_flows' table.
    // Here we use 'alerts' as a proxy for network-related events.
    const { data: events } = await supabase
      .from("alerts")
      .select("source_ip, raw_log, created_at")
      .eq("org_id", orgId)
      .gte("created_at", since);

    if (!events || events.length < 5) return [];

    const pairs: Record<string, any[]> = {};
    events.forEach(e => {
      const dstIp = e.raw_log?.destination_ip;
      const dstPort = e.raw_log?.destination_port;
      if (dstIp && dstPort) {
        const key = `${e.source_ip}->${dstIp}:${dstPort}`;
        if (!pairs[key]) pairs[key] = [];
        pairs[key].push(new Date(e.created_at).getTime());
      }
    });

    const results: BeaconingResult[] = [];

    for (const [key, times] of Object.entries(pairs)) {
      if (times.length < 5) continue;
      
      const sortedTimes = times.sort((a, b) => a - b);
      const intervals: number[] = [];
      for (let i = 1; i < sortedTimes.length; i++) {
        intervals.push(sortedTimes[i] - sortedTimes[i-1]);
      }

      const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);
      
      // Coefficient of Variation
      const cv = stdDev / avgInterval;

      if (cv < 0.2) { // 20% variance threshold
        const [src, dstInfo] = key.split("->");
        const [dstIp, dstPort] = dstInfo.split(":");
        results.push({
          srcIp: src,
          dstIp,
          dstPort: parseInt(dstPort),
          interval: Math.round(avgInterval / 1000),
          connectionCount: times.length,
          confidence: Math.min(1, (1 - cv) * (times.length / 10))
        });
      }
    }

    return results;
  } catch (err) {
    console.error("[beaconing] Error:", err);
    return [];
  }
}
