import { createClient } from '@supabase/supabase-js';
import { getCachedEnrichment, setCachedEnrichment } from './cache';

export interface AssetEnrichment {
  hostname: string;
  ip: string;
  criticality: number;
  owner_team?: string;
  network_zone?: string;
  data_classification?: string[];
  is_production: boolean;
  is_eol: boolean;
  is_shadow_it: boolean;
  off_hours?: boolean;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function isOffHours(): boolean {
  const date = new Date();
  const hour = date.getHours();
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  return hour < 6 || hour > 19 || day === 0 || day === 6;
}

export async function enrichAsset(hostname: string, ip: string, orgId: string): Promise<AssetEnrichment> {
  const cacheKey = `${hostname}_${ip}`;
  const cached = await getCachedEnrichment(orgId, 'asset', cacheKey, 'all');
  if (cached) return cached;

  const supabase = getAdminClient();
  
  let result: AssetEnrichment = {
    hostname,
    ip,
    criticality: 3, // Default Standard
    is_production: false,
    is_eol: false,
    is_shadow_it: false,
    off_hours: isOffHours()
  };

  try {
    let query = supabase.from('assets').select('*').eq('org_id', orgId);
    if (hostname) query = query.eq('hostname', hostname);
    else if (ip) query = query.contains('ip_addresses', [ip]);
    
    const { data: asset } = await query.maybeSingle();

    if (asset) {
      result.criticality = asset.criticality;
      result.owner_team = asset.owner_team;
      result.network_zone = asset.network_zone;
      result.data_classification = asset.data_classification || [];
      result.is_production = asset.is_production;
      result.is_eol = asset.is_eol;
      
      // Update last seen
      await supabase.from('assets').update({ last_seen: new Date().toISOString() }).eq('id', asset.id).eq('org_id', orgId);
    } else {
      // Shadow IT detected
      result.is_shadow_it = true;
      result.criticality = 3; // Unknown maps to Standard
      
      await supabase.from('assets').insert({
        org_id: orgId,
        hostname: hostname || 'unknown',
        ip_addresses: ip ? [ip] : [],
        criticality: 3,
        tags: { shadow_it: true, auto_discovered: true }
      });
    }
  } catch (err) {
    console.error('[AssetEnricher] Error enriching asset', err);
  }

  await setCachedEnrichment(orgId, 'asset', cacheKey, 'all', result, 0.25); // 15 mins
  return result;
}
