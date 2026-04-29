import { Alert, AgentHandoff } from './types';
import { pushToDLQ } from './dlq';

// Mock runner function - would import the actual tier agents
async function runAgent(alert: Alert, orgId: string): Promise<AgentHandoff> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    alert_id: alert.id,
    org_id: orgId,
    agent_id: `agent-${Date.now()}`,
    tier: 'L1',
    confidence: 0.8,
    findings: {
      severity_score: 50,
      mitre_techniques: [],
      iocs: [],
      enrichment: {},
      risk_factors: [],
      recommended_actions: [],
      raw_llm_reasoning: ''
    },
    actions_taken: [],
    handoff_context: {},
    timestamp: new Date().toISOString(),
    state: 'COMPLETED',
    token_count: 1500,
    model_used: 'llama-3.3-70b-versatile'
  };
}

export async function executeParallel(alerts: Alert[], orgId: string): Promise<AgentHandoff[]> {
  const results: AgentHandoff[] = [];
  const maxConcurrent = 20;
  
  // Process in chunks of maxConcurrent
  for (let i = 0; i < alerts.length; i += maxConcurrent) {
    const chunk = alerts.slice(i, i + maxConcurrent);
    
    const chunkPromises = chunk.map(async (alert) => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Agent execution timeout')), 30000)
        );
        
        const result = await Promise.race([
          runAgent(alert, orgId),
          timeoutPromise
        ]);
        
        return result;
      } catch (err) {
        console.error(`[Executor] Agent failed for alert ${alert.id}:`, err);
        await pushToDLQ(orgId, null, 'L1', err, alert);
        return null;
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...(chunkResults.filter(Boolean) as AgentHandoff[]));
  }
  
  return results;
}
