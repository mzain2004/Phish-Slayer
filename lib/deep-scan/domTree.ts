import * as cheerio from 'cheerio';

export interface DomTreeResult {
  title: string | null;
  metaDescription: string | null;
  formCount: number;
  inputCount: number;
  passwordInputCount: number;
  externalLinks: string[];
  suspiciousKeywords: string[];
  hasLoginForm: boolean;
  riskFlags: string[];
}

const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'password', 'verify', 'account',
  'banking', 'credential', 'urgent', 'suspended', 'confirm identity',
];

export async function getDomTree(target: string): Promise<DomTreeResult> {
  const fallback: DomTreeResult = {
    title: null,
    metaDescription: null,
    formCount: 0,
    inputCount: 0,
    passwordInputCount: 0,
    externalLinks: [],
    suspiciousKeywords: [],
    hasLoginForm: false,
    riskFlags: ['Unable to fetch or parse page content'],
  };

  try {
    let url = target.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { ...fallback, riskFlags: [`HTTP ${res.status} — page returned an error status`] };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').first().text().trim() || null;

    // Extract meta description
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[property="og:description"]').attr('content')?.trim() ||
      null;

    // Count forms and inputs
    const formCount = $('form').length;
    const inputCount = $('input').length;
    const passwordInputCount = $('input[type="password"]').length;

    // Extract external links
    const externalLinks: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && /^https?:\/\//i.test(href)) {
        externalLinks.push(href);
      }
    });

    // Deduplicate external links
    const uniqueLinks = [...new Set(externalLinks)];

    // Check for suspicious keywords in page text
    const pageText = $('body').text().toLowerCase();
    const suspiciousKeywords = SUSPICIOUS_KEYWORDS.filter((kw) =>
      pageText.includes(kw.toLowerCase())
    );

    // Determine if this is a login/credential harvesting page
    const hasLoginForm = passwordInputCount > 0;

    // Build risk flags
    const riskFlags: string[] = [];

    if (hasLoginForm) {
      riskFlags.push('Login/credential harvesting form detected');
    }

    if (suspiciousKeywords.length > 3) {
      riskFlags.push(
        `High density of phishing keywords detected (${suspiciousKeywords.length} found: ${suspiciousKeywords.join(', ')})`
      );
    }

    if (formCount > 3) {
      riskFlags.push(`Unusually high number of forms on page (${formCount})`);
    }

    return {
      title,
      metaDescription,
      formCount,
      inputCount,
      passwordInputCount,
      externalLinks: uniqueLinks.slice(0, 100), // Cap at 100 to avoid massive payloads
      suspiciousKeywords,
      hasLoginForm,
      riskFlags,
    };
  } catch {
    return fallback;
  }
}
