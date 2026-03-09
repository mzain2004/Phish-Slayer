import * as dns from 'dns/promises';

export interface DnsResult {
  hasMxRecords: boolean;
  mxRecords: { exchange: string; priority: number }[];
  txtRecords: string[][];
  hasSpf: boolean;
  hasDkim: boolean;
  hasDmarc: boolean;
  ghostMailFlag: boolean;
  riskFlags: string[];
}

function stripDomain(input: string): string {
  let d = input.trim();
  d = d.replace(/^https?:\/\//i, '');
  d = d.replace(/^www\./i, '');
  d = d.replace(/\/+$/, '');
  d = d.split('/')[0];
  return d;
}

export async function checkDnsRecords(domain: string): Promise<DnsResult> {
  const cleanDomain = stripDomain(domain);
  const riskFlags: string[] = [];

  let mxRecords: { exchange: string; priority: number }[] = [];
  let txtRecords: string[][] = [];
  let hasMxRecords = false;
  let hasSpf = false;
  let hasDkim = false;
  let hasDmarc = false;

  // Query MX records
  try {
    const mx = await dns.resolveMx(cleanDomain);
    if (mx && mx.length > 0) {
      mxRecords = mx.map((r) => ({ exchange: r.exchange, priority: r.priority }));
      hasMxRecords = true;
    }
  } catch {
    // MX query failed — treat as no MX records
  }

  if (!hasMxRecords) {
    riskFlags.push('No MX records — domain cannot receive email');
  }

  // Query TXT records
  try {
    const txt = await dns.resolveTxt(cleanDomain);
    if (txt && txt.length > 0) {
      txtRecords = txt;

      const flatTxt = txt.map((arr) => arr.join('')).join(' ');

      if (flatTxt.includes('v=spf1')) {
        hasSpf = true;
      }
      if (flatTxt.includes('v=DKIM1')) {
        hasDkim = true;
      }
      if (flatTxt.includes('v=DMARC1')) {
        hasDmarc = true;
      }
    }
  } catch {
    // TXT query failed
  }

  // Also check DMARC via _dmarc subdomain
  if (!hasDmarc) {
    try {
      const dmarcTxt = await dns.resolveTxt(`_dmarc.${cleanDomain}`);
      const flat = dmarcTxt.map((arr) => arr.join('')).join(' ');
      if (flat.includes('v=DMARC1')) {
        hasDmarc = true;
      }
    } catch {
      // DMARC subdomain query failed
    }
  }

  // Also check DKIM via selector1._domainkey subdomain (common default)
  if (!hasDkim) {
    try {
      const dkimTxt = await dns.resolveTxt(`selector1._domainkey.${cleanDomain}`);
      const flat = dkimTxt.map((arr) => arr.join('')).join(' ');
      if (flat.includes('v=DKIM1')) {
        hasDkim = true;
      }
    } catch {
      // DKIM subdomain query failed
    }
  }

  if (!hasSpf) {
    riskFlags.push('No SPF record detected');
  }
  if (!hasDmarc) {
    riskFlags.push('No DMARC policy detected');
  }

  return {
    hasMxRecords,
    mxRecords,
    txtRecords,
    hasSpf,
    hasDkim,
    hasDmarc,
    ghostMailFlag: !hasMxRecords,
    riskFlags,
  };
}
