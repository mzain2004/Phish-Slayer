import { supabaseAdmin } from '@/lib/supabase/admin';

export async function updateRulePerformance(ruleId: string, isTruePositive: boolean, orgId: string) {

    try {
        // 1. Fetch current stats
        const { data: rule } = await supabaseAdmin
            .from('detection_rules')
            .select('tp_count, fp_count, status')
            .eq('id', ruleId)
            .single();

        if (!rule) return;

        const updates: any = {
            tp_count: rule.tp_count + (isTruePositive ? 1 : 0),
            fp_count: rule.fp_count + (isTruePositive ? 0 : 1),
            last_tested_at: new Date().toISOString()
        };

        // 2. Auto-Retirement Logic
        const totalHits = updates.tp_count + updates.fp_count;
        if (updates.fp_count > 10 && (updates.fp_count / totalHits) > 0.8) {
            updates.status = 'retired';
        }

        await supabaseAdmin
            .from('detection_rules')
            .update(updates)
            .eq('id', ruleId);

    } catch (error) {
        console.error('[RulePerformance] Failed to update performance:', error);
    }
}
