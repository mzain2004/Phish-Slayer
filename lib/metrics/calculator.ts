import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Calculates Mean Time To Detect (MTTD) for an organization.
 * Defined as the time between event timestamp and platform ingestion.
 */
export async function calculateMTTD(orgId: string, period: '24h' | '7d' | '30d'): Promise<number> {
    const interval = period === '24h' ? '1 day' : period === '7d' ? '7 days' : '30 days';

    // MTTD = AVG(ingested_at - timestamp_utc) from udm_events
    const { data, error } = await supabaseAdmin.rpc('calculate_org_mttd', {
        p_org_id: orgId,
        p_interval: interval
    });

    if (error) {
        console.error(`[MetricsCalculator] MTTD error:`, error);
        return 0;
    }

    return parseFloat(data) || 0;
}

/**
 * Calculates Mean Time To Respond (MTTR) for an organization.
 * Defined as the time between case creation and case closure.
 */
export async function calculateMTTR(orgId: string, period: '24h' | '7d' | '30d'): Promise<number> {
    const interval = period === '24h' ? '1 day' : period === '7d' ? '7 days' : '30 days';

    // MTTR = AVG(closed_at - created_at) from cases where status = 'CLOSED'
    const { data, error } = await supabaseAdmin.rpc('calculate_org_mttr', {
        p_org_id: orgId,
        p_interval: interval
    });

    if (error) {
        console.error(`[MetricsCalculator] MTTR error:`, error);
        return 0;
    }

    return parseFloat(data) || 0;
}

/**
 * Calculates the False Positive Rate for an organization.
 * SUM(fp_count) / SUM(fp_count + tp_count)
 */
export async function calculateFPRate(orgId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
        .from('detection_rules')
        .select('fp_count, tp_count')
        .eq('organization_id', orgId);

    if (error || !data) return 0;

    let totalFp = 0;
    let totalHits = 0;

    data.forEach(rule => {
        totalFp += rule.fp_count || 0;
        totalHits += (rule.fp_count || 0) + (rule.tp_count || 0);
    });

    if (totalHits === 0) return 0;
    return parseFloat((totalFp / totalHits).toFixed(4));
}
