import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getCachedEnrichment(orgId: string, iocType: string, iocValue: string, source: string): Promise<any | null> {
  const supabase = getAdminClient();
  const { data } = await supabase.from('enrichment_cache')
    .select('enrichment_data, expires_at')
    .eq('org_id', orgId)
    .eq('ioc_type', iocType)
    .eq('ioc_value', iocValue)
    .eq('source', source)
    .single();

  if (data && new Date(data.expires_at) > new Date()) {
    return data.enrichment_data;
  }
  return null;
}

export async function setCachedEnrichment(orgId: string, iocType: string, iocValue: string, source: string, data: any, ttlHours: number): Promise<void> {
  const supabase = getAdminClient();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();
  
  await supabase.from('enrichment_cache').upsert({
    org_id: orgId,
    ioc_type: iocType,
    ioc_value: iocValue,
    source,
    enrichment_data: data,
    expires_at: expiresAt
  }, { onConflict: 'org_id,ioc_type,ioc_value,source' });
}
