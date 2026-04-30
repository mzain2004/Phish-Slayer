import { EnrichedAlert } from '../enrichment/enrichment-orchestrator';

export function calculateSeverity(alert: EnrichedAlert): { score: number, label: string, breakdown: Record<string, number> } {
  let score = alert.rule_level ? (alert.rule_level * 100 / 15) : 50; // Normalize Wazuh 0-15 to 0-100
  const breakdown: Record<string, number> = { base: Math.round(score) };

  // Asset Criticality
  for (const asset of alert.enrichment.assets) {
    if (asset.criticality === 1) { score += 40; breakdown['Asset Crown Jewel'] = 40; }
    else if (asset.criticality === 2) { score += 25; breakdown['Asset Business Critical'] = 25; }
    else if (asset.criticality === 3) { score += 10; breakdown['Asset Standard'] = 10; }
    
    if (asset.data_classification && asset.data_classification.some(c => ['PCI', 'HIPAA', 'PII'].includes(c))) {
      score += 20; breakdown['Data Classification (PCI/HIPAA/PII)'] = 20;
    }
    
    if (asset.off_hours) {
      score += 10; breakdown['Off-hours Anomaly'] = 10;
    }
  }

  // Active exploitation / threat intel
  for (const ip of alert.enrichment.ips) {
    if (ip.greynoise?.classification === 'malicious') { score += 20; breakdown['GreyNoise Malicious'] = 20; }
    if (ip.virustotal?.malicious > 3) { score += 25; breakdown['Threat Intel Match (IP)'] = 25; }
  }

  for (const domain of alert.enrichment.domains) {
    if (domain.virustotal?.malicious > 3) { score += 25; breakdown['Threat Intel Match (Domain)'] = 25; }
  }

  // User context
  for (const user of alert.enrichment.users) {
    if (user.is_privileged) {
      score += 20; breakdown['Privileged Account'] = 20;
    }
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  let label = 'INFO';
  if (score >= 90) label = 'CRITICAL';
  else if (score >= 70) label = 'HIGH';
  else if (score >= 40) label = 'MEDIUM';
  else if (score >= 10) label = 'LOW';

  return { score, label, breakdown };
}
