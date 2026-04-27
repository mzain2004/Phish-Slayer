import { createClient } from '@/lib/supabase/server';
import { NormalizedEvent } from '../connectors/base';

export async function upsertAssetFromEvent(event: NormalizedEvent, orgId: string) {
  const supabase = await createClient();
  const { hostname, sourceIp } = event.normalizedFields;

  if (!hostname && !sourceIp) return;

  // Search for existing asset
  let query = supabase.from('asset_inventory').select('id, ip_addresses').eq('organization_id', orgId);
  
  if (hostname) {
    query = query.or(`hostname.eq."${hostname}",ip_addresses.cs.{"${sourceIp}"}`);
  } else {
    query = query.contains('ip_addresses', [sourceIp]);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    // Update existing
    const newIps = Array.from(new Set([...(existing.ip_addresses || []), sourceIp].filter(Boolean)));
    await supabase
      .from('asset_inventory')
      .update({
        last_seen: new Date().toISOString(),
        ip_addresses: newIps,
        asset_type: event.sourceType === 'edr' ? 'endpoint' : undefined
      })
      .eq('id', existing.id);
  } else {
    // Insert new
    await supabase.from('asset_inventory').insert({
      organization_id: orgId,
      hostname: hostname || `unknown-${sourceIp}`,
      ip_addresses: sourceIp ? [sourceIp] : [],
      asset_type: event.sourceType === 'edr' ? 'endpoint' : 'network_device',
      last_seen: new Date().toISOString(),
      first_seen: new Date().toISOString(),
      metadata: { last_event_source: event.source }
    });
  }
}

export async function getAssetRiskScore(assetId: string, orgId: string): Promise<number> {
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from('asset_inventory')
    .select('*')
    .eq('id', assetId)
    .single();

  if (!asset) return 0;

  // 1. Alerts in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Use hostname and IPs to find alerts
  let alertQuery = supabase.from('alerts')
    .select('id, severity')
    .eq('organization_id', orgId)
    .gt('created_at', sevenDaysAgo);

  if (asset.hostname) {
    alertQuery = alertQuery.or(`hostname.eq."${asset.hostname}",source_ip.in.(${asset.ip_addresses.join(',')})`);
  } else {
    alertQuery = alertQuery.in('source_ip', asset.ip_addresses);
  }

  const { data: alerts } = await alertQuery;

  let score = (alerts || []).reduce((acc, a) => {
    const weights: Record<string, number> = { critical: 20, high: 10, medium: 5, low: 2, info: 1 };
    return acc + (weights[a.severity?.toLowerCase()] || 0);
  }, 0);

  // 2. Factor in asset criticality
  const criticalityWeights: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0.5 };
  score *= criticalityWeights[asset.criticality] || 1;

  // 3. Open cases
  const { count: caseCount } = await supabase
    .from('cases')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'open'); // Simplified: should ideally link specific assets to cases

  score += (caseCount || 0) * 5;

  return Math.min(100, score);
}
