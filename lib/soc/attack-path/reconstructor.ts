import { SupabaseClient } from "@supabase/supabase-js";
import { AttackPath, AttackPathNode, RawAlert } from "../types";
import { v4 as uuidv4 } from "uuid";

export class AttackPathReconstructor {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public async reconstructFromCase(case_id: string, org_id: string): Promise<AttackPath | null> {
    // Fetch case and root alert
    const { data: caseData } = await this.supabase
      .from("cases")
      .select("*")
      .eq("id", case_id)
      .single();

    if (!caseData) return null;

    let timeline: any[] = [];
    try {
      const { data: timelineData, error } = await this.supabase
        .from("case_timeline")
        .select("*")
        .eq("case_id", case_id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      timeline = timelineData || [];
    } catch (err) {
      console.warn("case_timeline table not found — skipping timeline evidence");
      // Continue with empty timeline
    }

    // Reconstruction logic using alerts and ioc_store (simplified for stub)
    const { data: alerts } = await this.supabase
      .from("alerts")
      .select("*")
      .eq("org_id", org_id)
      .limit(10);

    const nodes: AttackPathNode[] = (alerts || []).map(a => ({
      id: uuidv4(),
      stage: "execution",
      alert_id: a.id,
      timestamp: new Date(a.timestamp),
      description: a.title,
      affected_asset: a.agent_id || "unknown",
      evidence: a.raw_log
    }));

    return {
      id: uuidv4(),
      nodes,
      root_cause_alert_id: alerts?.[0]?.id || "",
      target_asset: caseData.affected_asset || "unknown",
      risk_score: 50,
      timeline_ms: 0
    };
  }
}
