import { supabaseAdmin } from "@/lib/supabase/admin";

export const PLAN_RANK = {
  free: 0,
  pro: 1,
  enterprise: 2
} as const;

export type Plan = keyof typeof PLAN_RANK;

export async function requirePlan(orgId: string, required: Plan): Promise<boolean> {
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const currentPlan = (org?.plan || 'free') as Plan;
  
  return PLAN_RANK[currentPlan] >= PLAN_RANK[required];
}
