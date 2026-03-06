'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeThreat, scoreCtiFinding } from '@/lib/ai/analyzer';
import { scanTarget } from '@/lib/scanners/threatScanner';
import { z } from 'zod';

// ── Discord Webhook Alert (fire-and-forget) ───────────────────────────
async function fireDiscordAlert(scan: {
  target: string;
  threat_category: string;
  risk_score: number;
  ai_summary: string;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return; // Silently skip if not configured

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🚨 Malicious Threat Detected',
          color: 16711680, // Red
          fields: [
            { name: 'Target', value: `\`${scan.target}\``, inline: true },
            { name: 'Category', value: scan.threat_category, inline: true },
            { name: 'Risk Score', value: `${scan.risk_score}/100`, inline: true },
            { name: 'AI Summary', value: scan.ai_summary.slice(0, 1024) },
          ],
          footer: { text: 'Phish-Slayer Command Center' },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch (err) {
    // Never crash the scan pipeline — log and move on
    console.error('Discord webhook failed (non-fatal):', err);
  }
}

// Zod Schemas for payload validation
const createIncidentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  severity: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  status: z.string().trim().optional(),
  assignee: z.string().trim().optional(),
  description: z.string().trim().optional(),
  timeline: z.array(z.any()).optional()
});

const resolveIncidentSchema = z.object({
  id: z.string().trim().min(1, "Incident ID is required"),
  comment: z.string().trim().min(1, "Resolution comment is required").max(1000, "Comment too long")
});

const deleteIncidentSchema = z.object({
  id: z.string().trim().min(1, "Incident ID is required")
});

const blockIpSchema = z.object({
  ipAddress: z.string().trim().min(1, "Indicator is required.")
});

const addToWhitelistSchema = z.object({
  target: z.string().trim().min(3, "Target is required.")
});

const launchScanSchema = z.object({
  target: z.string().trim().min(3).refine((val) => {
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(val);
    const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(val);
    return isIp || isDomain;
  }, { message: "Invalid target format detected. Must be an IP address or domain." })
});
export async function getIncidents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('incidents').select('*');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getScans() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('scans').select('*').order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function createIncident(data: any) {
  // Validate armor
  const parsed = createIncidentSchema.safeParse(data);
  if (!parsed.success) {
    const errorMessage = parsed.error.issues?.[0]?.message || 'Invalid incident payload';
    return { error: errorMessage };
  }
  const validData = parsed.data;

  const supabase = await createClient();
  
  const payload: any = {
    title: validData.title,
    severity: validData.severity || validData.priority || 'Medium',
    status: validData.status || 'Open Investigations',
    assignee: validData.assignee || 'Unassigned',
    description: validData.description || '',
    timeline: validData.timeline || []
  };
  
  if (payload.description) {
    try {
      const aiData = await analyzeThreat(payload.description);
      if (aiData) {
        payload.risk_score = aiData.risk_score;
        payload.threat_category = aiData.threat_category;
        payload.remediation_steps = aiData.remediation_steps;
      }
    } catch (err: any) {
      console.error('Failed to analyze threat with AI:', err);
    }
  }
  
  console.log('Inserting Incident:', payload);
  const { error } = await supabase.from('incidents').insert([payload]);
  
  if (error) {
    console.error('SUPABASE INSERT ERROR (createIncident):', error);
    return { error: error.message || 'Failed to create incident' };
  }
  
  revalidatePath('/dashboard/incidents');
  return { success: true };
}

export async function resolveIncident(id: string, comment: string) {
  // Validate armor
  const parsed = resolveIncidentSchema.safeParse({ id, comment });
  if (!parsed.success) {
    const errorMessage = parsed.error.issues?.[0]?.message || 'Invalid resolution payload';
    throw new Error(errorMessage);
  }
  const validId = parsed.data.id;
  const validComment = parsed.data.comment;

  const supabase = await createClient();
  
  // Fetch current incident to append to timeline
  const { data: incident, error: fetchError } = await supabase
    .from('incidents')
    .select('timeline')
    .eq('id', validId)
    .single();
    
  if (fetchError) {
    console.error('SUPABASE FETCH ERROR (resolveIncident):', fetchError);
    throw new Error(fetchError.message || 'Failed to fetch incident');
  }
  
  const now = new Date().toLocaleTimeString('en-US', { hour12: false });
  const newTimelineEvent = {
    id: (incident?.timeline?.length || 0) + 1,
    type: 'resolved',
    title: 'Resolved',
    time: now,
    notes: validComment
  };
  
  const newTimeline = [...(incident?.timeline || []), newTimelineEvent];
  
  const { error: updateError } = await supabase
    .from('incidents')
    .update({ 
      status: 'Resolved (Last 7 Days)', 
      timeline: newTimeline 
    })
    .eq('id', validId);
    
  if (updateError) {
    console.error('SUPABASE UPDATE ERROR (resolveIncident):', updateError);
    throw new Error(updateError.message || 'Failed to resolve incident');
  }
  
  revalidatePath('/dashboard');
}

