import { createClient } from '@/lib/supabase/server';

export interface ThreatIntelResult {
  iocValue: string;
  iocType: string;
  vtScore?: number;
  vtTotal?: number;
  vtCategories?: any;
  vtLastAnalysisDate?: string | null;
  otxPulses?: number | null;
  otxTags?: string[] | null;
  abuseConfidence?: number | null;
  geoCountry?: string | null;
  geoAsn?: string | null;
  geoOrg?: string | null;
  isMalicious: boolean;
}

export async function enrichIoc(iocValue: string, iocType: string, orgId: string): Promise<ThreatIntelResult | null> {
  const supabase = await createClient();

  // Check cache
  const { data: cached } = await supabase
    .from('threat_intel_enrichments')
    .select('*')
    .eq('organization_id', orgId)
    .eq('ioc_value', iocValue)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached) {
    return {
      iocValue: cached.ioc_value,
      iocType: cached.ioc_type,
      vtScore: cached.vt_score,
      vtTotal: cached.vt_total,
      vtCategories: cached.vt_categories,
      vtLastAnalysisDate: cached.vt_last_analysis_date,
      otxPulses: cached.otx_pulses,
      otxTags: cached.otx_tags,
      abuseConfidence: cached.abuse_confidence,
      geoCountry: cached.geo_country,
      geoAsn: cached.geo_asn,
      geoOrg: cached.geo_org,
      isMalicious: cached.is_malicious,
    };
  }

  const results = await Promise.allSettled([
    // VirusTotal
    fetchVirusTotal(iocValue, iocType),
    // AbuseIPDB (IPs only)
    iocType === 'ip' ? fetchAbuseIPDB(iocValue) : Promise.resolve(null),
    // OTX AlienVault
    fetchOTX(iocValue, iocType),
  ]);

  const vt = results[0].status === 'fulfilled' ? results[0].value : null;
  const abuse = results[1].status === 'fulfilled' ? results[1].value : null;
  const otx = results[2].status === 'fulfilled' ? results[2].value : null;

  const isMalicious = 
    (vt?.malicious && vt.malicious > 3) || 
    (abuse?.abuseConfidenceScore && abuse.abuseConfidenceScore > 75) || 
    (otx?.pulseCount && otx.pulseCount > 5);

  const enrichmentResult: ThreatIntelResult = {
    iocValue,
    iocType,
    vtScore: vt?.malicious || 0,
    vtTotal: vt?.total || 0,
    vtCategories: vt?.categories || null,
    vtLastAnalysisDate: vt?.lastAnalysisDate || null,
    otxPulses: otx?.pulseCount || 0,
    otxTags: otx?.tags || [],
    abuseConfidence: abuse?.abuseConfidenceScore || 0,
    geoCountry: abuse?.countryCode || otx?.geoCountry || null,
    geoAsn: abuse?.isp || otx?.geoAsn || null,
    geoOrg: otx?.geoOrg || null,
    isMalicious: !!isMalicious,
  };

  // Store result
  await supabase.from('threat_intel_enrichments').upsert({
    organization_id: orgId,
    ioc_value: iocValue,
    ioc_type: iocType,
    vt_score: enrichmentResult.vtScore,
    vt_total: enrichmentResult.vtTotal,
    vt_categories: enrichmentResult.vtCategories,
    vt_last_analysis_date: enrichmentResult.vtLastAnalysisDate,
    otx_pulses: enrichmentResult.otxPulses,
    otx_tags: enrichmentResult.otxTags,
    abuse_confidence: enrichmentResult.abuseConfidence,
    geo_country: enrichmentResult.geoCountry,
    geo_asn: enrichmentResult.geoAsn,
    geo_org: enrichmentResult.geoOrg,
    is_malicious: enrichmentResult.isMalicious,
    enriched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  });

  return enrichmentResult;
}

async function fetchVirusTotal(value: string, type: string) {
  const apiKey = process.env.VIRUS_TOTAL_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = type === 'hash' ? 'files' : `${type}s`;
    const response = await fetch(`https://www.virustotal.com/api/v3/${endpoint}/${value}`, {
      headers: { 'x-apikey': apiKey },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats;
    return {
      malicious: stats?.malicious,
      total: (stats?.malicious || 0) + (stats?.harmless || 0) + (stats?.undetected || 0),
      categories: data.data?.attributes?.popular_threat_categories,
      lastAnalysisDate: data.data?.attributes?.last_analysis_date ? new Date(data.data.attributes.last_analysis_date * 1000).toISOString() : null,
    };
  } catch { return null; }
}

async function fetchAbuseIPDB(ip: string) {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=30`, {
      headers: { 'Key': apiKey, 'Accept': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch { return null; }
}

async function fetchOTX(value: string, type: string) {
  const apiKey = process.env.OTX_API_KEY;
  if (!apiKey) return null;

  try {
    const endpoint = type === 'hash' ? 'file' : type;
    const response = await fetch(`https://otx.alienvault.com/api/v1/indicators/${endpoint}/${value}/general`, {
      headers: { 'X-OTX-API-KEY': apiKey },
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      pulseCount: data.pulse_info?.count,
      tags: data.tags,
      geoCountry: data.country_code,
      geoAsn: data.asn,
      geoOrg: data.isp,
    };
  } catch { return null; }
}

export async function enrichAlertIocs(alertId: string, orgId: string): Promise<void> {
  const supabase = await createClient();
  const { data: alert } = await supabase.from('alerts').select('*').eq('id', alertId).single();
  if (!alert) return;

  const rawDataStr = JSON.stringify(alert.raw_data || {});
  
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/g;
  const hashRegex = /\b([a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})\b/g;
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

  const ips = Array.from(new Set(rawDataStr.match(ipRegex) || [])).slice(0, 5);
  const domains = Array.from(new Set(rawDataStr.match(domainRegex) || [])).slice(0, 3);
  const hashes = Array.from(new Set(rawDataStr.match(hashRegex) || [])).slice(0, 3);
  const urls = Array.from(new Set(rawDataStr.match(urlRegex) || [])).slice(0, 2);

  const allIocs = [
    ...ips.map(v => ({ value: v, type: 'ip' })),
    ...domains.map(v => ({ value: v, type: 'domain' })),
    ...hashes.map(v => ({ value: v, type: 'hash' })),
    ...urls.map(v => ({ value: v, type: 'url' })),
  ].slice(0, 10);

  await Promise.all(allIocs.map(ioc => enrichIoc(ioc.value, ioc.type, orgId)));

  await supabase.from('alerts').update({
    threat_intel_enriched: true,
    enriched_at: new Date().toISOString()
  }).eq('id', alertId).eq('org_id', orgId);
}
