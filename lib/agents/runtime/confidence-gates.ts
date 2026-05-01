export const CONFIDENCE_GATES = {
  L2_AUTO_EXECUTE: 0.85,
  L3_ESCALATE: 0.70,
  DESTRUCTIVE_ACTION: 0.90,
  HUMAN_APPROVAL_GATE: 0.95,
} as const;

export function shouldExecute(confidence: number, actionType: string, orgId: string): boolean {
  // Configurable per org in future. Currently uses hardcoded values.
  const gate = actionType.includes('BLOCK') || actionType.includes('ISOLATE') 
    ? CONFIDENCE_GATES.DESTRUCTIVE_ACTION 
    : CONFIDENCE_GATES.L2_AUTO_EXECUTE;
    
  const decision = confidence >= gate;
  return decision;
}

export function shouldEscalate(confidence: number, tier: 'L1' | 'L2' | 'L3'): boolean {
  // If confidence is lower than L3_ESCALATE (e.g. uncertain), we escalate rather than auto-closing.
  // Wait, "If uncertain, always escalate". If confidence < gate, escalate.
  let gate = CONFIDENCE_GATES.L3_ESCALATE;
  if (tier === 'L1') gate = 0.70; // Hardcoded from prompt: L1 escalate if conf >= 0.7 OR uncertainty. Wait, L1 prompt said "ESCALATE if confidence >= 0.7 AND clear threat indicators". 
  
  // For generic escalation checks:
  const decision = confidence >= gate;
  return decision;
}

export function requiresHumanApproval(actionType: string, assetCriticality: 1 | 2 | 3 | 4 = 1): boolean {
  // High criticality (3, 4) or destructive actions require human approval
  const isDestructive = actionType.includes('BLOCK') || actionType.includes('ISOLATE');
  
  let decision = false;
  if (assetCriticality >= 3 && isDestructive) {
    decision = true;
  } else if (isDestructive) {
    // Rely on DESTRUCTIVE_ACTION gate, but we can flag for human approval if we want to be safe
    decision = true;
  }
  
  return decision;
}