export async function deleteIncident(id: string) {
  // Validate armor
  const parsed = deleteIncidentSchema.safeParse({ id });
  if (!parsed.success) {
    const errorMessage = parsed.error.issues?.[0]?.message || 'Invalid incident ID';
    throw new Error(errorMessage);
  }
  const validId = parsed.data.id;

  const supabase = await createClient();
  const { error } = await supabase.from('incidents').delete().eq('id', validId);
  
  if (error) {
    console.error('SUPABASE DELETE ERROR (deleteIncident):', error);
    throw new Error(error.message || 'Failed to delete incident');
  }
  
  revalidatePath('/dashboard');
}

export async function blockIp(ipAddress: string) {
  // Validate armor
  const parsed = blockIpSchema.safeParse({ ipAddress });
  if (!parsed.success) {
    const errorMessage = parsed.error.issues?.[0]?.message || 'Invalid IP address detected';
    throw new Error(errorMessage);
  }
  const validIp = parsed.data.ipAddress;

  const supabase = await createClient();

  // Determine type based on IP regex
  const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(validIp);

  console.log('[blockIp] Upserting indicator:', validIp, '| type:', isIp ? 'ipv4' : 'domain');
  
  // Upsert into proprietary_intel (handles duplicates gracefully)
  const { data, error } = await supabase
    .from('proprietary_intel')
    .upsert([{
      indicator: validIp,
      type: isIp ? 'ipv4' : 'domain',
      severity: 'critical',
      source: 'Manual Administrative Block',
    }], { onConflict: 'indicator' })
    .select();
    
  if (error) {
    console.error('SUPABASE UPSERT ERROR (blockIp):', JSON.stringify(error));
    throw new Error(error.message || 'Failed to block IP');
  }

  console.log('[blockIp] SUCCESS — upserted row:', JSON.stringify(data));

  // Siren: Discord notification for manual blocks
  fireDiscordAlert({
    target: validIp,
    threat_category: 'Manual Administrative Block',
    risk_score: 100,
    ai_summary: `Manual block executed by administrator. Indicator: ${validIp} (${isIp ? 'IPv4' : 'Domain'}) added to the proprietary intel vault with CRITICAL severity.`,
  });
  
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/intel');
  revalidatePath('/dashboard/incidents');
}

export async function addToWhitelist(target: string) {
  // Validate armor
  const parsed = addToWhitelistSchema.safeParse({ target });
  if (!parsed.success) {
    const errorMessage = parsed.error.issues?.[0]?.message || 'Invalid target format detected for whitelist.';
    return { error: errorMessage };
  }
  const validTarget = parsed.data.target;

  const supabase = await createClient();

  const { error } = await supabase.from('whitelist').insert([{ target: validTarget }]);
  
  if (error) {
    console.error('SUPABASE INSERT ERROR (addToWhitelist):', error);
    return { error: error.message || 'Failed to add target to whitelist' };
  }
  
  revalidatePath('/dashboard/threats');
  return { success: true };
}

export async function getWhitelist() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('whitelist').select('*').order('created_at', { ascending: false });
  if (error) console.error('SUPABASE FETCH ERROR (getWhitelist):', error);
  return data || [];
}

const removeFromWhitelistSchema = z.object({
  id: z.coerce.number().min(1, "Target ID is required")
});

export async function removeFromWhitelist(id: string) {
  const parsed = removeFromWhitelistSchema.safeParse({ id });
  if (!parsed.success) {
    throw new Error(parsed.error.issues?.[0]?.message || 'Invalid target ID');
  }

  const supabase = await createClient();
  const { error } = await supabase.from('whitelist').delete().eq('id', parsed.data.id);
  
  if (error) {
    console.error('SUPABASE DELETE ERROR (removeFromWhitelist):', error);
    throw new Error(error.message || 'Failed to remove from whitelist');
  }
  
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/threats');
  revalidatePath('/dashboard/intel');
}

