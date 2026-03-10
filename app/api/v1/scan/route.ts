import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanTarget } from '@/lib/scanners/threatScanner';
import { scoreCtiFinding } from '@/lib/ai/analyzer';
import { safeCompare, sanitizeTarget } from '@/lib/security/safeCompare';

// ── Public API V1 — Scan Engine ──────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'x-api-key, Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  return handleScan(request);
}

export async function POST(request: NextRequest) {
  return handleScan(request);
}

async function handleScan(request: NextRequest) {
  const headers = corsHeaders();

  // ── Auth: API Key Check (timing-safe) ─────────────────────────────
  const apiKey = request.headers.get('x-api-key');
  const serverKey = process.env.PHISH_SLAYER_API_KEY;

  if (!serverKey || !apiKey || !safeCompare(apiKey, serverKey)) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid x-api-key header.' },
      { status: 401, headers }
    );
  }

  // ── Extract target ────────────────────────────────────────────────
  let rawTarget: string | null = null;

  if (request.method === 'GET') {
    rawTarget = request.nextUrl.searchParams.get('target');
  } else {
    try {
      const body = await request.json();
      rawTarget = body.target || null;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body. Expected: { "target": "example.com" }' },
        { status: 400, headers }
      );
    }
  }

  if (!rawTarget) {
    return NextResponse.json(
      { error: 'Missing required parameter: target' },
      { status: 400, headers }
    );
  }

  // ── Sanitize & validate target ────────────────────────────────────
  const { target: validTarget, error: sanitizeError } = sanitizeTarget(rawTarget);
  if (sanitizeError || !validTarget) {
    return NextResponse.json(
      { error: sanitizeError || 'Invalid target.' },
      { status: 400, headers }
    );
  }

  try {
    const supabase = await createClient();
    const date = new Date().toISOString();

    // ── Gate 1: Whitelist Check ──────────────────────────────────
    const { data: whitelistHit } = await supabase
      .from('whitelist')
      .select('id, target')
      .eq('target', validTarget)
      .maybeSingle();

    if (whitelistHit) {
      const result = {
        target: validTarget,
        verdict: 'clean',
        risk_score: 0,
        threat_category: 'Whitelisted',
        ai_summary: 'Target cleared — matched against the organization whitelist.',
        malicious_count: 0,
        total_engines: 0,
        source: 'whitelist',
        scan_date: date,
      };

      await supabase.from('scans').insert([{
        target: validTarget,
        status: 'Completed',
        date,
        verdict: 'clean',
        malicious_count: 0,
        total_engines: 0,
        ai_summary: result.ai_summary,
        risk_score: 0,
        threat_category: 'Whitelisted',
        payload: whitelistHit,
      }]);

      return NextResponse.json({ success: true, data: result }, { headers });
    }

    // ── Gate 2: Proprietary Intel Vault ──────────────────────────
    const { data: intelHit } = await supabase
      .from('proprietary_intel')
      .select('*')
      .eq('indicator', validTarget)
      .maybeSingle();

    if (intelHit) {
      const result = {
        target: validTarget,
        verdict: 'malicious',
        risk_score: 100,
        threat_category: 'Proprietary Local Intel',
        ai_summary: `CRITICAL THREAT — Identified via Proprietary Local Intel. Severity: ${intelHit.severity?.toUpperCase() || 'HIGH'}. Source: ${intelHit.source || 'Internal Database'}.`,
        malicious_count: 1,
        total_engines: 1,
        source: 'proprietary_intel',
        scan_date: date,
      };

      await supabase.from('scans').insert([{
        target: validTarget,
        status: 'Completed',
        date,
        verdict: 'malicious',
        malicious_count: 1,
        total_engines: 1,
        ai_summary: result.ai_summary,
        risk_score: 100,
        threat_category: 'Proprietary Local Intel',
        payload: intelHit,
      }]);

      // Discord webhook (fire-and-forget)
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🚨 API Scan — Malicious Threat Detected',
              color: 16711680,
              fields: [
                { name: 'Target', value: `\`${validTarget}\``, inline: true },
                { name: 'Category', value: 'Proprietary Local Intel', inline: true },
                { name: 'Risk Score', value: '100/100', inline: true },
                { name: 'AI Summary', value: result.ai_summary.slice(0, 1024) },
              ],
              footer: { text: 'Phish-Slayer API v1' },
              timestamp: new Date().toISOString(),
            }],
          }),
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, data: result }, { headers });
    }

    // ── Gate 3: External Scan (VirusTotal → Gemini) ──────────────
    const finding = await scanTarget(validTarget);
    const aiData = await scoreCtiFinding(finding.summary);

    const result = {
      target: validTarget,
      verdict: finding.verdict,
      risk_score: aiData?.risk_score || 0,
      threat_category: aiData?.threat_category || 'Unknown',
      ai_summary: aiData?.ai_summary || 'Analysis currently unavailable.',
      malicious_count: finding.maliciousCount,
      total_engines: finding.totalEngines,
      source: 'virustotal',
      scan_date: date,
    };

    await supabase.from('scans').insert([{
      target: validTarget,
      status: 'Completed',
      date,
      verdict: finding.verdict,
      malicious_count: finding.maliciousCount,
      total_engines: finding.totalEngines,
      ai_summary: result.ai_summary,
      risk_score: result.risk_score,
      threat_category: result.threat_category,
      payload: finding,
    }]);

    // Discord alert for malicious
    if (finding.verdict === 'malicious') {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🚨 API Scan — Malicious Threat Detected',
              color: 16711680,
              fields: [
                { name: 'Target', value: `\`${validTarget}\``, inline: true },
                { name: 'Category', value: result.threat_category, inline: true },
                { name: 'Risk Score', value: `${result.risk_score}/100`, inline: true },
                { name: 'AI Summary', value: result.ai_summary.slice(0, 1024) },
              ],
              footer: { text: 'Phish-Slayer API v1' },
              timestamp: new Date().toISOString(),
            }],
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: result }, { headers });

  } catch (err: any) {
    if (err?.message === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait 60 seconds.' },
        { status: 429, headers }
      );
    }

    console.error('API v1 scan error:', err);
    return NextResponse.json(
      { error: 'An internal error occurred. Please try again.' },
      { status: 500, headers }
    );
  }
}
