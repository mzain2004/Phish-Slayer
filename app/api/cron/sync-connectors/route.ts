import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createConnector } from '@/lib/connectors/factory';
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
  const { data: activeConfigs, error } = await supabase
    .from('connector_configs')
    .select('*')
    .eq('is_active', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];

  for (const configRecord of activeConfigs) {
    try {
      const connector = createConnector(configRecord);
      const since = configRecord.last_synced_at 
        ? new Date(configRecord.last_synced_at) 
        : new Date(Date.now() - 15 * 60 * 1000);

      const events = await connector.pullEvents(since);

      if (events.length > 0) {
        await supabase
          .from('connector_events')
          .insert(events.map(e => ({
            organization_id: configRecord.organization_id,
            connector_id: configRecord.id,
            event_type: e.source,
            severity: e.severity,
            raw_payload: e.rawPayload,
            normalized_fields: e.normalizedFields,
            ingested_at: new Date().toISOString()
          })));
      }

      await supabase
        .from('connector_configs')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', configRecord.id);

      results.push({ id: configRecord.id, status: 'success', events: events.length });
    } catch (err: any) {
      console.error(`Cron sync failed for ${configRecord.id}:`, err.message);
      results.push({ id: configRecord.id, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ results });
}
