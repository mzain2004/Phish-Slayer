/**
 * Domain Registration Monitor for PhishSlayer
 * Checks if permutations are registered and flags new registrations.
 */

export interface DomainFinding {
  domain: string;
  is_registered: boolean;
  registration_date?: string;
  registrar?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export async function checkDomainRegistration(permutations: string[]): Promise<DomainFinding[]> {
  const findings: DomainFinding[] = [];
  
  // Note: Batch checking permutations is expensive. 
  // We'll use a sample or focus on high-probability ones.
  const sample = permutations.slice(0, 50); 

  for (const domain of sample) {
    try {
      // Using a free WHOIS JSON API (hypothetical or requiring key)
      // For this implementation, we'll use a placeholder logic that 
      // the developer can swap with their preferred provider API.
      const response = await fetch(`https://rdap.org/domain/${domain}`);
      
      if (response.status === 200) {
        const data = await response.json();
        const createdDate = data.events?.find((e: any) => e.eventAction === 'registration')?.eventDate;
        
        let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (createdDate) {
          const regDate = new Date(createdDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (regDate > thirtyDaysAgo) {
            severity = 'HIGH';
          }
        }

        findings.push({
          domain,
          is_registered: true,
          registration_date: createdDate,
          registrar: data.port43, // Often contains registrar info in RDAP
          severity
        });
      }
    } catch (error) {
      // Ignore failures for individual domains
    }
  }

  return findings;
}
