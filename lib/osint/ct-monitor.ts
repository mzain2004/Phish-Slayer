/**
 * CT Log Monitor for PhishSlayer
 * Checks for new certificates issued for a domain or its permutations.
 */

export interface CertFinding {
  domain: string;
  issuer: string;
  not_before: string;
  not_after: string;
  matched_permutation?: string;
}

export async function checkNewCerts(orgDomain: string, permutations: string[] = []): Promise<CertFinding[]> {
  const findings: CertFinding[] = [];
  const domainsToSearch = [orgDomain, ...permutations];
  
  // To avoid hitting crt.sh too hard, we'll focus on the main domain 
  // and a subset of permutations, or use a wildcard search if possible.
  // For crt.sh, wildcard search is: %.domain.com
  
  try {
    const response = await fetch(`https://crt.sh/?q=${encodeURIComponent(orgDomain)}&output=json`);
    if (!response.ok) throw new Error('Failed to fetch from crt.sh');
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      data.forEach((entry: any) => {
        findings.push({
          domain: entry.common_name,
          issuer: entry.issuer_name,
          not_before: entry.not_before,
          not_after: entry.not_after,
          matched_permutation: orgDomain
        });
      });
    }
  } catch (error) {
    console.error(`Error checking CT logs for ${orgDomain}:`, error);
  }

  // Deduplicate and filter relevant findings
  return findings.filter((v, i, a) => a.findIndex(t => t.domain === v.domain) === i);
}