export async function launchScan(target: string): Promise<{ error?: string }> {
  // Validate armor
  const parsed = launchScanSchema.safeParse({ target });
  if (!parsed.success) {
    const errorMessage = parsed.error.issues?.[0]?.message || 'Invalid target format detected.';
    return { error: errorMessage };
  }
  const validTarget = parsed.data.target;

  const supabase = await createClient();
  const date = new Date().toISOString();

  // ── Gate 1: Whitelist Check (instant Safe) ──────────────────────────
  const { data: whitelistHit } = await supabase
    .from('whitelist')
    .select('id, target')
    .eq('target', validTarget)
    .maybeSingle();

  if (whitelistHit) {
    const { error: wlInsertError } = await supabase.from('scans').insert([{
      target: validTarget,
      status: 'Completed',
      date,
      verdict: 'clean',
      malicious_count: 0,
      total_engines: 0,
      ai_summary: `Target cleared — matched against the organization whitelist. No external scan was performed.`,
      risk_score: 0,
      threat_category: 'Whitelisted',
      payload: whitelistHit,
    }]);

    if (wlInsertError) {
      console.error('Failed to insert whitelist-matched scan:', wlInsertError.message);
      return { error: 'Target is whitelisted but failed to record scan.' };
    }

    revalidatePath('/dashboard/scans');
    return {};
  }

  // ── Gate 2: Proprietary Intel Vault Check (instant Critical Threat) ─
  const { data: intelHit } = await supabase
    .from('proprietary_intel')
    .select('*')
    .eq('indicator', validTarget)
    .maybeSingle();

  if (intelHit) {
    const { error: intelInsertError } = await supabase.from('scans').insert([{
      target: validTarget,
      status: 'Completed',
      date,
      verdict: 'malicious',
      malicious_count: 1,
      total_engines: 1,
      ai_summary: `CRITICAL THREAT — Identified via Proprietary Local Intel. Severity: ${intelHit.severity?.toUpperCase() || 'HIGH'}. Source: ${intelHit.source || 'Internal Database'}. This indicator was matched against our private threat intelligence vault before any external queries were made.`,
      risk_score: 100,
      threat_category: 'Proprietary Local Intel',
      payload: intelHit,
    }]);

    if (intelInsertError) {
      console.error('Failed to insert intel-matched scan:', intelInsertError.message);
      return { error: 'Threat identified but failed to record scan.' };
    }

    revalidatePath('/dashboard/scans');

    // ── Siren: Discord Webhook for Intel Hit ──
    fireDiscordAlert({
      target: validTarget,
      threat_category: 'Proprietary Local Intel',
      risk_score: 100,
      ai_summary: `CRITICAL THREAT — Identified via Proprietary Local Intel. Severity: ${intelHit.severity?.toUpperCase() || 'HIGH'}. Source: ${intelHit.source || 'Internal Database'}.`,
    });

    return {};
  }

  // ── Gate 3: External Scan (VirusTotal → Gemini) ─────────────────────
  try {
    // Step 1: Call VirusTotal
    const finding = await scanTarget(validTarget);

    // Step 2: Call Gemini with the stripped payload
    const aiData = await scoreCtiFinding(finding.summary);

    // Step 3: Single INSERT — Completed
    const { error } = await supabase.from('scans').insert([{
      target: validTarget,
      status: 'Completed',
      date,
      verdict: finding.verdict,
      malicious_count: finding.maliciousCount,
      total_engines: finding.totalEngines,
      ai_summary: aiData?.ai_summary || 'Analysis currently unavailable.',
      risk_score: aiData?.risk_score || 0,
      threat_category: aiData?.threat_category || 'Unknown',
      payload: finding,
    }]);

    if (error) throw new Error(error.message);

    // ── Siren: Discord Webhook for External Malicious Scan ──
    if (finding.verdict === 'malicious') {
      fireDiscordAlert({
        target: validTarget,
        threat_category: aiData?.threat_category || 'Unknown',
        risk_score: aiData?.risk_score || 0,
        ai_summary: aiData?.ai_summary || 'Malicious target detected via VirusTotal.',
      });
    }

  } catch (err: any) {
    if (err?.message === 'RATE_LIMIT') {
      // Surface gracefully — no DB write needed
      return { error: 'Rate limit exceeded. Please wait 60 seconds before launching another scan.' };
    }

    console.error('launchScan error:', err);

    // Single INSERT — Failed (fire and forget, don't re-throw)
    const failPayload = { target: validTarget, status: 'Failed', date };
    const { error: failError } = await supabase.from('scans').insert([failPayload]);
    if (failError) console.error('Failed to insert Failed scan row:', failError.message);

    return { error: err?.message || 'Scan failed due to an unexpected error.' };
  }

  revalidatePath('/dashboard/scans');
  return {};
}

// ── Intel Vault Management ─────────────────────────────────────────────

export async function getIntelIndicators() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('proprietary_intel')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) console.error('SUPABASE FETCH ERROR (getIntelIndicators):', error);
  return data || [];
}

const removeIntelIndicatorSchema = z.object({
  id: z.coerce.string().trim().min(1, 'Indicator ID is required')
});

export async function removeIntelIndicator(id: string) {
  const parsed = removeIntelIndicatorSchema.safeParse({ id });
  if (!parsed.success) {
    throw new Error(parsed.error.issues?.[0]?.message || 'Invalid indicator ID');
  }

  const supabase = await createClient();
  const { error } = await supabase.from('proprietary_intel').delete().eq('id', parsed.data.id);

  if (error) {
    console.error('SUPABASE DELETE ERROR (removeIntelIndicator):', error);
    throw new Error(error.message || 'Failed to remove indicator');
  }

  revalidatePath('/dashboard/intel');
  revalidatePath('/dashboard/settings');
}

