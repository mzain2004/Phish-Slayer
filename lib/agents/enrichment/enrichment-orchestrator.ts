import { enrichIP, IPEnrichment } from './ip-enricher';
import { enrichDomain, enrichURL, DomainEnrichment, URLEnrichment } from './domain-enricher';
import { enrichHash, HashEnrichment } from './hash-enricher';
import { enrichEmailHeaders, EmailEnrichment } from './email-enricher';
import { enrichUser, UserEnrichment } from './user-enricher';
import { enrichAsset, AssetEnrichment } from './asset-enricher';
import { Alert } from '../runtime/types';
import { createClient } from '@supabase/supabase-js';

export interface EnrichmentData {
  ips: IPEnrichment[];
  domains: DomainEnrichment[];
  urls: URLEnrichment[];
  hashes: HashEnrichment[];
  emails: EmailEnrichment[];
  users: UserEnrichment[];
  assets: AssetEnrichment[];
}

export interface EnrichedAlert extends Alert {
  enrichment: EnrichmentData;
}

function extractIOCs(payload: any) {
  const str = JSON.stringify(payload);
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]\b/g;
  const hashRegex = /\b([a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})\b/g;
  
  return {
    ips: Array.from(new Set(str.match(ipRegex) || [])).slice(0, 5),
    domains: Array.from(new Set(str.match(domainRegex) || [])).slice(0, 5),
    hashes: Array.from(new Set(str.match(hashRegex) || [])).slice(0, 5)
  };
}

export async function orchestrateEnrichment(alert: Alert, orgId: string): Promise<EnrichedAlert> {
  const iocs = extractIOCs(alert.payload || {});
  
  const enrichmentData: EnrichmentData = {
    ips: [],
    domains: [],
    urls: [],
    hashes: [],
    emails: [],
    users: [],
    assets: []
  };

  const tasks: Promise<any>[] = [];

  for (const ip of iocs.ips) {
    tasks.push(enrichIP(ip, orgId).then(d => enrichmentData.ips.push(d)));
  }
  for (const domain of iocs.domains) {
    tasks.push(enrichDomain(domain, orgId).then(d => enrichmentData.domains.push(d)));
  }
  for (const hash of iocs.hashes) {
    tasks.push(enrichHash(hash, hash.length === 32 ? 'md5' : hash.length === 40 ? 'sha1' : 'sha256', orgId).then(d => enrichmentData.hashes.push(d)));
  }

  const payload = alert.payload || {};
  if (payload.username || payload.user) {
    tasks.push(enrichUser(payload.username || payload.user, orgId).then(d => enrichmentData.users.push(d)));
  }
  if (payload.hostname || payload.agent?.name || payload.src_ip) {
    tasks.push(enrichAsset(payload.hostname || payload.agent?.name || '', payload.src_ip || '', orgId).then(d => enrichmentData.assets.push(d)));
  }

  await Promise.allSettled(tasks);

  return {
    ...alert,
    enrichment: enrichmentData
  };
}
