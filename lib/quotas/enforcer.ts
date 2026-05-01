import { supabaseAdmin } from '@/lib/supabase/admin';

export async function checkQuota(orgId: string, metric: string, increment: number = 1): Promise<{ allowed: boolean, remaining: number, limit: number }> {
    try {
        // 1. Get Plan Limits
        const { data: org } = await supabaseAdmin
            .from('organizations')
            .select('plan_limits')
            .eq('id', orgId)
            .single();

        if (!org || !org.plan_limits) {
            // Failsafe
            return { allowed: true, remaining: 100, limit: 100 };
        }

        const limits: Record<string, number> = org.plan_limits;
        const limit = limits[metric] || 0;

        // Unlimited
        if (limit === -1) {
            return { allowed: true, remaining: Infinity, limit };
        }

        // 2. Get Today's Usage
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

        const { data: usage } = await supabaseAdmin
            .from('quota_usage')
            .select('count')
            .eq('org_id', orgId)
            .eq('metric', metric)
            .eq('period_start', startOfDay)
            .single();

        const currentUsage = usage?.count || 0;
        const remaining = Math.max(0, limit - currentUsage);

        return {
            allowed: (currentUsage + increment) <= limit,
            remaining,
            limit
        };
    } catch (error) {
        console.error('[QuotaEnforcer] Check failed:', error);
        // Fail open if db error to not block production
        return { allowed: true, remaining: Infinity, limit: Infinity };
    }
}

export async function incrementUsage(orgId: string, metric: string, amount: number = 1): Promise<void> {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

        // Using RPC or raw UPSERT logic
        // Supabase REST doesn't have an exact equivalent to ON CONFLICT DO UPDATE SET count = count + amount
        // We can simulate it by selecting first, then inserting/updating, or using an RPC.
        // For this implementation, we will use a basic select/update pattern or a raw SQL RPC if available.
        // Assuming we created an RPC `increment_quota_usage` or we do it application-side for now.
        
        const { data: existing } = await supabaseAdmin
            .from('quota_usage')
            .select('id, count')
            .eq('org_id', orgId)
            .eq('metric', metric)
            .eq('period_start', startOfDay)
            .maybeSingle();

        if (existing) {
            await supabaseAdmin
                .from('quota_usage')
                .update({ count: existing.count + amount })
                .eq('id', existing.id);
        } else {
            await supabaseAdmin
                .from('quota_usage')
                .insert({
                    org_id: orgId,
                    metric: metric,
                    count: amount,
                    period_start: startOfDay,
                    period_end: endOfDay
                });
        }
    } catch (error) {
        console.error('[QuotaEnforcer] Increment failed:', error);
    }
}
