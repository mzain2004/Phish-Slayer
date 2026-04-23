import { SupabaseClient } from "@supabase/supabase-js";
import { EnrichmentResult, EnrichmentSource } from "../types";

export async function enrichHash(hash: string, supabase: SupabaseClient): Promise<EnrichmentResult> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("ioc_store")
    .select("*")
    .eq("ioc_type", "hash")
    .eq("value", hash)
    .gte("last_seen", twentyFourHoursAgo)
    .maybeSingle();

  if (cached && cached.enrichment) {
    return { ...cached.enrichment, cached: true, enriched_at: new Date(cached.last_seen) };
  }

  const sources: EnrichmentSource[] = [];
  const results = await Promise.allSettled([
    // Source 1: VirusTotal
    (async (): Promise<EnrichmentSource> => {
      const apiKey = process.env.VIRUS_TOTAL_API_KEY;
      if (!apiKey) throw new Error("Missing VIRUS_TOTAL_API_KEY");
      const res = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
        headers: { "x-apikey": apiKey }
      });
      if (!res.ok && res.status !== 404) throw new Error(`VT failed: ${res.statusText}`);
      const data = res.status === 404 ? {} : await res.json();
      const maliciousCount = data.data?.attributes?.last_analysis_stats?.malicious || 0;
      return {
        name: "VirusTotal",
        malicious: maliciousCount > 3,
        score: maliciousCount,
        raw: data.data,
        error: null
      };
    })(),

    // Source 2: MalwareBazaar
    (async (): Promise<EnrichmentSource> => {
      const formData = new URLSearchParams();
      formData.append("query", "get_info");
      formData.append("hash", hash);
      const res = await fetch("https://mb-api.abuse.ch/api/v1/", {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      if (!res.ok) throw new Error(`MalwareBazaar failed: ${res.statusText}`);
      const data = await res.json();
      return {
        name: "MalwareBazaar",
        malicious: data.query_status === "ok",
        score: data.query_status === "ok" ? 1 : 0,
        raw: data,
        error: null
      };
    })()
  ]);

  results.forEach((res) => {
    if (res.status === "fulfilled") {
      sources.push(res.value);
    }
  });

  const vt = sources.find(s => s.name === "VirusTotal");
  const mb = sources.find(s => s.name === "MalwareBazaar");

  const finalMalicious = vt?.malicious === true || mb?.malicious === true;
  
  const result: EnrichmentResult = {
    ioc_type: "hash",
    value: hash,
    malicious: finalMalicious,
    confidence_score: finalMalicious ? 100 : 0,
    sources,
    cached: false,
    enriched_at: new Date(),
    raw_data: { vt: vt?.raw, mb: mb?.raw },
    tags: [...(vt?.raw?.tags || []), ...(mb?.raw?.tags || [])],
    country: null,
    asn: null,
    threat_type: finalMalicious ? "Known Malware" : null
  };

  await supabase.from("ioc_store").upsert({
    ioc_type: "hash",
    value: hash,
    enrichment: result,
    malicious: finalMalicious,
    confidence_score: result.confidence_score,
    last_seen: new Date().toISOString()
  }, { onConflict: "ioc_type,value" });

  return result;
}
