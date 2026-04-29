import { createClient } from '@supabase/supabase-js';
import { AgentHandoff, DLQEntry } from './types';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function pushToDLQ(orgId: string, agentRunId: string | null, tier: string, errorObj: any, inputPayload: any): Promise<void> {
  const supabase = getAdminClient();
  const errorMessage = errorObj instanceof Error ? errorObj.message : String(errorObj);
  
  const { error } = await supabase.from('agent_dlq').insert({
    org_id: orgId,
    agent_run_id: agentRunId,
    tier,
    error_message: errorMessage,
    input_payload: inputPayload,
    retry_count: 0,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (error) {
    console.error(`[DLQ] Failed to push to DLQ: ${error.message}`);
  }
}

export async function replayFromDLQ(orgId: string, dlqEntryId: string): Promise<AgentHandoff> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('agent_dlq')
    .select('*')
    .eq('id', dlqEntryId)
    .eq('org_id', orgId)
    .single();

  if (error || !data) {
    throw new Error(`[DLQ] Entry not found or access denied: ${error?.message}`);
  }

  // Increment retry count
  await supabase.from('agent_dlq')
    .update({ retry_count: data.retry_count + 1 })
    .eq('id', dlqEntryId);

  // Return the original payload as an AgentHandoff (or cast)
  return data.input_payload as AgentHandoff;
}

export async function listDLQEntries(orgId: string): Promise<DLQEntry[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('agent_dlq')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[DLQ] Failed to list entries: ${error.message}`);
    return [];
  }

  return data as DLQEntry[];
}
