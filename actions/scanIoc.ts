'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { scanTarget } from '@/lib/scanners/threatScanner';
import { scoreCtiFinding } from '@/lib/ai/analyzer';
import { revalidatePath } from 'next/cache';

const scanIocSchema = z.object({
  ioc: z.string().min(1, 'IOC is required'),
});

/**
 * Server Action to scan an Indicator of Compromise (IOC).
 * 
 * Optimistic UI Pattern Suggestion:
 * Calling components can use React's `useTransition` and `useOptimistic` to show
 * a "pending" scan block in the UI immediately after invoking this action.
 * Because this action creates the 'pending' row in the database first,
 * the UI is guaranteed to reflect the pending state if the user refreshes,
 * and will automatically update to the final state once the Server Action completes
 * and revalidates the cache.
 */
export async function scanIoc(input: string) {
  try {
    // 1. Validate Input
    const { success, data, error: validationError } = scanIocSchema.safeParse({ ioc: input });
    if (!success) {
      throw new Error(`Validation failed: ${validationError.issues.map(e => e.message).join(', ')}`);
    }
    
    const target = data.ioc;
    const supabase = await createClient();

    // 2. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized: User not authenticated');
    }

    const date = new Date().toISOString();

    // 3. Insert Pending Scan Row
    const { data: pendingScan, error: insertError } = await supabase
      .from('scans')
      .insert({
        target,
        user_id: user.id,
        status: 'Pending',
        date,                        // already ISO string
        created_at: new Date().toISOString(),
        vulnerabilities_found: 0,
        log_output: null,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Failed to create pending scan record: ${insertError.message}`);
    }

    const scanId = pendingScan.id;

    // 4. Call VirusTotal (threatScanner)
    let finding;
    try {
      finding = await scanTarget(target);
    } catch (vtError: any) {
      let message = 'VirusTotal scan failed';
      if (vtError?.message?.includes('rate limit') || vtError?.status === 429) {
        message = 'VirusTotal rate limit reached. Try again in 60 seconds.';
      } else if (vtError?.message) {
        message += `: ${vtError.message}`;
      }
      await supabase.from('scans').update({ status: 'Failed', log_output: message }).eq('id', scanId);
      revalidatePath('/dashboard/scans');
      throw new Error(message);
    }

    await supabase
      .from('scans')
      .update({ log_output: JSON.stringify(finding, null, 2) })
      .eq('id', scanId);

    // 5. Call Gemini (analyzer)
    let aiData;
    try {
      aiData = await scoreCtiFinding(finding.summary);
    } catch (aiError) {
      console.error('[scanIoc] AI Analysis Error:', aiError);
      // We can continue even if AI fails, assigning defaults
    }

    const risk_score = aiData?.risk_score ?? 0;
    const summary = aiData?.ai_summary ?? 'Analysis currently unavailable.';
    const threat_category = aiData?.threat_category ?? 'Unknown';

    // 6. Update Scan Row with Results
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'Completed',
        verdict: finding.verdict,
        malicious_count: finding.maliciousCount,
        total_engines: finding.totalEngines,
        ai_summary: summary,
        risk_score: risk_score,
        threat_category: threat_category,
      })
      .eq('id', scanId);

    if (updateError) {
      console.error('[scanIoc] Failed to update scan record:', updateError);
      throw new Error(`Failed to save scan results: ${updateError.message}`);
    }

    // Refresh UI caches
    revalidatePath('/dashboard/scans');

    // 7. Return payload
    return {
      success: true,
      scanId,
      risk_score,
      summary,
      threat_category,
      verdict: finding.verdict,
      malicious_count: finding.maliciousCount,
      total_engines: finding.totalEngines,
    };

  } catch (err: any) {
    console.error('[scanIoc] Action Error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during the scan.',
    };
  }
}
