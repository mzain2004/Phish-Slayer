import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { EnrichedAlert } from '../enrichment/enrichment-orchestrator';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export function fingerprintAlert(alert: EnrichedAlert): string {
  const payload = alert.payload || {};
  const components = [
    alert.rule_level?.toString() || '',
    payload.rule?.id?.toString() || '',
    payload.src_ip || '',
    payload.dst_ip || ''
  ].join('|');
  
  return crypto.createHash('sha256').update(components).digest('hex');
}

export async function deduplicateAlert(alert: EnrichedAlert, orgId: string): Promise<{ isDuplicate: boolean, clusterId?: string }> {
  const supabase = getAdminClient();
  const fingerprint = fingerprintAlert(alert);
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: existing } = await supabase.from('alerts')
    .select('id, cluster_id')
    .eq('org_id', orgId)
    .eq('fingerprint', fingerprint)
    .gte('created_at', fiveMinsAgo)
    .maybeSingle();

  if (existing) {
    return { isDuplicate: true, clusterId: existing.cluster_id || existing.id };
  }

  return { isDuplicate: false };
}
