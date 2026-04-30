import { createClient } from '@supabase/supabase-js';
import { getCachedEnrichment, setCachedEnrichment } from './cache';

export interface UserEnrichment {
  username: string;
  department?: string;
  manager?: string;
  role?: string;
  account_age_days?: number;
  last_login?: string;
  mfa_status?: string;
  is_privileged?: boolean;
  account_risk_score?: number;
  peer_group_deviation?: string;
  source: string;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function enrichUser(username: string, orgId: string): Promise<UserEnrichment> {
  const cached = await getCachedEnrichment(orgId, 'user', username, 'all');
  if (cached) return cached;

  const supabase = getAdminClient();
  const result: UserEnrichment = { username, source: 'basic' };

  try {
    // Check connector table for user data (simulated)
    // Normally, this would join with actual AD/Okta synced tables
    const { data: userData } = await supabase.from('users') // Placeholder for directory table
      .select('*')
      .eq('organization_id', orgId)
      .eq('username', username)
      .maybeSingle();

    if (userData) {
      result.department = userData.department;
      result.manager = userData.manager;
      result.role = userData.role;
      result.last_login = userData.last_login;
      result.mfa_status = userData.mfa_status;
      result.source = 'directory';
      
      const isPrivileged = ['admin', 'root', 'administrator'].includes(username.toLowerCase()) || 
                           (userData.role && userData.role.toLowerCase().includes('admin'));
      result.is_privileged = Boolean(isPrivileged);
    } else {
      result.is_privileged = ['admin', 'root', 'administrator'].includes(username.toLowerCase());
    }

    // Account risk score (alert count)
    const { count } = await supabase.from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('user_id', username)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    result.account_risk_score = count || 0;
    
  } catch (err) {
    console.error('[UserEnricher] Error enriching user', err);
  }

  await setCachedEnrichment(orgId, 'user', username, 'all', result, 1);
  return result;
}
