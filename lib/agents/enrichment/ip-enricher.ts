import { getCachedEnrichment, setCachedEnrichment } from './cache';
import { lookupIOC } from '@/lib/intel/ioc-lookup';

export interface IPEnrichment {
  ip: string;
  is_internal: boolean;
  maxmind?: any;
  abuseipdb?: any;
  virustotal?: any;
  shodan?: any;
  greynoise?: any;
  asn?: any;
  threat_intel?: any;
}

function isInternalIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false; // Basic IPv4 check
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  return false;
}

async function fetchWithTimeout(url: string, options: any, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

async function getAbuseIPDB(ip: string): Promise<any> {
  if (!process.env.ABUSEIPDB_API_KEY) return null;
  const res = await fetchWithTimeout(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
    headers: { 'Key': process.env.ABUSEIPDB_API_KEY, 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`AbuseIPDB HTTP ${res.status}`);
  const data = await res.json();
  return {
    confidence_score: data.data?.abuseConfidenceScore,
    usage_type: data.data?.usageType,
    domain: data.data?.domain,
    is_tor: data.data?.isTor,
    total_reports: data.data?.totalReports
  };
}

async function getVirusTotal(ip: string): Promise<any> {
  if (!process.env.VIRUSTOTAL_API_KEY) return null;
  const res = await fetchWithTimeout(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
  });
  if (!res.ok) throw new Error(`VirusTotal HTTP ${res.status}`);
  const data = await res.json();
  const stats = data.data?.attributes?.last_analysis_stats;
  return {
    malicious: stats?.malicious,
    suspicious: stats?.suspicious,
    reputation: data.data?.attributes?.reputation
  };
}

async function getShodan(ip: string): Promise<any> {
  if (!process.env.SHODAN_API_KEY) return null;
  const res = await fetchWithTimeout(`https://api.shodan.io/shodan/host/${ip}?key=${process.env.SHODAN_API_KEY}`, {});
  if (!res.ok) throw new Error(`Shodan HTTP ${res.status}`);
  const data = await res.json();
  return {
    open_ports: data.ports,
    services: data.data?.map((d: any) => d.product).filter(Boolean),
    vulns: data.vulns || []
  };
}

async function getGreyNoise(ip: string): Promise<any> {
  if (!process.env.GREYNOISE_API_KEY) return null;
  const res = await fetchWithTimeout(`https://api.greynoise.io/v3/community/${ip}`, {
    headers: { 'key': process.env.GREYNOISE_API_KEY }
  });
  if (!res.ok) throw new Error(`GreyNoise HTTP ${res.status}`);
  const data = await res.json();
  return {
    noise: data.noise,
    riot: data.riot,
    classification: data.classification
  };
}

async function getIPInfo(ip: string): Promise<any> {
  const res = await fetchWithTimeout(`https://ipinfo.io/${ip}/json`, {});
  if (!res.ok) throw new Error(`IPInfo HTTP ${res.status}`);
  const data = await res.json();
  return {
    asn: data.org,
    country: data.country,
    city: data.city
  };
}

export async function enrichIP(ip: string, orgId: string): Promise<IPEnrichment> {
  if (isInternalIp(ip)) {
    return { ip, is_internal: true };
  }

  const cached = await getCachedEnrichment(orgId, 'ip', ip, 'all');
  if (cached) return cached;

  const result: IPEnrichment = { ip, is_internal: false };

  const checks = [
    lookupIOC('ip', ip).then(d => result.threat_intel = d),
    getAbuseIPDB(ip).then(d => result.abuseipdb = d),
    getVirusTotal(ip).then(d => result.virustotal = d),
    getShodan(ip).then(d => result.shodan = d),
    getGreyNoise(ip).then(d => result.greynoise = d),
    getIPInfo(ip).then(d => {
      result.asn = d.asn;
      result.maxmind = { country: d.country, city: d.city };
    })
  ];

  await Promise.allSettled(checks);

  await setCachedEnrichment(orgId, 'ip', ip, 'all', result, 24);
  return result;
}
