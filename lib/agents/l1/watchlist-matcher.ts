import { createClient } from '@supabase/supabase-js';
import { EnrichedAlert } from '../enrichment/enrichment-orchestrator';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface WatchlistMatch {
  matched: boolean;
  entries: any[];
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export async function matchWatchlist(alert: EnrichedAlert, orgId: string): Promise<WatchlistMatch> {
  const supabase = getAdminClient();
  const { data: watchlists } = await supabase.from('watchlists').select('*').eq('org_id', orgId);

  if (!watchlists || watchlists.length === 0) return { matched: false, entries: [] };

  const matches: any[] = [];

  for (const entry of watchlists) {
    if (entry.ioc_type === 'ip') {
      if (alert.enrichment.ips.some(ip => ip.ip === entry.ioc_value)) matches.push(entry);
    } else if (entry.ioc_type === 'domain') {
      for (const d of alert.enrichment.domains) {
        if (d.domain === entry.ioc_value || levenshteinDistance(d.domain, entry.ioc_value) <= 2) {
          matches.push(entry);
        }
      }
    } else if (entry.ioc_type === 'hash') {
      if (alert.enrichment.hashes.some(h => h.hash === entry.ioc_value)) matches.push(entry);
    } else if (entry.ioc_type === 'regex') {
      // Custom pattern matching over payload
      try {
        const regex = new RegExp(entry.ioc_value);
        if (regex.test(JSON.stringify(alert.payload))) matches.push(entry);
      } catch (e) {
        // Invalid regex
      }
    }
  }

  return {
    matched: matches.length > 0,
    entries: matches
  };
}
