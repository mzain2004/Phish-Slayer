import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateClosure } from './checklist';
import { notify } from '@/lib/notifications/dispatcher';

export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CONTAINED' | 'REMEDIATED' | 'CLOSED' | 'ARCHIVED';

const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
    'OPEN': ['IN_PROGRESS'],
    'IN_PROGRESS': ['CONTAINED', 'OPEN'],
    'CONTAINED': ['REMEDIATED', 'IN_PROGRESS'],
    'REMEDIATED': ['CLOSED', 'CONTAINED'],
    'CLOSED': ['ARCHIVED', 'REMEDIATED'],
    'ARCHIVED': []
};

export async function advanceCaseStatus(caseId: string, orgId: string, newStatus: CaseStatus, actor: string, reason: string) {
    // 1. Fetch current status
    const { data: currentCase, error: fetchError } = await supabaseAdmin
        .from('cases')
        .select('status')
        .eq('id', caseId)
        .eq('organization_id', orgId)
        .single();

    if (fetchError || !currentCase) {
        throw new Error('Case not found');
    }

    const currentStatus = (currentCase.status || 'OPEN') as CaseStatus;

    // 2. Validate transition
    if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // 3. If CLOSED, run checklist
    if (newStatus === 'CLOSED') {
        const validation = await validateClosure(caseId, orgId);
        if (!validation.passed) {
            throw new Error(`Cannot close case: ${validation.failures.join(', ')}`);
        }
    }

    // 4. Update Case
    const { error: updateError } = await supabaseAdmin
        .from('cases')
        .update({ 
            status: newStatus, 
            updated_at: new Date().toISOString(),
            closed_at: newStatus === 'CLOSED' ? new Date().toISOString() : null
        })
        .eq('id', caseId);

    if (updateError) throw updateError;

    // 5. Add Timeline entry
    await supabaseAdmin.from('case_timeline').insert({
        case_id: caseId,
        org_id: orgId,
        event_type: 'status_changed',
        actor: actor,
        description: `Status changed from ${currentStatus} to ${newStatus}. Reason: ${reason}`,
        metadata: { old_status: currentStatus, new_status: newStatus }
    });

    // 6. Notify
    void notify(orgId, {
        severity: newStatus === 'CLOSED' ? 'info' : 'medium',
        event_type: 'case_status_changed',
        case_id: caseId,
        message: `Case status changed to ${newStatus}: ${reason}`
    });

    return { success: true, status: newStatus };
}
