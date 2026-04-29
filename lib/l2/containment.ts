import { SupabaseClient } from "@supabase/supabase-js";

export interface ContainmentResult {
  success: boolean;
  actionId: string;
  error?: string;
}

export async function blockIP(
  supabase: SupabaseClient,
  ip: string,
  orgId: string,
  analystId: string,
  reason: string,
  alertId?: string
): Promise<ContainmentResult> {
  const { data: action, error: dbError } = await supabase
    .from("containment_actions")
    .insert({
      organization_id: orgId,
      action_type: 'block_ip',
      target_value: ip,
      reason,
      executed_by: analystId,
      alert_id: alertId,
      status: 'pending'
    })
    .select()
    .single();

  if (dbError) throw dbError;

  try {
    // 1. Wazuh API Call (Example)
    const wazuhUrl = process.env.WAZUH_API_URL;
    if (wazuhUrl) {
       // Logic to call Wazuh active-response
       // const response = await fetch(...)
    }

    await supabase
      .from("containment_actions")
      .update({ status: 'success', executed_at: new Date().toISOString() })
      .eq("id", action.id);

    return { success: true, actionId: action.id };
  } catch (err: any) {
    await supabase
      .from("containment_actions")
      .update({ status: 'failed', response_data: { error: err.message } })
      .eq("id", action.id);
    return { success: false, actionId: action.id, error: err.message };
  }
}

export async function disableAccount(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  analystId: string,
  reason: string
): Promise<ContainmentResult> {
  const { data: action } = await supabase
    .from("containment_actions")
    .insert({
      organization_id: orgId,
      action_type: 'disable_account',
      target_value: userId,
      reason,
      executed_by: analystId,
      status: 'pending'
    })
    .select().single();

  try {
    // MS Graph API Integration placeholder
    await supabase.from("containment_actions").update({ status: 'success' }).eq("id", action.id);
    return { success: true, actionId: action.id };
  } catch (err: any) {
    return { success: false, actionId: action.id, error: err.message };
  }
}

export async function isolateEndpoint(
  supabase: SupabaseClient,
  agentId: string,
  orgId: string,
  analystId: string,
  reason: string
): Promise<ContainmentResult> {
  const { data: action } = await supabase
    .from("containment_actions")
    .insert({
      organization_id: orgId,
      action_type: 'isolate_endpoint',
      target_value: agentId,
      reason,
      executed_by: analystId,
      status: 'pending'
    })
    .select().single();

  try {
    // Wazuh endpoint isolation placeholder
    await supabase.from("containment_actions").update({ status: 'success' }).eq("id", action.id);
    return { success: true, actionId: action.id };
  } catch (err: any) {
    return { success: false, actionId: action.id, error: err.message };
  }
}
