import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requirePlan } from '@/lib/billing/plan-gate';
import { apiError } from '@/lib/api/response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await requirePlan(orgId, 'pro'))) {
    return apiError('UPGRADE_REQUIRED', 'Plan upgrade required', 403, { required_plan: 'pro' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const response = await fetch(`${appUrl}/api/cron/osint-brand`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ organization_id: orgId })
  });

  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error: error.error || 'Failed to trigger scan' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Manual scan triggered' });
}
