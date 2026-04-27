import { SupabaseClient } from "@supabase/supabase-js";
import { RawAlert, AutoCloseResult, FeedbackEntry, SuppressionRule } from "./types";

const KNOWN_SCANNER_CIDRS = ["45.33.32.0/24", "209.197.3.0/24", "71.6.135.0/24"];
const KNOWN_FP_RULE_IDS = ["5706", "5710", "5712", "5716", "554"];

export class AutoCloseEngine {
  private supabase: SupabaseClient;
  private organization_id: string;

  constructor(supabase: SupabaseClient, organization_id: string) {
    this.supabase = supabase;
    this.organization_id = organization_id;
  }

  /**
   * Checks if an IP is within a CIDR range.
   */
  private isIpInCidr(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split("/");
      const mask = ~(Math.pow(2, 32 - parseInt(bits, 10)) - 1);
      const ipInt = ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
      const rangeInt = range.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
      return (ipInt & mask) === (rangeInt & mask);
    } catch {
      return false;
    }
  }

  private async logAction(case_id: string, action: string, reason: string, rule_id?: string) {
    await this.supabase.from("case_timeline").insert({
      case_id,
      action: "AUTO_CLOSE_ACTION",
      actor: "system",
      details: { action, reason, rule_id }
    });
    
    if (action === "suppressed" || action === "auto_closed") {
      await this.supabase.from("cases").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", case_id).eq("organization_id", this.organization_id);
    }
  }

  private async incrementRuleHit(rule_id: string) {
    await this.supabase.rpc('increment_rule_hit', { rule_id_val: rule_id });
  }

  public async evaluateCase(case_id: string, alert: RawAlert): Promise<AutoCloseResult> {
    const timestamp = new Date();

    // Step 1: Check IP Whitelist
    const { data: ipMatch } = await this.supabase
      .from("suppression_rules")
      .select("*")
      .eq("rule_type", "ip")
      .eq("value", alert.source_ip)
      .eq("active", true)
      .maybeSingle();

    if (ipMatch) {
      await this.logAction(case_id, "suppressed", "ip_whitelist_match", ipMatch.id);
      await this.incrementRuleHit(ipMatch.id);
      return { case_id, action: "suppressed", reason: "ip_whitelist_match", suppression_rule_id: ipMatch.id, confidence: 100, timestamp };
    }

    // Step 2: Check CIDR Ranges
    const { data: cidrRules } = await this.supabase
      .from("suppression_rules")
      .select("*")
      .eq("rule_type", "cidr")
      .eq("active", true);

    const allCidrs = [...KNOWN_SCANNER_CIDRS, ...(cidrRules?.map(r => r.value) || [])];
    const matchingCidr = allCidrs.find(cidr => this.isIpInCidr(alert.source_ip, cidr));
    
    if (matchingCidr) {
      const dbRule = cidrRules?.find(r => r.value === matchingCidr);
      await this.logAction(case_id, "auto_closed", "known_scanner", dbRule?.id);
      if (dbRule) await this.incrementRuleHit(dbRule.id);
      return { case_id, action: "auto_closed", reason: "known_scanner", suppression_rule_id: dbRule?.id || null, confidence: 100, timestamp };
    }

    // Step 3: Check Rule ID suppression
    const isKnownFP = KNOWN_FP_RULE_IDS.includes(alert.rule_id);
    const { data: ruleMatch } = await this.supabase
      .from("suppression_rules")
      .select("*")
      .eq("rule_type", "rule_id")
      .eq("value", alert.rule_id)
      .eq("active", true)
      .maybeSingle();

    if (isKnownFP || ruleMatch) {
      await this.logAction(case_id, "auto_closed", "known_false_positive_rule", ruleMatch?.id);
      if (ruleMatch) await this.incrementRuleHit(ruleMatch.id);
      return { case_id, action: "auto_closed", reason: "known_false_positive_rule", suppression_rule_id: ruleMatch?.id || null, confidence: 95, timestamp };
    }

    // Step 4: Check Application Whitelist
    const { data: appRules } = await this.supabase
      .from("suppression_rules")
      .select("*")
      .eq("rule_type", "application")
      .eq("active", true);

    const rawLogStr = JSON.stringify(alert.raw_log || "");
    const matchingApp = appRules?.find(r => rawLogStr.includes(r.value));
    
    if (matchingApp) {
      await this.logAction(case_id, "auto_closed", "whitelisted_application", matchingApp.id);
      await this.incrementRuleHit(matchingApp.id);
      return { case_id, action: "auto_closed", reason: "whitelisted_application", suppression_rule_id: matchingApp.id, confidence: 90, timestamp };
    }

    // Step 5: Check FP Feedback Loop
    const { count, error: countError } = await this.supabase
      .from("feedback_entries")
      .select("*", { count: 'exact', head: true })
      .eq("source_ip", alert.source_ip)
      .eq("rule_id", alert.rule_id)
      .eq("analyst_decision", "false_positive");

    if (!countError && count && count >= 3) {
      await this.logAction(case_id, "auto_closed", "learned_false_positive");
      return { case_id, action: "auto_closed", reason: "learned_false_positive", suppression_rule_id: null, confidence: 85, timestamp };
    }

    return { case_id, action: "escalated", reason: "no_suppression_match", suppression_rule_id: null, confidence: 0, timestamp };
  }

  public async recordFeedback(entry: FeedbackEntry) {
    await this.supabase.from("feedback_entries").insert(entry);

    if (entry.analyst_decision === "false_positive") {
      const { count } = await this.supabase
        .from("feedback_entries")
        .select("*", { count: 'exact', head: true })
        .eq("source_ip", entry.source_ip)
        .eq("rule_id", entry.rule_id)
        .eq("analyst_decision", "false_positive");

      if (count && count >= 3) {
        // Auto-create suppression rule
        const { error } = await this.addSuppressionRule({
          rule_type: "ip",
          value: entry.source_ip,
          reason: `Auto-created from analyst feedback (FP count: ${count})`,
          created_by: "system",
          active: true
        } as any);

        if (!error) {
          console.info(`[autoclose] Auto-suppression rule created for ${entry.source_ip} based on analyst feedback`);
        }
      }
    }
  }

  public async getSuppressionsStats() {
    const { data: rules } = await this.supabase.from("suppression_rules").select("rule_type");
    const { data: feedback } = await this.supabase.from("feedback_entries").select("analyst_decision");
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: autoClosedLast24h } = await this.supabase
      .from("cases")
      .select("*", { count: 'exact', head: true })
      .eq("status", "closed")
      .gte("updated_at", twentyFourHoursAgo);

    const rulesByType = rules?.reduce((acc: any, r) => {
      acc[r.rule_type] = (acc[r.rule_type] || 0) + 1;
      return acc;
    }, {});

    const fpCount = feedback?.filter(f => f.analyst_decision === "false_positive").length || 0;
    const totalFeedback = feedback?.length || 0;

    return {
      total_suppressions: rules?.length || 0,
      rules_by_type: rulesByType,
      fp_rate: totalFeedback > 0 ? (fpCount / totalFeedback) * 100 : 0,
      auto_close_rate_24h: autoClosedLast24h || 0
    };
  }

  public async addSuppressionRule(rule: Partial<SuppressionRule>) {
    const { data: existing } = await this.supabase
      .from("suppression_rules")
      .select("id")
      .eq("rule_type", rule.rule_type)
      .eq("value", rule.value)
      .maybeSingle();

    if (existing) {
      return { error: "Suppression rule already exists for this type and value" };
    }

    return await this.supabase.from("suppression_rules").insert(rule);
  }
}
