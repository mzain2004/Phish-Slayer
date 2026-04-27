import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executePlaybook } from '@/lib/playbooks/executor';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && (!authHeader || !safeCompare(authHeader.replace('Bearer ', ''), cronSecret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  // 1. Fetch critical/high alerts
  const { data: alerts, error: alertError } = await supabase
    .from('alerts')
    .select('*')
    .in('severity', ['critical', 'high'])
    .gt('created_at', fifteenMinsAgo);

  if (alertError) return NextResponse.json({ error: alertError.message }, { status: 500 });

  // 2. Fetch auto-trigger playbooks
  const { data: playbooks, error: playbookError } = await supabase
    .from('playbooks')
    .select('*')
    .eq('auto_trigger', true);

  if (playbookError) return NextResponse.json({ error: playbookError.message }, { status: 500 });

  let executionCount = 0;
  for (const alert of alerts) {
    // Check if already executed for this alert
    const { data: existing } = await supabase
      .from('playbook_executions')
      .select('id')
      .eq('trigger_data->alertId', alert.id)
      .maybeSingle();

    if (existing) continue;

    // Find matching playbook
    const matched = playbooks.find(p => {
      const severityMap: any = { critical: 4, high: 3, medium: 2, low: 1 };
      const threshold = severityMap[p.severity_threshold?.toLowerCase()] || 3;
      return severityMap[alert.severity?.toLowerCase()] >= threshold;
    });

    if (matched) {
      await executePlaybook(matched.id, { alertId: alert.id, ...alert }, alert.organization_id);
      executionCount++;
    }
  }

  return NextResponse.json({ status: 'completed', alertsChecked: alerts.length, playbooksTriggered: executionCount });
}
