import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { calculateOrgCoverage } from '@/lib/mitre/coverage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('mitre_coverage')
    .select('*')
    .eq('organization_id', orgId)
    .single();

  const isStale = !existing || (new Date().getTime() - new Date(existing.last_calculated).getTime() > 3600000);

  if (isStale) {
    const coverage = await calculateOrgCoverage(orgId);
    return NextResponse.json(coverage);
  }

  return NextResponse.json(existing.coverage);
}
