import { getCachedEnrichment, setCachedEnrichment } from './cache';

export interface HashEnrichment {
  hash: string;
  type: string;
  virustotal?: any;
  malware_bazaar?: any;
  nsrl?: boolean;
}

async function fetchWithTimeout(url: string, options: any, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

async function getVirusTotal(hash: string): Promise<any> {
  if (!process.env.VIRUSTOTAL_API_KEY) return null;
  const res = await fetchWithTimeout(`https://www.virustotal.com/api/v3/files/${hash}`, {
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
  });
  if (!res.ok) throw new Error(`VirusTotal HTTP ${res.status}`);
  const data = await res.json();
  const stats = data.data?.attributes?.last_analysis_stats;
  return {
    malicious: stats?.malicious,
    suspicious: stats?.suspicious,
    family: data.data?.attributes?.popular_threat_classification?.popular_threat_name?.[0]?.value,
    first_seen: data.data?.attributes?.first_submission_date,
    last_seen: data.data?.attributes?.last_submission_date,
    file_type: data.data?.attributes?.type_description
  };
}

async function getMalwareBazaar(hash: string): Promise<any> {
  const formData = new URLSearchParams();
  formData.append("query", "get_info");
  formData.append("hash", hash);
  const res = await fetchWithTimeout("https://mb-api.abuse.ch/api/v1/", {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  if (!res.ok) throw new Error(`MB HTTP ${res.status}`);
  const data = await res.json();
  if (data.query_status === "ok" && data.data && data.data[0]) {
    return {
      tags: data.data[0].tags,
      signature: data.data[0].signature,
      file_type: data.data[0].file_type
    };
  }
  return null;
}

export async function enrichHash(hash: string, hashType: 'md5'|'sha1'|'sha256', orgId: string): Promise<HashEnrichment> {
  const cached = await getCachedEnrichment(orgId, 'hash', hash, 'all');
  if (cached) return cached;

  const result: HashEnrichment = { hash, type: hashType };

  const checks = [
    getVirusTotal(hash).then(d => result.virustotal = d),
    getMalwareBazaar(hash).then(d => result.malware_bazaar = d)
  ];

  await Promise.allSettled(checks);

  await setCachedEnrichment(orgId, 'hash', hash, 'all', result, 24 * 7); // 7 days
  return result;
}
