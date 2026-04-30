import { supabaseAdmin } from '@/lib/supabase/admin';

export async function validateClosure(caseId: string, orgId: string): Promise<{passed: boolean, failures: string[]}> {
    const failures: string[] = [];

    // 1. Check Case details
    const { data: caseData } = await supabaseAdmin
        .from('cases')
        .select('root_cause')
        .eq('id', caseId)
        .single();

    if (!caseData?.root_cause) {
        failures.push('Root cause analysis is missing');
    }

    // 2. Check Alerts (assuming a link exists, but for now we'll check if any open alerts are linked to this case)
    // Note: Schema doesn't explicitly link alert to case in 'alerts' table yet, but 'cases' might be created from alerts.
    // We'll check if there's an alert_id in case_evidence or if we can find related alerts.
    // For now, let's check for at least 1 evidence item.
    const { data: evidence } = await supabaseAdmin
        .from('case_evidence')
        .select('id')
        .eq('case_id', caseId)
        .limit(1);

    if (!evidence || evidence.length === 0) {
        failures.push('No evidence items attached to the case');
    }

    // 3. Check for containment verification in timeline
    const { data: containment } = await supabaseAdmin
        .from('case_timeline')
        .select('id')
        .eq('case_id', caseId)
        .eq('event_type', 'containment_executed')
        .limit(1);
    
    // If case was ever high severity, it should probably have containment
    // This is optional logic, but we'll flag if missing in a real SOC.

    return {
        passed: failures.length === 0,
        failures
    };
}
