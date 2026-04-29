import { createClient } from '@supabase/supabase-js';
import { TokenUsageStatus } from './types';

// Default limits per plan (mock logic for plan fetching, typically from DB)
const PLAN_LIMITS: Record<string, number> = {
  FREE: 50000,
  PRO: 200000,
  ENTERPRISE: 1000000,
};

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// In a real system, fetch from organizations table
async function getOrgPlanLimit(orgId: string): Promise<number> {
  const supabase = getAdminClient();
  const { data } = await supabase.from('organizations').select('plan').eq('id', orgId).single();
  const plan = data?.plan?.toUpperCase() || 'FREE';
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

export async function checkBudget(orgId: string, alertId: string, estimatedTokens: number): Promise<boolean> {
  const status = await getBudgetStatus(orgId, alertId);
  return (status.used + estimatedTokens) <= status.limit;
}

export async function recordUsage(orgId: string, alertId: string, tokensUsed: number, model: string): Promise<void> {
  const supabase = getAdminClient();
  const provider = model.includes('llama') || model.includes('mixtral') ? 'groq' : 'openai';
  
  const { error } = await supabase.from('token_usage').insert({
    org_id: orgId,
    alert_id: alertId,
    model,
    tokens_used: tokensUsed,
    provider,
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error(`[TokenBudget] Failed to record usage: ${error.message}`);
  }

  // Also log to soc_metrics (per instructions)
  await supabase.from('soc_metrics').insert({
    organization_id: orgId,
    metric_name: 'token_usage',
    metric_value: tokensUsed,
    timestamp: new Date().toISOString()
  });
}

export async function getBudgetStatus(orgId: string, alertId: string): Promise<TokenUsageStatus> {
  const supabase = getAdminClient();
  const limit = await getOrgPlanLimit(orgId);
  
  // Sum tokens used for this specific investigation/alert
  const { data, error } = await supabase.from('token_usage')
    .select('tokens_used')
    .eq('org_id', orgId)
    .eq('alert_id', alertId);

  let used = 0;
  if (!error && data) {
    used = data.reduce((acc, row) => acc + (row.tokens_used || 0), 0);
  }

  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? (used / limit) * 100 : 100;

  return {
    used,
    limit,
    remaining,
    pct
  };
}
