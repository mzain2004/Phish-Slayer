import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export interface EndpointEvent {
  id: string;
  user_id: string;
  process_name: string;
  pid: string;
  remote_address: string;
  remote_port: number;
  country: string | null;
  country_code: string | null;
  city: string | null;
  isp: string | null;
  threat_level: string;
  threat_score: number;
  source: string;
  timestamp: string;
  raw_event: Record<string, unknown> | null;
  created_at: string;
}

export interface EndpointStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  uniqueIps: number;
  topProcesses: { name: string; count: number }[];
}

export async function getEndpointEvents(limit = 100, orgId?: string): Promise<EndpointEvent[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];
    const supabase = await createClient();

    let organizationId = orgId;
    if (!organizationId) {
      const membership = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      organizationId = membership?.data?.organization_id;
    }
    
    if (!organizationId) return [];

    try {
      const { data, error } = await supabase
        .from("endpoint_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[agentQueries] getEndpointEvents error:", error);
        return [];
      }
      return (data || []) as EndpointEvent[];
    } catch (error) {
      console.error("[agentQueries] getEndpointEvents query error:", error);
      return [];
    }
  } catch (err) {
    console.error("[agentQueries] getEndpointEvents exception:", err);
    return [];
  }
}

export async function getEndpointStats(): Promise<EndpointStats> {
  const empty: EndpointStats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    uniqueIps: 0,
    topProcesses: [],
  };

  try {
    const { userId } = await auth();
    if (!userId) return empty;
    const supabase = await createClient();

    // 1. Get organization_id for the user
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (!membership?.organization_id) return empty;

    // 2. Call RPC
    const { data, error } = await supabase.rpc("get_endpoint_stats", {
      p_organization_id: membership.organization_id,
    });

    if (error || !data) {
      if (error) console.error("[agentQueries] getEndpointStats RPC error:", error);
      return empty;
    }

    const res = data as any;
    const stats: EndpointStats = { ...empty };

    const counts = res.threat_level_counts || {};
    stats.critical = counts.critical || 0;
    stats.high = counts.high || 0;
    stats.medium = counts.medium || 0;
    stats.low = counts.low || 0;
    stats.total = stats.critical + stats.high + stats.medium + stats.low;

    stats.uniqueIps = (res.top_remote_addresses || []).length;
    stats.topProcesses = (res.top_processes || []).map((p: any) => ({
      name: p.process_name,
      count: p.count,
    }));

    return stats;
  } catch (err) {
    console.error("[agentQueries] getEndpointStats exception:", err);
    return empty;
  }
}

export async function getRecentCriticalEvents(
  limit = 5,
  orgId?: string,
): Promise<EndpointEvent[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];
    const supabase = await createClient();

    let organizationId = orgId;
    if (!organizationId) {
      const membership = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      organizationId = membership?.data?.organization_id;
    }

    if (!organizationId) return [];

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    try {
      const { data, error } = await supabase
        .from("endpoint_events")
        .select("*")
        .eq("organization_id", organizationId)
        .in("threat_level", ["critical", "high"])
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[agentQueries] getRecentCriticalEvents error:", error);
        return [];
      }
      return (data || []) as EndpointEvent[];
    } catch (error) {
      console.error(
        "[agentQueries] getRecentCriticalEvents query error:",
        error,
      );
      return [];
    }
  } catch (err) {
    console.error("[agentQueries] getRecentCriticalEvents exception:", err);
    return [];
  }
}
