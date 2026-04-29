import { AgentFindings, IOC, AgentHandoff } from './types';

// Rough estimate: 1 token ≈ 4 characters
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function summarizeContext(findings: AgentFindings[]): string {
  if (!findings || findings.length === 0) return '';
  
  // Create a high-level summary of findings
  const severities = findings.map(f => f.severity_score);
  const maxSeverity = Math.max(...severities);
  const allMitre = Array.from(new Set(findings.flatMap(f => f.mitre_techniques)));
  
  return `Previous findings summary:
- Maximum severity seen: ${maxSeverity}
- MITRE Techniques identified: ${allMitre.join(', ')}
- Number of earlier analysis cycles: ${findings.length}
- Note: Detailed earlier reasoning has been compressed.`;
}

export function extractCriticalIOCs(context: string | AgentFindings[]): IOC[] {
  let allIocs: IOC[] = [];
  if (Array.isArray(context)) {
    allIocs = context.flatMap(f => f.iocs);
  } else {
    // In a real implementation, we might parse the string or maintain a separate state
  }

  // Deduplicate and prioritize high confidence/threat IOCs
  const unique = new Map<string, IOC>();
  for (const ioc of allIocs) {
    if (!unique.has(ioc.value)) {
      unique.set(ioc.value, ioc);
    } else {
      const existing = unique.get(ioc.value)!;
      if (ioc.threat_score > existing.threat_score) {
        unique.set(ioc.value, ioc);
      }
    }
  }

  // Return top 50 critical IOCs
  return Array.from(unique.values())
    .sort((a, b) => b.threat_score - a.threat_score)
    .slice(0, 50);
}

export function buildPromptContext(handoff: AgentHandoff, maxTokens: number): string {
  const baseContext = JSON.stringify({
    alert_id: handoff.alert_id,
    tier: handoff.tier,
    context: handoff.handoff_context
  });

  let currentTokens = estimateTokens(baseContext);
  
  if (currentTokens > maxTokens) {
    // Truncate handoff_context safely
    return JSON.stringify({
      alert_id: handoff.alert_id,
      tier: handoff.tier,
      context: "Context truncated due to length limits."
    });
  }

  // Add findings until we hit the limit
  const findingsJson = JSON.stringify(handoff.findings);
  if (currentTokens + estimateTokens(findingsJson) > maxTokens) {
    return JSON.stringify({
      alert_id: handoff.alert_id,
      tier: handoff.tier,
      context: handoff.handoff_context,
      summarized_findings: summarizeContext([handoff.findings]),
      critical_iocs: extractCriticalIOCs([handoff.findings])
    });
  }

  return JSON.stringify(handoff);
}
