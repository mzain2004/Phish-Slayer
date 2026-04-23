import { SupabaseClient } from "@supabase/supabase-js";
import { EnrichmentResult } from "../types";
import { enrichDomain } from "./domain";
import dns from "node:dns";

async function resolveTxt(domain: string): Promise<string[]> {
  return new Promise((resolve) => {
    dns.resolveTxt(domain, (err, records) => {
      if (err) resolve([]);
      else resolve(records.map(r => r.join(" ")));
    });
  });
}

export async function enrichEmail(email: string, supabase: SupabaseClient): Promise<EnrichmentResult> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("ioc_store")
    .select("*")
    .eq("ioc_type", "email")
    .eq("value", email)
    .gte("last_seen", twentyFourHoursAgo)
    .maybeSingle();

  if (cached && cached.enrichment) {
    return { ...cached.enrichment, cached: true, enriched_at: new Date(cached.last_seen) };
  }

  const domain = email.split("@")[1];
  if (!domain) throw new Error("Invalid email address");

  const domainEnrichment = await enrichDomain(domain, supabase);
  
  // Security Checks
  const spfRecords = await resolveTxt(domain);
  const hasSPF = spfRecords.some(r => r.includes("v=spf1"));
  
  const dmarcRecords = await resolveTxt(`_dmarc.${domain}`);
  const hasDMARC = dmarcRecords.some(r => r.includes("v=DMARC1"));
  const dmarcPolicy = dmarcRecords.find(r => r.includes("p="))?.match(/p=([^;]+)/)?.[1] || "none";

  const dkimRecords = await resolveTxt(`default._domainkey.${domain}`);
  const hasDKIM = dkimRecords.length > 0;

  // Spoofing Risk Score
  let riskScore = 0;
  if (!hasSPF) riskScore += 30;
  if (!hasDMARC) riskScore += 30;
  if (!hasDKIM) riskScore += 10; // Extra penalty for no DKIM
  if (dmarcPolicy === "none") riskScore += 20;
  if (domainEnrichment.threat_type === "Newly Registered Domain") riskScore += 20;

  const finalMalicious = riskScore > 60 || domainEnrichment.malicious;

  const result: EnrichmentResult = {
    ioc_type: "email",
    value: email,
    malicious: finalMalicious,
    confidence_score: Math.min(riskScore + (domainEnrichment.malicious ? 50 : 0), 100),
    sources: [
      { name: "SPF", malicious: !hasSPF, score: hasSPF ? 1 : 0, raw: spfRecords, error: null },
      { name: "DMARC", malicious: dmarcPolicy === "none", score: riskScore, raw: dmarcRecords, error: null },
      { name: "DKIM", malicious: !hasDKIM, score: hasDKIM ? 1 : 0, raw: dkimRecords, error: null },
      ...domainEnrichment.sources
    ],
    cached: false,
    enriched_at: new Date(),
    raw_data: { domainEnrichment, riskScore, dmarcPolicy },
    tags: domainEnrichment.tags,
    country: domainEnrichment.country,
    asn: null,
    threat_type: finalMalicious ? "Potential Spoofing/Phishing" : null
  };

  await supabase.from("ioc_store").upsert({
    ioc_type: "email",
    value: email,
    enrichment: result,
    malicious: finalMalicious,
    confidence_score: result.confidence_score,
    last_seen: new Date().toISOString()
  }, { onConflict: "ioc_type,value" });

  return result;
}
