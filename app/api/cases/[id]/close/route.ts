import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { advanceCaseStatus } from '@/lib/cases/lifecycle';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    try {
        const result = await advanceCaseStatus(id, orgId, 'CLOSED', body.actor || 'Analyst', body.reason || 'Manual closure');
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
