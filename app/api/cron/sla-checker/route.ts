import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkSlaBreach } from '@/lib/sla/tracker';
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
  const now = new Date().toISOString();

  // Fetch open cases with breached SLAs
  const { data: cases, error } = await supabase
    .from('cases')
    .select('id')
    .eq('sla_breached', false)
    .not('status', 'in', '("resolved","closed")')
    .lt('sla_due_at', now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let breachCount = 0;
  for (const c of cases) {
    const breached = await checkSlaBreach(c.id);
    if (breached) breachCount++;
  }

  return NextResponse.json({ status: 'completed', casesChecked: cases.length, breached: breachCount });
}
