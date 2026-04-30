import { NextRequest, NextResponse } from 'next/server';
import { pullAbuseCH } from '@/lib/intel/feeds/abuse-ch';
import { pullCISAKEV } from '@/lib/intel/feeds/cisa-kev';
import { pullNVD } from '@/lib/intel/feeds/nvd';
import { runConfidenceDecay } from '@/lib/intel/decay';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('Starting CTI Feed Ingestion...');
        
        // Run pulls in parallel where possible, but carefully to avoid rate limits
        await Promise.allSettled([
            pullAbuseCH(),
            pullCISAKEV(),
            pullNVD()
        ]);

        // Run decay
        await runConfidenceDecay();

        // Update last pulled at
        await supabaseAdmin
            .from('cti_feeds')
            .update({ last_pulled_at: new Date().toISOString() })
            .eq('is_active', true);

        return NextResponse.json({ success: true, message: 'CTI feeds ingested and confidence decayed' });
    } catch (error: any) {
        console.error('CTI CRON Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return POST(req);
}
