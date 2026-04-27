import { NextRequest, NextResponse } from 'next/server';
import { fetchCvssData } from '@/lib/enrichment/cvss';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ cveId: string }> }) {
  const { cveId } = await params;

  try {
    const data = await fetchCvssData(cveId);
    if (!data) return NextResponse.json({ error: 'CVE not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
