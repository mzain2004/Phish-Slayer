import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || "PhishSlayerCron@2026!";
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    // Fire and forget l1-triage
    fetch(`${origin}/api/cron/l1-triage`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cronSecret}` }
    }).catch(err => console.error('L1 Triage trigger failed:', err));

    return NextResponse.json({ 
      triggered: true, 
      agents: ['L1 Triage'],
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to trigger agent run', details: error.message }, { status: 500 });
  }
}
