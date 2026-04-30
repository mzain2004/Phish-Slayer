import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCompliancePosture } from '@/lib/compliance/framework-mapper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const posture = await getCompliancePosture(orgId);
        return NextResponse.json(posture);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
