import { SupabaseClient } from "@supabase/supabase-js";

export type EntityType = 'ip' | 'domain' | 'user' | 'email' | 'hash';

export interface Entity360Profile {
  entityType: EntityType;
  entityValue: string;
  riskScore: number;
  firstSeen: string | null;
  lastSeen: string | null;
  recentAlerts: any[];
  incidents: any[];
  relatedEntities: { type: string; value: string; relation: string }[];
  metadata: any;
}

export async function getEntityProfile(
  supabase: SupabaseClient,
  entityType: EntityType,
  entityValue: string,
  orgId: string
): Promise<Entity360Profile> {
  try {
    let recentAlerts: any[] = [];
    let incidents: any[] = [];
    let firstSeen: string | null = null;
    let lastSeen: string | null = null;
    let relatedEntities: { type: string; value: string; relation: string }[] = [];
    let riskScore = 0;
    let metadata: any = {};

    // 1. Fetch Alerts
    let alertQuery = supabase.from("alerts").select("*").eq("org_id", orgId);
    
    if (entityType === 'ip') {
      alertQuery = alertQuery.eq("source_ip", entityValue);
    } else if (entityType === 'user') {
      alertQuery = alertQuery.eq("raw_log->>user", entityValue);
    } else if (entityType === 'domain') {
      alertQuery = alertQuery.ilike("title", `%${entityValue}%`);
    }

    const { data: alerts } = await alertQuery.order("created_at", { ascending: false }).limit(20);
    recentAlerts = alerts || [];

    // 2. Fetch Cases (Incidents)
    let caseQuery = supabase.from("cases").select("*").eq("organization_id", orgId);
    if (entityType === 'ip') {
      caseQuery = caseQuery.eq("source_ip", entityValue);
    } else if (entityType === 'user') {
      caseQuery = caseQuery.eq("user_id", entityValue);
    }
    const { data: cases } = await caseQuery.limit(10);
    incidents = cases || [];

    // 3. Calculate Risk Score (Simplified)
    riskScore = Math.min(100, recentAlerts.length * 10 + incidents.length * 20);

    // 4. Time range
    if (recentAlerts.length > 0) {
      lastSeen = recentAlerts[0].created_at;
      firstSeen = recentAlerts[recentAlerts.length - 1].created_at;
    }

    // 5. Related Entities & Metadata
    if (entityType === 'ip') {
      const { data: assets } = await supabase.from("asset_inventory").select("*").contains("ip_addresses", [entityValue]);
      metadata.assets = assets || [];
      
      const users = new Set(recentAlerts.map(a => a.raw_log?.user).filter(Boolean));
      users.forEach(u => relatedEntities.push({ type: 'user', value: u as string, relation: 'Logged in from IP' }));
    }

    return {
      entityType,
      entityValue,
      riskScore,
      firstSeen,
      lastSeen,
      recentAlerts,
      incidents,
      relatedEntities,
      metadata
    };
  } catch (err) {
    console.error("[entity360] Error:", err);
    throw err;
  }
}
