import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { buildAttackTimeline } from '@/lib/forensics/timeline';
import { getEvidenceForCase } from '@/lib/forensics/evidence';
import { logCustodyEvent } from '@/lib/forensics/chainOfCustody';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { orgId, userId } = await auth();
  const { id } = await params;
  if (!orgId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();
  
  const [timeline, evidence, report, custody] = await Promise.all([
    buildAttackTimeline(id, orgId),
    getEvidenceForCase(id, orgId),
    supabase.from('forensic_reports').select('*').eq('case_id', id).order('generated_at', { ascending: false }).limit(1).single(),
    supabase.from('forensic_custody').select('*').eq('case_id', id).order('created_at', { ascending: true })
  ]);

  const exportData = {
    caseId: id,
    exportedAt: new Date().toISOString(),
    exportedBy: userId,
    timeline,
    evidence,
    report: report.data?.report_data,
    custodyLog: custody.data
  };

  await logCustodyEvent(id, userId, 'exported', { format: 'json' });

  return NextResponse.json(exportData);
}
