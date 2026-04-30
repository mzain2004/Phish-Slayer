import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();

  const { data: findingsCount } = await supabase
    .from('osint_findings')
    .select('id', { count: 'exact' })
    .eq('organization_id', orgId);

  const { data: lastScan } = await supabase
    .from('osint_findings')
    .select('created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    last_scan: lastScan?.created_at || null,
    findings_count: findingsCount?.length || 0
  });
}
