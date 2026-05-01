import { supabaseAdmin } from '@/lib/supabase/admin';
import { PlaybookStep, RunResult, ROLLBACK_MAPPING } from './playbook-types';
import { dispatchStep } from './action-dispatcher';
import { notify } from '@/lib/notifications/dispatcher';
import { deliverWebhook } from '@/lib/webhooks/delivery';

export async function executePlaybook(
    playbookId: string, 
    orgId: string, 
    context: any, 
    simulation: boolean = false
): Promise<RunResult> {

    // 1. Initialize Run
    const { data: run, error: runError } = await supabaseAdmin
        .from('playbook_runs')
        .insert({
            org_id: orgId,
            playbook_id: playbookId,
            case_id: context.case_id || null,
            alert_id: context.alert_id || null,
            status: 'RUNNING',
            results: []
        })
        .select()
        .single();

    if (runError) throw new Error(`Failed to initialize playbook run: ${runError.message}`);

    // 2. Fetch Playbook Steps
    const { data: playbook, error: pError } = await supabaseAdmin
        .from('playbooks')
        .select('steps')
        .eq('id', playbookId)
        .single();

    if (pError || !playbook) throw new Error('Playbook not found');
    const steps = playbook.steps as PlaybookStep[];

    const results: any[] = [];
    let currentStatus = 'COMPLETED';

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Update current step
        await supabaseAdmin.from('playbook_runs').update({ current_step_index: i }).eq('id', run.id);

        if (simulation) {
            results.push({ step_id: step.id, status: 'skipped', output: { message: 'WOULD_EXECUTE (Simulation)' } });
            continue;
        }

        const result = await dispatchStep(step, context);
        results.push({ step_id: step.id, ...result });

        if (result.status === 'success' && ['block_ip', 'isolate_host', 'disable_account', 'quarantine_email', 'revoke_aws_key'].includes(step.type)) {
            void deliverWebhook(orgId, 'containment.executed', { 
                run_id: run.id, 
                step_id: step.id, 
                action: step.type, 
                output: result.output 
            });
        }

        if (result.status === 'awaiting_approval') {
            await supabaseAdmin.from('playbook_runs').update({ status: 'AWAITING_APPROVAL', results }).eq('id', run.id);
            return { run_id: run.id, status: 'AWAITING_APPROVAL', steps_completed: i, results };
        }

        if (result.status === 'failed') {
            if (step.on_failure === 'rollback') {
                await executeRollback(run.id, orgId, i, results, context);
                currentStatus = 'ROLLED_BACK';
                break;
            } else if (step.on_failure === 'stop') {
                currentStatus = 'FAILED';
                break;
            }
        }
    }

    // 3. Finalize Run
    await supabaseAdmin.from('playbook_runs').update({
        status: currentStatus,
        results,
        completed_at: new Date().toISOString()
    }).eq('id', run.id);

    void notify(orgId, {
        severity: currentStatus === 'FAILED' ? 'high' : 'info',
        event_type: 'playbook_execution_finished',
        alert_id: context.alert_id,
        case_id: context.case_id,
        message: `Playbook execution finished with status: ${currentStatus}`
    });

    return { run_id: run.id, status: currentStatus, steps_completed: results.length, results };
}

async function executeRollback(runId: string, orgId: string, failedIndex: number, results: any[], context: any) {
    console.error(`[PlaybookExecutor] Rolling back run ${runId} from step ${failedIndex}`);
    
    // Fetch original steps
    const { data: runData } = await supabaseAdmin.from('playbook_runs').select('playbook_id').eq('id', runId).single();
    const { data: playbook } = await supabaseAdmin.from('playbooks').select('steps').eq('id', runData?.playbook_id).single();
    const steps = playbook?.steps as PlaybookStep[];

    // Rollback in reverse order
    for (let i = failedIndex - 1; i >= 0; i--) {
        const step = steps[i];
        const rollbackType = ROLLBACK_MAPPING[step.type];

        if (rollbackType && results[i].status === 'success') {
            await dispatchStep({ ...step, type: rollbackType }, context);
        }
    }
}
