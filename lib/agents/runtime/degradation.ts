import { Alert } from './types';
import { getProviderHealth } from './llm-client';

export async function isLLMAvailable(): Promise<boolean> {
  const health = await getProviderHealth();
  return Object.values(health).some(isHealthy => isHealthy === true);
}

export function triageWithRules(alert: Alert): { severity: string, mitre_tags: string[], disposition: string } {
  // Simple rule-based triage based on Wazuh rule level
  const ruleLevel = alert.rule_level || 0;
  
  let severity = 'low';
  let disposition = 'monitor';
  const mitre_tags: string[] = [];

  if (ruleLevel >= 12) {
    severity = 'critical';
    disposition = 'escalate';
    mitre_tags.push('T1105'); // Generic indicator
  } else if (ruleLevel >= 8) {
    severity = 'high';
    disposition = 'investigate';
    mitre_tags.push('T1082'); 
  } else if (ruleLevel >= 5) {
    severity = 'medium';
  }

  return { severity, mitre_tags, disposition };
}

export async function queueForAIProcessing(alert: Alert, orgId: string): Promise<void> {
  // In a real system, push to a Redis queue like bullmq
  
  // Here we just log that we would queue it.
}
