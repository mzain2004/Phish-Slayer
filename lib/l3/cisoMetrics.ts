import { SupabaseClient } from "@supabase/supabase-js";

export interface CISOMetrics {
  mttd_seconds: number;
  mttr_seconds: number;
  alert_volume_daily: { date: string, count: number }[];
  sla_breach_rate: number;
  top_attack_types: { category: string, count: number }[];
  false_positive_rate: number;
  escalation_rate: number;
  analyst_performance: { name: string, handled: number, avg_triage_seconds: number }[];
}

export async function getCISOMetrics(supabase: SupabaseClient, orgId: string, days: number = 30): Promise<CISOMetrics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: alerts }, { data: cases }] = await Promise.all([
    supabase.from("alerts").select("*").eq("org_id", orgId).gte("created_at", since),
    supabase.from("cases").select("*").eq("organization_id", orgId).gte("created_at", since)
  ]);

  if (!alerts) throw new Error("Failed to fetch alerts");

  // 1. MTTD: avg(acknowledged_at - created_at)
  const ackedAlerts = alerts.filter(a => a.acknowledged_at);
  const totalTriageTime = ackedAlerts.reduce((sum, a) => 
    sum + (new Date(a.acknowledged_at).getTime() - new Date(a.created_at).getTime()), 0
  );
  const mttd = ackedAlerts.length > 0 ? totalTriageTime / ackedAlerts.length / 1000 : 0;

  // 2. MTTR: avg(resolved_at - created_at)
  const resolvedCases = (cases || []).filter(c => c.status === 'resolved' && c.created_at);
  const totalResolveTime = resolvedCases.reduce((sum, c) => 
    sum + (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()), 0 // Updated_at as proxy for resolved_at if not present
  );
  const mttr = resolvedCases.length > 0 ? totalResolveTime / resolvedCases.length / 1000 : 0;

  // 3. Daily Volume
  const dailyMap: Record<string, number> = {};
  alerts.forEach(a => {
    const date = a.created_at.split('T')[0];
    dailyMap[date] = (dailyMap[date] || 0) + 1;
  });
  const alert_volume_daily = Object.entries(dailyMap).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));

  // 4. SLA Breach Rate (> 4hr)
  const slaThreshold = 4 * 60 * 60 * 1000;
  const breached = alerts.filter(a => {
    if (!a.acknowledged_at) return (Date.now() - new Date(a.created_at).getTime()) > slaThreshold;
    return (new Date(a.acknowledged_at).getTime() - new Date(a.created_at).getTime()) > slaThreshold;
  });
  const sla_breach_rate = alerts.length > 0 ? breached.length / alerts.length : 0;

  // 5. Top Attack Types
  const typeMap: Record<string, number> = {};
  alerts.forEach(a => {
    typeMap[a.alert_type] = (typeMap[a.alert_type] || 0) + 1;
  });
  const top_attack_types = Object.entries(typeMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 6. FP Rate
  const fpCount = alerts.filter(a => a.is_false_positive).length;
  const false_positive_rate = alerts.length > 0 ? fpCount / alerts.length : 0;

  // 7. Escalation Rate
  const escalatedCount = alerts.filter(a => a.status === 'escalated').length;
  const escalation_rate = alerts.length > 0 ? escalatedCount / alerts.length : 0;

  // 8. Analyst Performance
  const analystMap: Record<string, { handled: number, totalTriage: number }> = {};
  ackedAlerts.forEach(a => {
    if (!a.acknowledged_by) return;
    if (!analystMap[a.acknowledged_by]) analystMap[a.acknowledged_by] = { handled: 0, totalTriage: 0 };
    analystMap[a.acknowledged_by].handled += 1;
    analystMap[a.acknowledged_by].totalTriage += (new Date(a.acknowledged_at).getTime() - new Date(a.created_at).getTime());
  });

  const analyst_performance = Object.entries(analystMap).map(([name, data]) => ({
    name, // In real app, join with profiles table
    handled: data.handled,
    avg_triage_seconds: data.totalTriage / data.handled / 1000
  }));

  return {
    mttd_seconds: Math.round(mttd),
    mttr_seconds: Math.round(mttr),
    alert_volume_daily,
    sla_breach_rate,
    top_attack_types,
    false_positive_rate,
    escalation_rate,
    analyst_performance
  };
}
