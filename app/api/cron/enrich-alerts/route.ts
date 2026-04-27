import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enrichAlert } from '@/lib/enrichment/orchestrator';
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
  
  // Fetch unenriched alerts from last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('id, organization_id')
    .eq('threat_intel_enriched', false)
    .gt('created_at', oneDayAgo)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let successCount = 0;
  for (const alert of alerts) {
    try {
      await enrichAlert(alert.id, alert.organization_id);
      successCount++;
      // 2s delay to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
      console.error(`Cron enrichment failed for alert ${alert.id}:`, err);
    }
  }

  return NextResponse.json({ status: 'completed', processed: alerts.length, success: successCount });
}
