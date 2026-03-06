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

export async function scanTarget(indicator: string): Promise<CtiFinding> {
  const isIp = net.isIP(indicator) !== 0; // returns 4 or 6 for valid IPs, 0 otherwise

  const endpoint = isIp
    ? `${VT_BASE}/ip_addresses/${encodeURIComponent(indicator)}`
    : `${VT_BASE}/urls/${Buffer.from(indicator).toString('base64url')}`;

  const res = await fetch(endpoint, {
    headers: {
      'x-apikey': VT_API_KEY,
    },
    // Ensure this isn't cached
    cache: 'no-store',
  });

  if (res.status === 429) {
    throw new Error('RATE_LIMIT');
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
