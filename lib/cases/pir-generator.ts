import { supabaseAdmin } from '@/lib/supabase/admin';
import { groqComplete } from '@/lib/ai/groq';

export async function generatePIR(caseId: string, orgId: string): Promise<string> {
    // 1. Collect Context
    const { data: caseData } = await supabaseAdmin.from('cases').select('*').eq('id', caseId).single();
    const { data: timeline } = await supabaseAdmin.from('case_timeline').select('*').eq('case_id', caseId).order('created_at', { ascending: true });
    const { data: evidence } = await supabaseAdmin.from('case_evidence').select('*').eq('case_id', caseId);

    const context = {
        title: caseData?.title,
        severity: caseData?.severity,
        status: caseData?.status,
        root_cause: caseData?.root_cause,
        timeline: timeline?.map(t => `[${t.created_at}] ${t.actor}: ${t.description}`),
        evidence_summary: evidence?.map(e => `${e.evidence_type}: ${e.collected_by}`)
    };

    // 2. Generate via Groq
    const prompt = `You are a senior security incident responder.
Generate a professional Post-Incident Review (PIR) document for this security case.

CASE CONTEXT:
${JSON.stringify(context, null, 2)}

Structured your response in Markdown with these sections:
# Executive Summary
# Incident Timeline
# Root Cause Analysis
# Impact Assessment
# Lessons Learned
# Recommendations for Prevention

Keep it technical, concise, and actionable.`;

    const responseText = await groqComplete("You are a senior security incident responder.", prompt);

    return responseText || 'Failed to generate PIR';
}
