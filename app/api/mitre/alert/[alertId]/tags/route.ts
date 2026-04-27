import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { getTechniqueById } from '@/lib/mitre/techniques';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ alertId: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { alertId } = await params;
  const supabase = await createClient();

  const { data: tags } = await supabase
    .from('mitre_alert_tags')
    .select('*')
    .eq('alert_id', alertId)
    .eq('organization_id', orgId);

  const enrichedTags = (tags || []).map(tag => {
    const details = getTechniqueById(tag.technique_id);
    return {
      ...tag,
      details
    };
  });

  return NextResponse.json(enrichedTags);
}
