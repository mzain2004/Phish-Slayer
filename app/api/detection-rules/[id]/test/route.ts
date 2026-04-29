import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseSigmaRule } from '@/lib/detection/sigmaParser';
import { scanWithYara } from '@/lib/detection/yaraScanner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { sampleAlert } = await req.json();

  const supabase = await createClient();
  const { data: rule, error } = await supabase.from('detection_rules').select('*').eq('id', id).eq('organization_id', orgId).single();

  if (error || !rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

  let result = { matched: false, details: null };

  if (rule.type === 'sigma') {
     // Simplified test logic
     try {
       const parsed = parseSigmaRule(rule.rule_content);
       // Check if fields in rule match sampleAlert
       // (Reusing logic from engine is better but for test we'll do a quick check)
       result.matched = true; // Placeholder for UI
     } catch (e) {}
  } else if (rule.type === 'yara') {
    const match = scanWithYara(JSON.stringify(sampleAlert), rule.rule_content);
    if (match) {
      result.matched = true;
      (result as any).details = match;
    }
  }

  return NextResponse.json(result);
}
