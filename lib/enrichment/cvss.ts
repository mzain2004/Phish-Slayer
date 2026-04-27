import { createClient } from '@/lib/supabase/server';

export interface CvssData {
  cveId: string;
  cvssV3Score: number | null;
  cvssV3Vector: string | null;
  cvssV3Severity: string | null;
  cvssV2Score: number | null;
  cvssV2Vector: string | null;
  description: string;
  publishedDate: string;
  affectedProducts: any[];
  cweIds: string[];
  references: any[];
  fetchedAt: string;
}

export async function fetchCvssData(cveId: string): Promise<CvssData | null> {
  const supabase = await createClient();

  // Check cache first
  const { data: cached } = await supabase
    .from('cve_cache')
    .select('*')
    .eq('cve_id', cveId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached) {
    return {
      cveId: cached.cve_id,
      cvssV3Score: cached.cvss_v3_score,
      cvssV3Vector: cached.cvss_v3_vector,
      cvssV3Severity: cached.cvss_v3_severity,
      cvssV2Score: cached.cvss_v2_score,
      cvssV2Vector: null, // V2 vector not in cache but score is
      description: cached.description,
      publishedDate: cached.published_date,
      affectedProducts: cached.affected_products || [],
      cweIds: cached.cwe_ids || [],
      references: cached.references || [],
      fetchedAt: cached.fetched_at,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const apiKey = process.env.NVD_API_KEY;
    const headers: HeadersInit = {};
    if (apiKey) headers['apiKey'] = apiKey;

    const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveID=${cveId}`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404) return null;
    if (!response.ok) {
      console.error(`NVD API error for ${cveId}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const vuln = data.vulnerabilities?.[0]?.cve;

    if (!vuln) return null;

    const cvssV3 = vuln.metrics?.cvssMetricV31?.[0]?.cvssData || vuln.metrics?.cvssMetricV30?.[0]?.cvssData;
    const cvssV2 = vuln.metrics?.cvssMetricV2?.[0]?.cvssData;

    const cvssData: CvssData = {
      cveId,
      cvssV3Score: cvssV3?.baseScore || null,
      cvssV3Vector: cvssV3?.vectorString || null,
      cvssV3Severity: cvssV3?.baseSeverity || null,
      cvssV2Score: cvssV2?.baseScore || null,
      cvssV2Vector: cvssV2?.vectorString || null,
      description: vuln.descriptions?.find((d: any) => d.lang === 'en')?.value || '',
      publishedDate: vuln.published,
      affectedProducts: vuln.configurations || [],
      cweIds: vuln.weaknesses?.map((w: any) => w.description?.[0]?.value).filter(Boolean) || [],
      references: vuln.references || [],
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    await supabase.from('cve_cache').upsert({
      cve_id: cveId,
      cvss_v3_score: cvssData.cvssV3Score,
      cvss_v3_vector: cvssData.cvssV3Vector,
      cvss_v3_severity: cvssData.cvssV3Severity,
      cvss_v2_score: cvssData.cvssV2Score,
      description: cvssData.description,
      published_date: cvssData.publishedDate,
      cwe_ids: cvssData.cweIds,
      affected_products: cvssData.affectedProducts,
      references: cvssData.references,
      fetched_at: cvssData.fetchedAt,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    return cvssData;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error(`Failed to fetch CVSS data for ${cveId}:`, error.message);
    return null;
  }
}

export function scoreToCriticality(score: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score > 0) return 'low';
  return 'info';
}

export async function enrichAlertWithCvss(alertId: string, orgId: string): Promise<void> {
  const supabase = await createClient();

  const { data: alert, error: fetchError } = await supabase
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .eq('organization_id', orgId)
    .single();

  if (fetchError || !alert) {
    console.error(`Alert ${alertId} not found for enrichment`);
    return;
  }

  const rawDataStr = JSON.stringify(alert.raw_data || {});
  const cveRegex = /CVE-\d{4}-\d{4,7}/g;
  const foundCves = Array.from(new Set(rawDataStr.match(cveRegex) || []));

  if (foundCves.length === 0) return;

  const cvssResults = await Promise.all(foundCves.map(cve => fetchCvssData(cve)));
  const validResults = cvssResults.filter((r): r is CvssData => r !== null);

  if (validResults.length === 0) return;

  const maxScore = Math.max(...validResults.map(r => r.cvssV3Score || r.cvssV2Score || 0));
  const severity = scoreToCriticality(maxScore);

  // Upgrade severity if CVSS is higher
  const severityMap = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
  const currentSev = alert.severity?.toLowerCase() as keyof typeof severityMap;
  const newSev = severity as keyof typeof severityMap;

  const updateData: any = {
    cvss_max_score: maxScore,
    cvss_severity: severity,
    cve_ids: foundCves,
  };

  if (severityMap[newSev] > (severityMap[currentSev] || 0)) {
    updateData.severity = severity;
  }

  await supabase
    .from('alerts')
    .update(updateData)
    .eq('id', alertId);
}
