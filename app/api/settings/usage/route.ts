import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('plan, plan_limits')
    .eq('id', orgId)
    .single();

  const { data: usage } = await supabaseAdmin
    .from('quota_usage')
    .select('metric, count, period_start, period_end')
    .eq('org_id', orgId);

  return NextResponse.json({
    plan: org?.plan || 'free',
    limits: org?.plan_limits || {},
    usage: usage || []
  });
}
