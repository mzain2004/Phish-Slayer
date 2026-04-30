/**
 * WHOIS Change Monitor for PhishSlayer
 * Compares current WHOIS data with previous state to detect changes.
 */

export interface WhoisChange {
  field: string;
  old_value: any;
  new_value: any;
}

export async function checkWhoisChanges(domain: string, previousDetails?: any): Promise<WhoisChange[]> {
  const changes: WhoisChange[] = [];
  
  try {
    // Fetch current WHOIS via RDAP (free and standard)
    const response = await fetch(`https://rdap.org/domain/${domain}`);
    if (response.status !== 200) return [];
    
    const currentData = await response.json();
    
    if (!previousDetails) {
      // First time checking, nothing to compare
      return [];
    }

    // Compare Registrar
    const currentRegistrar = currentData.port43;
    const previousRegistrar = previousDetails.registrar;
    if (currentRegistrar !== previousRegistrar) {
      changes.push({ field: 'registrar', old_value: previousRegistrar, new_value: currentRegistrar });
    }

    // Compare Nameservers (if available in RDAP)
    const currentNS = currentData.nameservers?.map((ns: any) => ns.ldhName).sort().join(',') || '';
    const previousNS = previousDetails.nameservers || '';
    if (currentNS !== previousNS) {
      changes.push({ field: 'nameservers', old_value: previousNS, new_value: currentNS });
    }

    // Compare Status
    const currentStatus = currentData.status?.sort().join(',') || '';
    const previousStatus = previousDetails.status || '';
    if (currentStatus !== previousStatus) {
      changes.push({ field: 'status', old_value: previousStatus, new_value: currentStatus });
    }

  } catch (error) {
    console.error(`Error checking WHOIS changes for ${domain}:`, error);
  }

  return changes;
}
