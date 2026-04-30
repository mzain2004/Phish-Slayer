import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { checkDeadlines } from '@/lib/compliance/deadline-agent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();
    
    // Trigger check on request
    void checkDeadlines(orgId);

    const { data, error } = await supabase
        .from('regulatory_deadlines')
        .select('*, cases(title)')
        .eq('org_id', orgId)
        .order('deadline_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
