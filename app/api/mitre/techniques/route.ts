import { NextRequest, NextResponse } from 'next/server';
import { getAllTechniques, getTechniquesByTactic } from '@/lib/mitre/techniques';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tactic = searchParams.get('tactic');

  if (tactic) {
    return NextResponse.json(getTechniquesByTactic(tactic));
  }

  return NextResponse.json(getAllTechniques());
}
