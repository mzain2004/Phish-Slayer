import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scanTarget } from '@/lib/scanners/threatScanner';
import { scoreCtiFinding } from '@/lib/ai/analyzer';

// ── Public API V1 — Scan Engine ──────────────────────────────────────

export async function GET(request: NextRequest) {
  return handleScan(request);
}

export async function POST(request: NextRequest) {
  return handleScan(request);
}

async function handleScan(request: NextRequest) {
  // ── Auth: API Key Check ──────────────────────────────────────────
  const apiKey = request.headers.get('x-api-key');
  const serverKey = process.env.PHISH_SLAYER_API_KEY;

  if (!serverKey || apiKey !== serverKey) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide a valid x-api-key header.' },
      { status: 401 }
    );
  }

  // ── Extract target ───────────────────────────────────────────────
  let target: string | null = null;

  if (request.method === 'GET') {
    target = request.nextUrl.searchParams.get('target');
  } else {
    try {
      const body = await request.json();
      target = body.target || null;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body. Expected: { "target": "example.com" }' },
        { status: 400 }
      );
    }
  }

  if (!target || typeof target !== 'string' || target.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing required parameter: target' },
      { status: 400 }
    );
  }

  const validTarget = target.trim();

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

      return NextResponse.json({ success: true, data: result });
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

      // Discord webhook fires via launchScan — for API we fire it inline
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
        }).catch(() => {}); // Fire-and-forget
      }

      return NextResponse.json({ success: true, data: result });
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

    return NextResponse.json({ success: true, data: result });

  } catch (err: any) {
    if (err?.message === 'RATE_LIMIT') {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait 60 seconds.' },
        { status: 429 }
      );
    }

    console.error('API v1 scan error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal scan error.' },
      { status: 500 }
    );
  }
}
