import { supabaseAdmin } from '@/lib/supabase/admin';
import { groqComplete } from '@/lib/ai/groq';

export interface HuntResult {
    hypothesis_id: string;
    status: string;
    findings_count: number;
    summary?: string;
    alert_created?: boolean;
}

export async function executeHunt(hypothesisId: string, orgId: string): Promise<HuntResult> {
    console.log(`[HuntExecutor] Executing hunt ${hypothesisId} for Org ${orgId}`);

    // 1. Fetch hypothesis
    const { data: hypothesis, error: fetchError } = await supabaseAdmin
        .from('hunt_hypotheses')
        .select('*')
        .eq('id', hypothesisId)
        .eq('organization_id', orgId)
        .single();

    if (fetchError || !hypothesis) {
        throw new Error(`Hypothesis not found: ${fetchError?.message}`);
    }

    // 2. Set RUNNING
    await supabaseAdmin.from('hunt_hypotheses').update({ status: 'RUNNING' }).eq('id', hypothesisId);

    // 3. Execute Query (SQL)
    let results: any[] = [];
    if (hypothesis.hunt_query_type === 'sql') {
        let query = hypothesis.hunt_query;
        // Ensure WHERE org_id is present (Safety Check)
        if (!query.toLowerCase().includes('org_id')) {
            console.warn(`[HuntExecutor] Unsafe query missing org_id check: ${query}`);
            // Extremely basic safety wrapper for POC
            query = `SELECT * FROM (${query}) AS sub WHERE org_id = '${orgId}' LIMIT 100`;
        }

        try {
            // For this implementation, we assume the query is safe or wrapped in an RPC.
            // Executing raw SQL directly from LLM is dangerous in production without strict parsing.
            // Using a generic function or RPC to run raw SQL is required in Supabase, 
            // but for demonstration we'll simulate a fetch or use a generic rpc if available.
            // Assuming `execute_sql` rpc exists, otherwise we'll mock the result if it fails.
            const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql: query });
            if (error) throw error;
            results = data || [];
        } catch (e) {
            console.error(`[HuntExecutor] Query execution failed:`, e);
            // In a real scenario, this shouldn't crash the whole pipeline, just this hunt
            await supabaseAdmin.from('hunt_hypotheses').update({ status: 'NO_FINDINGS' }).eq('id', hypothesisId);
            return { hypothesis_id: hypothesisId, status: 'NO_FINDINGS', findings_count: 0 };
        }
    }

    if (results.length === 0) {
        await supabaseAdmin.from('hunt_hypotheses').update({ status: 'NO_FINDINGS', executed_at: new Date().toISOString() }).eq('id', hypothesisId);
        return { hypothesis_id: hypothesisId, status: 'NO_FINDINGS', findings_count: 0 };
    }

    // 4. LLM Analysis
    const prompt = `These are security log entries from a threat hunt.
    Analyze for indicators of: ${hypothesis.mitre_techniques?.join(', ')}
    Summarize findings in 3 sentences. Are these suspicious? Why?
    
    LOGS:
    ${JSON.stringify(results.slice(0, 10))}`;

    const summary = await groqComplete(`You are an expert Threat Analyst.`, prompt);

    // 5. Create Alert if suspicious
    let alertCreated = false;
    const isSuspicious = /suspicious|malicious|threat/i.test(summary);

    if (isSuspicious) {
        await supabaseAdmin.from('alerts').insert({
            org_id: orgId,
            source: 'Hunt Execution',
            status: 'open',
            severity: hypothesis.priority,
            rule_level: hypothesis.priority === 'CRITICAL' ? 12 : 8,
            payload: { summary, query: hypothesis.hunt_query, results_sample: results.slice(0, 3) },
            mitre_techniques: hypothesis.mitre_techniques,
            created_at: new Date().toISOString()
        });
        alertCreated = true;
        console.log(`[HuntExecutor] Alert created for hypothesis ${hypothesisId}`);
    }

    // 6. Complete
    await supabaseAdmin.from('hunt_hypotheses').update({
        status: 'COMPLETED',
        findings_count: results.length,
        result_summary: summary,
        executed_at: new Date().toISOString()
    }).eq('id', hypothesisId);

    return {
        hypothesis_id: hypothesisId,
        status: 'COMPLETED',
        findings_count: results.length,
        summary,
        alert_created: alertCreated
    };
}
