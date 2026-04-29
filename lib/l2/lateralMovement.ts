import { SupabaseClient } from "@supabase/supabase-js";

export interface LateralMovementEvent {
  userId: string;
  machines: string[];
  timespan: string;
  pattern: string;
  confidence: number;
}

export async function detectLateralMovement(supabase: SupabaseClient, orgId: string, lookbackHours: number = 24): Promise<LateralMovementEvent[]> {
  try {
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

    const { data: events } = await supabase
      .from("alerts")
      .select("source_ip, raw_log, created_at")
      .eq("org_id", orgId)
      .filter("alert_type", "in", '("login","authentication","access")')
      .gte("created_at", since);

    if (!events || events.length === 0) return [];

    const userMap: Record<string, Set<string>> = {};
    const timeline: Record<string, any[]> = {};

    events.forEach(e => {
      const user = e.raw_log?.user || e.raw_log?.username;
      if (user && e.source_ip) {
        if (!userMap[user]) userMap[user] = new Set();
        userMap[user].add(e.source_ip);
        
        if (!timeline[user]) timeline[user] = [];
        timeline[user].push(new Date(e.created_at).getTime());
      }
    });

    const results: LateralMovementEvent[] = [];

    for (const [user, machines] of Object.entries(userMap)) {
      if (machines.size >= 3) {
        const times = timeline[user].sort((a, b) => a - b);
        const diff = times[times.length - 1] - times[0];
        
        if (diff < 2 * 60 * 60 * 1000) { // 2 hour window
          results.push({
            userId: user,
            machines: Array.from(machines),
            timespan: `${Math.round(diff / 60000)} minutes`,
            pattern: 'Multi-host login burst',
            confidence: 0.9
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.error("[lateral] Error:", err);
    return [];
  }
}
