import { supabaseAdmin } from '@/lib/supabase/admin';
import { notify } from '@/lib/notifications/dispatcher';

/**
 * Checks for regulatory deadlines and alerts if near or breached.
 */
export async function checkDeadlines(orgId: string) {

    try {
        const { data: deadlines, error } = await supabaseAdmin
            .from('regulatory_deadlines')
            .select('*')
            .eq('org_id', orgId)
            .eq('status', 'pending');

        if (error || !deadlines) return;

        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        for (const deadline of deadlines) {
            const deadlineAt = new Date(deadline.deadline_at);

            if (deadlineAt < now) {
                // BREACHED
                await supabaseAdmin
                    .from('regulatory_deadlines')
                    .update({ status: 'breached' })
                    .eq('id', deadline.id);

                await notify(orgId, {
                    severity: 'critical',
                    event_type: 'compliance_breach',
                    case_id: deadline.case_id,
                    message: `CRITICAL: ${deadline.regulation} deadline (${deadline.deadline_type}) BREACHED at ${deadline.deadline_at}`
                });
            } else if (deadlineAt < in24Hours) {
                // URGENT WARNING
                await notify(orgId, {
                    severity: 'high',
                    event_type: 'compliance_warning',
                    case_id: deadline.case_id,
                    message: `WARNING: ${deadline.regulation} deadline (${deadline.deadline_type}) expires in less than 24 hours!`
                });
            }
        }
    } catch (error) {
        console.error('[DeadlineAgent] Failed to check deadlines:', error);
    }
}

/**
 * Utility to trigger a 72h GDPR notification deadline for a case.
 */
export async function triggerGdprDeadline(orgId: string, caseId: string) {
    const deadlineAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    await supabaseAdmin.from('regulatory_deadlines').insert({
        org_id: orgId,
        case_id: caseId,
        regulation: 'GDPR',
        deadline_type: 'notification_72h',
        deadline_at: deadlineAt.toISOString(),
        status: 'pending'
    });
}
