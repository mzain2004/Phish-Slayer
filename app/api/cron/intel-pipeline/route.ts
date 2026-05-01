import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { runIntelPipeline } from '@/lib/detection/intel-pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('Starting Intel-Driven Detection Pipeline...');
        
        const { data: orgs } = await supabaseAdmin.from('organizations').select('id');
        if (orgs) {
            for (const org of orgs) {
                await runIntelPipeline(org.id);
            }
        }

        return NextResponse.json({ success: true, message: 'Intel pipeline executed successfully' });
    } catch (error: any) {
        console.error('Intel Pipeline CRON Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    return POST(req);
}
