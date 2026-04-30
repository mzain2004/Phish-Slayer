import { getCachedEnrichment, setCachedEnrichment } from './cache';
import { lookupIOC } from '@/lib/intel/ioc-lookup';

export interface DomainEnrichment {
  domain: string;
  virustotal?: any;
  whois?: any;
  dga_score?: number;
  threat_intel?: any;
}

export interface URLEnrichment {
  url: string;
  virustotal?: any;
  urlhaus?: any;
  phishtank?: any;
  threat_intel?: any;
}

async function fetchWithTimeout(url: string, options: any, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
}

async function getVirusTotal(value: string, type: 'domains' | 'urls'): Promise<any> {
  if (!process.env.VIRUSTOTAL_API_KEY) return null;
  
  let endpointPath = value;
  if (type === 'urls') {
    // VT URL ids are base64 without padding
    endpointPath = Buffer.from(value).toString('base64').replace(/=/g, '');
  }

  const res = await fetchWithTimeout(`https://www.virustotal.com/api/v3/${type}/${endpointPath}`, {
    headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY }
  });
  if (!res.ok) throw new Error(`VirusTotal HTTP ${res.status}`);
  const data = await res.json();
  const stats = data.data?.attributes?.last_analysis_stats;
  return {
    malicious: stats?.malicious,
    categories: data.data?.attributes?.categories,
    reputation: data.data?.attributes?.reputation
  };
}

async function getWhois(domain: string): Promise<any> {
  // Free public API for basic WHOIS
  const res = await fetchWithTimeout(`https://whoisjson.com/api/v1/whois?domain=${domain}`, {});
  if (!res.ok) return null;
  const data = await res.json();
  
  let daysOld = null;
  if (data.creation_date) {
    const created = new Date(data.creation_date);
    daysOld = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return {
    registrar: data.registrar?.name,
    registrant_org: data.registrant?.organization,
    registration_date: data.creation_date,
    days_old: daysOld,
    is_new: daysOld !== null ? daysOld < 30 : false
  };
}

function calculateDgaScore(domain: string): number {
  // Very naive placeholder for DGA score. 
  // Real implementation uses entropy and bigram analysis.
  const core = domain.split('.')[0] || domain;
  if (core.length > 20 && !core.includes('-')) return 80;
  return 0;
}

export async function enrichDomain(domain: string, orgId: string): Promise<DomainEnrichment> {
  const cached = await getCachedEnrichment(orgId, 'domain', domain, 'all');
  if (cached) return cached;

  const result: DomainEnrichment = { domain };

  const checks = [
    lookupIOC('domain', domain).then(d => result.threat_intel = d),
    getVirusTotal(domain, 'domains').then(d => result.virustotal = d),
    getWhois(domain).then(d => result.whois = d),
    Promise.resolve().then(() => { result.dga_score = calculateDgaScore(domain); })
  ];

  await Promise.allSettled(checks);

  await setCachedEnrichment(orgId, 'domain', domain, 'all', result, 6);
  return result;
}

export async function enrichURL(url: string, orgId: string): Promise<URLEnrichment> {
  const cached = await getCachedEnrichment(orgId, 'url', url, 'all');
  if (cached) return cached;

  const result: URLEnrichment = { url };

  const checks = [
    lookupIOC('url', url).then(d => result.threat_intel = d),
    getVirusTotal(url, 'urls').then(d => result.virustotal = d),
    // urlhaus and phishtank APIs require auth/setup not standard in env, placeholder for now
  ];

  await Promise.allSettled(checks);

  await setCachedEnrichment(orgId, 'url', url, 'all', result, 6);
  return result;
}
