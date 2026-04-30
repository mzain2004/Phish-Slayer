import { createClient } from '@/lib/supabase/server';
import { enrichAlertWithCvss } from './cvss';
import { enrichAlertIocs } from './threatIntel';

export async function enrichAlert(alertId: string, orgId: string): Promise<void> {
  const supabase = await createClient();

  try {
    await Promise.all([
      enrichAlertWithCvss(alertId, orgId),
      enrichAlertIocs(alertId, orgId),
    ]);

    await supabase
      .from('alerts')
      .update({ enrichment_status: 'completed' })
      .eq('id', alertId)
      .eq('org_id', orgId);
  } catch (error) {
    console.error(`Enrichment failed for alert ${alertId}:`, error);
    await supabase
      .from('alerts')
      .update({ enrichment_status: 'partial' })
      .eq('id', alertId)
      .eq('org_id', orgId);
  }
}
