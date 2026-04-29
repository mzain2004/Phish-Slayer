import { SupabaseClient } from "@supabase/supabase-js";
import { OsintTarget, CollectorResult } from "./types";
import { DNSCollector } from "./collectors/dns";
import { WhoisCollector } from "./collectors/whois";
import { CrtshCollector } from "./collectors/crtsh";
import { WaybackCollector } from "./collectors/wayback";
import { EmailSecurityCollector } from "./collectors/emailSecurity";
import { IPGeoCollector } from "./collectors/ipGeo";
import { IPReputationCollector } from "./collectors/ipReputation";
import { ShodanCollector } from "./collectors/shodan";
import { BreachCollector } from "./collectors/breach";
import { FileHashCollector } from "./collectors/fileHash";
import { generateNarrative } from "./groqNarrator";

export async function runInvestigation(supabase: SupabaseClient, target: OsintTarget, investigationId: string) {
  const collectors: any[] = [];

  if (target.type === 'domain') {
    collectors.push(new DNSCollector(), new WhoisCollector(), new CrtshCollector(), new WaybackCollector(), new EmailSecurityCollector());
  } else if (target.type === 'ip') {
    collectors.push(new IPGeoCollector(), new IPReputationCollector(), new ShodanCollector());
  } else if (target.type === 'email') {
    collectors.push(new BreachCollector());
    // Also check domain of email
    const domain = target.value.split('@')[1];
    if (domain) {
      collectors.push(new DNSCollector()); // Simplified: will resolve the domain part
    }
  } else if (target.type === 'hash') {
    collectors.push(new FileHashCollector());
  }

  try {
    // 1. Run all in parallel
    const results = await Promise.allSettled(collectors.map(c => c.collect(target)));
    const successfulResults: CollectorResult[] = [];

    // 2. Process and Save results
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'fulfilled') {
        successfulResults.push(res.value);
        await supabase.from("osint_results").insert({
          investigation_id: investigationId,
          organization_id: target.orgId,
          collector: res.value.collector,
          raw_data: res.value.data,
          iocs_extracted: res.value.iocs
        });
      }
    }

    // 3. Generate Report
    const report = await generateNarrative(target, successfulResults);

    // 4. Update Investigation
    await supabase
      .from("osint_investigations")
      .update({
        status: 'complete',
        risk_score: report.riskScore,
        completed_at: new Date().toISOString()
      })
      .eq("id", investigationId);

    // 5. Save Report
    await supabase.from("osint_reports").insert({
      investigation_id: investigationId,
      organization_id: target.orgId,
      narrative: report.narrative,
      risk_score: report.riskScore,
      key_findings: report.keyFindings,
      recommendations: report.recommendations
    });

  } catch (err) {
    console.error("[orchestrator] Investigation failed:", err);
    await supabase.from("osint_investigations").update({ status: 'failed' }).eq("id", investigationId);
  }
}
