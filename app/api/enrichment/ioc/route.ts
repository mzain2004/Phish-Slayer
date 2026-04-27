import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { enrichIoc } from '@/lib/enrichment/threatIntel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const iocSchema = z.object({
  iocValue: z.string(),
  iocType: z.enum(['ip', 'domain', 'hash', 'url']),
});

export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = iocSchema.parse(body);

    const result = await enrichIoc(validated.iocValue, validated.iocType, orgId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
