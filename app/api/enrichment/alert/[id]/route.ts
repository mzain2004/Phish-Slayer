import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { enrichAlert } from '@/lib/enrichment/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Run in background
  enrichAlert(id, orgId).catch(err => console.error(`Background enrichment failed for ${id}:`, err));

  return NextResponse.json({ status: 'triggered', alertId: id });
}
