import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface ReasoningChain {
  alert_id?: string;
  escalation_id?: string;
  agent_level: "L1" | "L2" | "L3";
  decision: string;
  confidence_score?: number;
  reasoning_text: string;
  iocs_considered?: any[];
  actions_taken?: any[];
  model_used?: string;
  execution_time_ms?: number;
}

export async function saveReasoningChain(chain: ReasoningChain): Promise<void> {
  const { error } = await supabase.from("agent_reasoning").insert(chain);

  if (error) {
    console.error("[ReasoningChain] Failed to save:", error.message);
  }
}

export function buildL1ReasoningPrompt(alert: any): string {
  return `You are an L1 SOC Triage Analyst. Analyze this security alert and explain your decision.

ALERT DATA:
- Rule: ${alert.rule_description || "Unknown"}
- Severity Level: ${alert.level || "Unknown"}
- Source IP: ${alert.source_ip || "Unknown"}
- Agent: ${alert.agent_name || "Unknown"}
- Timestamp: ${alert.timestamp || "Unknown"}
- Raw Data: ${JSON.stringify(alert.full_log || {}).slice(0, 500)}

Respond in this EXACT JSON format:
{
  "decision": "CLOSE or ESCALATE",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence human-readable explanation of why you made this decision",
  "iocs": ["list", "of", "indicators"],
  "risk_factors": ["list", "of", "risk", "factors"],
  "recommended_actions": ["list", "of", "actions"]
}`;
}

export function buildL2ReasoningPrompt(escalation: any): string {
  return `You are an L2 SOC Responder. An L1 agent escalated this alert. Decide what autonomous action to take.

ESCALATION DATA:
- Alert Rule: ${escalation.alert_rule || "Unknown"}
- Severity: ${escalation.severity || "Unknown"}
- Source IP: ${escalation.source_ip || "Unknown"}
- L1 Confidence: ${escalation.l1_confidence || "Unknown"}
- L1 Reasoning: ${escalation.l1_reasoning || "Unknown"}

AVAILABLE ACTIONS: BLOCK_IP, ISOLATE_IDENTITY, ESCALATE_TO_HUMAN, MONITOR

Respond in this EXACT JSON format:
{
  "decision": "BLOCK_IP or ISOLATE_IDENTITY or ESCALATE_TO_HUMAN or MONITOR",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence explanation of your decision and what threat you identified",
  "actions_taken": ["list", "of", "actions"],
  "iocs": ["list", "of", "indicators"]
}`;
}

export function buildL3ReasoningPrompt(hunts: any[]): string {
  return `You are an L3 Threat Hunter. Review these IOC matches from CTI feeds and explain your findings.

HUNT RESULTS:
${JSON.stringify(hunts.slice(0, 10), null, 2).slice(0, 1000)}

Respond in this EXACT JSON format:
{
  "decision": "THREAT_CONFIRMED or FALSE_POSITIVE or NEEDS_INVESTIGATION",
  "confidence": 0.0-1.0,
  "reasoning": "2-3 sentence summary of what threats were found and their significance",
  "iocs": ["list", "of", "confirmed", "iocs"],
  "threat_actors": ["associated", "threat", "actors", "if", "known"]
}`;
}
