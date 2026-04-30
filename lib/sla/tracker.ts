import { createClient } from '@/lib/supabase/server';
import { dispatchNotification } from '../notifications/dispatcher';

const SLA_RULES: Record<string, number> = {
  critical: 4,     // 4 hours
  high: 24,       // 24 hours
  medium: 72,     // 3 days
  low: 168        // 7 days
};

export async function setSlaDeadline(caseId: string, severity: string): Promise<void> {
  const supabase = await createClient();
  const hours = SLA_RULES[severity.toLowerCase()] || 72;
  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  await supabase
    .from('cases')
    .update({ sla_due_at: deadline })
    .eq('id', caseId);
}

export async function checkSlaBreach(caseId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: caseData } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (!caseData || caseData.status === 'closed' || caseData.status === 'resolved') return false;

  const now = new Date();
  const deadline = new Date(caseData.sla_due_at);

  if (now > deadline && !caseData.sla_breached) {
    await supabase
      .from('cases')
      .update({
        sla_breached: true,
        sla_breached_at: now.toISOString()
      })
      .eq('id', caseId);

    // Dispatch notification
    await dispatchNotification(caseData.organization_id, {
      event_type: 'case_sla_breach',
      severity: 'high',
      case_id: caseId,
      message: `SLA Breach: ${caseData.title}. Case ${caseData.id} has breached its SLA of ${caseData.sla_due_at}`
    });

    return true;
  }

  return false;
}
