import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { addEvidence, getEvidenceForCase } from '@/lib/forensics/evidence';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const evidenceSchema = z.object({
  type: z.enum(['log', 'screenshot', 'pcap', 'memory_dump', 'file_hash', 'network_capture', 'config']),
  title: z.string(),
  description: z.string().optional(),
  content: z.any(),
  tags: z.array(z.string()).default([]),
  mitreTechniques: z.array(z.string()).default([])
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await auth();
  const { id } = await params;
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const evidence = await getEvidenceForCase(id, orgId);
    return NextResponse.json(evidence);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { orgId, userId } = await auth();
  const { id } = await params;
  if (!orgId || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = evidenceSchema.parse(body);

    const evidence = await addEvidence(id, {
      ...validated,
      caseId: id,
      orgId,
      addedBy: userId
    });

    return NextResponse.json(evidence);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
