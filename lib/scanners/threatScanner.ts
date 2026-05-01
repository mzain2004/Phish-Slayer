'use server';

import net from 'net';

const VT_API_KEY = process.env.VIRUS_TOTAL_API_KEY!;
const VT_BASE = 'https://www.virustotal.com/api/v3';

export interface CtiFinding {
  maliciousCount: number;
  totalEngines: number;
  verdict: 'malicious' | 'suspicious' | 'clean' | 'unknown';
  // Stripped payload for Gemini — only what it needs
  summary: {
    last_analysis_stats: Record<string, number>;
    reputation: number;
    meaningful_name?: string;
  };
}

function encodeUrlForVT(url: string): string {
  // Ensure URL has protocol
  const normalized = url.startsWith('http') 
    ? url 
    : `https://${url}`
  
  // Base64 encode
  const encoded = Buffer.from(normalized)
    .toString('base64')
  
  // Make URL-safe and remove padding
  return encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export async function scanTarget(indicator: string): Promise<CtiFinding> {
  const isIp = net.isIP(indicator) !== 0; // returns 4 or 6 for valid IPs, 0 otherwise

  let endpoint = isIp
    ? `${VT_BASE}/ip_addresses/${encodeURIComponent(indicator)}`
    : `${VT_BASE}/urls/${encodeUrlForVT(indicator)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(endpoint, {
      headers: {
        'x-apikey': VT_API_KEY,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`External API call timed out after 15 seconds: ${endpoint}`);
    }
    throw error;
  }

  // Handle 404 — Not found in VT database, so submit and wait
  if (res.status === 404 && !isIp) {
    const submitController = new AbortController();
    const submitTimeoutId = setTimeout(() => submitController.abort(), 15000);
    let submitRes: Response;
    try {
      submitRes = await fetch(`${VT_BASE}/urls`, {
        method: 'POST',
        headers: {
          'x-apikey': VT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(indicator)}`,
        signal: submitController.signal,
      });
      clearTimeout(submitTimeoutId);
    } catch (error) {
      clearTimeout(submitTimeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`External API call timed out after 15 seconds: ${VT_BASE}/urls`);
      }
      throw error;
    }

    if (submitRes.ok) {
      // Poll a few times or just return unknown for now?
      // For first-time scans, we'll mark as unknown rather than hanging the UI for minutes
      return {
        maliciousCount: 0,
        totalEngines: 0,
        verdict: 'unknown',
        summary: {
          last_analysis_stats: { unknown: 1 },
          reputation: 0,
          meaningful_name: 'Queued for Analysis',
        },
      };
    }
  }

  if (res.status === 429) {
    // Return a degraded but successful object instead of crashing
    return {
      maliciousCount: 0,
      totalEngines: 0,
      verdict: 'unknown',
      summary: {
        last_analysis_stats: { rate_limited: 1 },
        reputation: 0,
        meaningful_name: 'Rate Limited',
      },
    };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`VirusTotal API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const attrs = json?.data?.attributes;

  if (!attrs) {
    throw new Error('Unexpected VirusTotal response structure');
  }

  const stats: Record<string, number> = attrs.last_analysis_stats ?? {};
  const maliciousCount: number = (stats.malicious ?? 0) + (stats.suspicious ?? 0);
  const totalEngines: number = Object.values(stats).reduce((acc: number, v) => acc + (v as number), 0);

  let verdict: CtiFinding['verdict'] = 'unknown';
  if (stats.malicious > 0) verdict = 'malicious';
  else if (stats.suspicious > 0) verdict = 'suspicious';
  else if (totalEngines > 0) verdict = 'clean';

  return {
    maliciousCount,
    totalEngines,
    verdict,
    summary: {
      last_analysis_stats: stats,
      reputation: attrs.reputation ?? 0,
      meaningful_name: attrs.meaningful_name,
    },
  };
}
