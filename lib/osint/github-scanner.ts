/**
 * GitHub Leak Scanner for PhishSlayer
 * Scans GitHub for sensitive data related to the organization.
 */

export interface LeakFinding {
  repo_url: string;
  file_path: string;
  matched_pattern: string;
  snippet: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export async function scanGitHub(orgName: string, domains: string[]): Promise<LeakFinding[]> {
  const findings: LeakFinding[] = [];
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    console.warn('GITHUB_TOKEN not found. GitHub scanner will be limited or disabled.');
    return [];
  }

  const searchPatterns = [
    `"${orgName}" password`,
    `"${domains[0]}" AWS_ACCESS_KEY`,
    `"${domains[0]}" mongodb+srv`,
    `"${domains[0]}" api_key`,
    `"${domains[0]}" secret_key`,
    `"${domains[0]}" private_key`,
  ];

  for (const query of searchPatterns) {
    try {
      const response = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.items) {
          data.items.slice(0, 5).forEach((item: any) => {
            let severity: 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
            if (query.includes('AWS_ACCESS_KEY') || query.includes('private_key')) {
              severity = 'CRITICAL';
            } else if (query.includes('password') || query.includes('mongodb+srv')) {
              severity = 'HIGH';
            }

            findings.push({
              repo_url: item.repository.html_url,
              file_path: item.path,
              matched_pattern: query,
              snippet: `Leak detected in ${item.path}`, // In a real scenario, we'd fetch the file content and redact
              severity
            });
          });
        }
      }
      
      // Respect GitHub API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error scanning GitHub for ${query}:`, error);
    }
  }

  return findings;
}
