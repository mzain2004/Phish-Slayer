import { supabaseAdmin } from '@/lib/supabase/admin';

const flagCache = new Map<string, { value: boolean; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function isEnabled(flag: string, orgId: string): Promise<boolean> {
  const cacheKey = `${flag}:${orgId}`;
  const cached = flagCache.get(cacheKey);

  if (cached && (Date.now() - cached.ts) < CACHE_TTL) {
    return cached.value;
  }

  try {
    // 1. Get Org Plan and Feature Override
    const { data: orgData } = await supabaseAdmin
      .from('organizations')
      .select('plan')
      .eq('id', orgId)
      .single();

    const { data: flagData } = await supabaseAdmin
      .from('feature_flags')
      .select('is_enabled, plan_required')
      .eq('flag_name', flag)
      .or(`org_id.eq.${orgId},org_id.is.null`)
      .order('org_id', { ascending: false }); // Org override first (non-null org_id)

    if (!flagData || flagData.length === 0) {
      return false;
    }

    // 2. Determine base enablement
    // If there's an org-specific entry, use it. Otherwise use platform default.
    const effectiveFlag = flagData[0];
    let enabled = effectiveFlag.is_enabled;

    // 3. Check Plan Requirement
    if (enabled && effectiveFlag.plan_required) {
      const plan = orgData?.plan || 'free';
      enabled = checkPlanRequirement(plan, effectiveFlag.plan_required);
    }

    flagCache.set(cacheKey, { value: enabled, ts: Date.now() });
    return enabled;
  } catch (error) {
    console.error(`[FeatureFlags] Error checking flag ${flag}:`, error);
    return false;
  }
}

function checkPlanRequirement(currentPlan: string, requiredPlan: string): boolean {
  const tiers = ['free', 'pro', 'enterprise'];
  const currentIdx = tiers.indexOf(currentPlan);
  const requiredIdx = tiers.indexOf(requiredPlan);

  return currentIdx >= requiredIdx;
}
