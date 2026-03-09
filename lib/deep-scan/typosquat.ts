export interface TyposquatResult {
  isTyposquat: boolean;
  matchedBrand: string | null;
  distance: number | null;
  homoglyphsDetected: boolean;
  riskFlags: string[];
}

const BRANDS = [
  'google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'facebook.com',
  'instagram.com', 'twitter.com', 'linkedin.com', 'paypal.com', 'netflix.com',
  'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com', 'hsbc.com',
  'americanexpress.com', 'visa.com', 'mastercard.com', 'dropbox.com', 'github.com',
  'gitlab.com', 'slack.com', 'zoom.us', 'adobe.com', 'salesforce.com',
  'yahoo.com', 'outlook.com', 'office365.com', 'onedrive.com', 'icloud.com',
  'coinbase.com', 'binance.com', 'robinhood.com', 'stripe.com', 'shopify.com',
  'ebay.com', 'walmart.com', 'target.com', 'fedex.com', 'ups.com',
  'dhl.com', 'usps.com', 'irs.gov', 'ssa.gov', 'medicare.gov',
  'discord.com', 'twitch.tv', 'spotify.com', 'steam.com', 'epicgames.com',
];

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

function detectHomoglyphs(domain: string): boolean {
  const homoglyphPatterns: [RegExp, string][] = [
    [/0/g, 'o'],   // zero instead of o
    [/1/g, 'l'],   // one instead of l
    [/rn/g, 'm'],  // rn instead of m
    [/vv/g, 'w'],  // vv instead of w
    [/cl/g, 'd'],  // cl instead of d
    [/nn/g, 'm'],  // nn instead of m
  ];

  const name = domain.split('.')[0].toLowerCase();

  for (const [pattern] of homoglyphPatterns) {
    if (pattern.test(name)) {
      // Check if replacing the homoglyph yields a known brand name
      for (const brand of BRANDS) {
        const brandName = brand.split('.')[0].toLowerCase();
        const normalized = name.replace(pattern, homoglyphPatterns.find(([p]) => p === pattern)![1]);
        if (normalized === brandName) {
          return true;
        }
      }
    }
  }

  return false;
}

function stripDomain(input: string): string {
  let d = input.trim();
  d = d.replace(/^https?:\/\//i, '');
  d = d.replace(/^www\./i, '');
  d = d.replace(/\/+$/, '');
  d = d.split('/')[0];
  return d.toLowerCase();
}

export async function detectTyposquatting(domain: string): Promise<TyposquatResult> {
  const cleanDomain = stripDomain(domain);
  const riskFlags: string[] = [];

  let closestBrand: string | null = null;
  let closestDistance = Infinity;

  for (const brand of BRANDS) {
    const dist = levenshteinDistance(cleanDomain, brand);
    if (dist < closestDistance) {
      closestDistance = dist;
      closestBrand = brand;
    }
  }

  const isExactMatch = closestDistance === 0;
  const isTyposquat = closestDistance <= 2 && !isExactMatch;
  const homoglyphsDetected = detectHomoglyphs(cleanDomain);

  if (isTyposquat && closestBrand) {
    riskFlags.push(
      `Possible typosquatting detected — domain "${cleanDomain}" is ${closestDistance} edit(s) away from "${closestBrand}"`
    );
  }

  if (homoglyphsDetected) {
    riskFlags.push(
      `Homoglyph substitution detected — visual similarity attack using look-alike characters`
    );
  }

  if (isTyposquat && homoglyphsDetected) {
    riskFlags.push(
      'HIGH RISK: Combined typosquat + homoglyph attack pattern detected'
    );
  }

  return {
    isTyposquat: isTyposquat || homoglyphsDetected,
    matchedBrand: closestBrand,
    distance: closestDistance === Infinity ? null : closestDistance,
    homoglyphsDetected,
    riskFlags,
  };
}
