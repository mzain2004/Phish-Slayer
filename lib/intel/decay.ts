import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Daily job to decay confidence of IOCs.
 * confidence *= 0.95 per run.
 * If confidence < 0.20, is_active = false.
 * NEVER decay CISA KEV entries (tag: 'kev').
 */
export async function runConfidenceDecay() {
    console.log('Starting IOC confidence decay job...');

    // 1. Decay active IOCs that are not KEV
    const { data, error } = await supabaseAdmin.rpc('decay_ioc_confidence');

    if (error) {
        console.error('Error running confidence decay RPC:', error);
        // Fallback to manual update if RPC doesn't exist yet
        return manualDecay();
    }

    console.log('Confidence decay completed.');
}

async function manualDecay() {
    // Fetch active non-KEV IOCs
    const { data: iocs } = await supabaseAdmin
        .from('threat_iocs')
        .select('id, confidence, tags')
        .eq('is_active', true)
        .not('tags', 'cs', '{"kev"}');

    if (!iocs) return;

    for (const ioc of iocs) {
        const newConfidence = parseFloat((ioc.confidence * 0.95).toFixed(2));
        const isActive = newConfidence >= 0.20;

        await supabaseAdmin
            .from('threat_iocs')
            .update({
                confidence: newConfidence,
                is_active: isActive
            })
            .eq('id', ioc.id);
    }
}
