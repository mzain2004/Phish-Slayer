import { createClient } from '@/lib/supabase/server';

export interface StepResult {
  stepId: string;
  action: string;
  input: any;
  output: any;
  status: 'success' | 'failed';
  error?: string;
  duration: number;
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  orgId: string;
  status: 'completed' | 'failed' | 'running';
  steps: StepResult[];
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
}

export async function executePlaybook(playbookId: string, triggerData: any, orgId: string, userId: string = 'system'): Promise<PlaybookExecution> {
  const supabase = await createClient();

  // 1. Fetch playbook
  const { data: playbook, error: playbookError } = await supabase
    .from('playbooks')
    .select('*')
    .eq('id', playbookId)
    .eq('organization_id', orgId)
    .single();

  if (playbookError || !playbook) throw new Error('Playbook not found');

  // 2. Initialize execution
  const execution: PlaybookExecution = {
    id: Math.random().toString(36).substr(2, 9),
    playbookId,
    orgId,
    status: 'running',
    steps: [],
    startedAt: new Date(),
    triggeredBy: userId
  };

  // Log execution start
  const { data: logRecord, error: logError } = await supabase
    .from('playbook_executions')
    .insert({
      playbook_id: playbookId,
      organization_id: orgId,
      status: 'running',
      trigger_data: triggerData,
      triggered_by: userId
    })
    .select()
    .single();

  if (logError) throw logError;

  const steps = playbook.steps || [];
  let overallStatus: 'completed' | 'failed' = 'completed';

  for (const step of steps) {
    const startTime = Date.now();
    try {
      const result = await executeStep(step, triggerData, orgId);
      execution.steps.push({
        stepId: step.id,
        action: step.action,
        input: step.params,
        output: result,
        status: 'success',
        duration: Date.now() - startTime
      });
    } catch (err: any) {
      execution.steps.push({
        stepId: step.id,
        action: step.action,
        input: step.params,
        output: null,
        status: 'failed',
        error: err.message,
        duration: Date.now() - startTime
      });

      if (!step.continueOnError) {
        overallStatus = 'failed';
        break;
      }
    }
  }

  execution.status = overallStatus;
  execution.completedAt = new Date();

  // 3. Update log
  await supabase
    .from('playbook_executions')
    .update({
      status: overallStatus,
      step_results: execution.steps,
      completed_at: execution.completedAt.toISOString()
    })
    .eq('id', logRecord.id);

  return execution;
}

async function executeStep(step: any, triggerData: any, orgId: string) {
  // Mock action execution logic
  // In reality, this would call connector APIs, Supabase, etc.
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Step timeout')), 30000));
  
  const actionPromise = (async () => {
    switch (step.action) {
      case 'block_ip':
        return { status: 'mocked_success', target: triggerData.ip };
      case 'send_notification':
        return { status: 'notified', channel: 'slack' };
      case 'enrich_ioc':
        return { status: 'enriched', ioc: triggerData.ioc };
      case 'isolate_host':
        return { status: 'isolated', host: triggerData.hostname };
      default:
        return { status: 'skipped', reason: 'unknown_action' };
    }
  })();

  return await Promise.race([actionPromise, timeout]);
}
