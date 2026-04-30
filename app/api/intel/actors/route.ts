import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { THREAT_ACTORS } from '@/lib/intel/actor-profiles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createClient();

    // Fetch existing match data from DB for this org
    const { data: dbActors } = await supabase
        .from('threat_actors')
        .select('*')
        .eq('org_id', orgId);

    // Merge static profiles with dynamic match data
    const enrichedActors = THREAT_ACTORS.map(actor => {
        const matchData = dbActors?.find(a => a.actor_id === actor.id);
        return {
            ...actor,
            match_status: matchData || { match_confidence: 0, first_seen: null, last_seen: null }
        };
    });

    return NextResponse.json(enrichedActors);
}
