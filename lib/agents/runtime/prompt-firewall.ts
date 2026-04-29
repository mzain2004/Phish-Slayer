import { AgentHandoff, IOC } from './types';

// Strip prompt injection attempts and control tokens
export function sanitizeForLLM(input: string): string {
  if (!input) return '';
  
  let sanitized = input;
  // Common prompt injection phrases
  const blocklist = [
    /ignore previous instructions/i,
    /you are now/i,
    /bypass the following/i,
    /forget all rules/i,
    /<\|start_header_id\|>/g,
    /<\|end_header_id\|>/g,
    /<\|eot_id\|>/g
  ];

  for (const pattern of blocklist) {
    if (pattern.test(sanitized)) {
      console.warn(`[PromptFirewall] Stripped suspected injection attempt matching pattern: ${pattern}`);
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  }

  // Remove non-printable characters that might break JSON parsing
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  return sanitized;
}

export function validateIOC(value: string, type: IOC['type']): boolean {
  if (!value) return false;

  switch (type) {
    case 'ip':
      // Basic IP validation and length check
      if (value.length > 45) return false;
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) || /^[a-fA-F0-9:]+$/.test(value); // IPv4 or basic IPv6
    case 'hash':
      if (value.length > 64) return false;
      return /^[a-fA-F0-9]{32,64}$/.test(value);
    case 'domain':
      if (value.length > 253) return false;
      return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    case 'email':
      if (value.length > 254) return false;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    default:
      return value.length <= 1000;
  }
}

export function sanitizeHandoff(handoff: Partial<AgentHandoff>): AgentHandoff {
  const sanitized = { ...handoff };
  
  if (sanitized.handoff_context) {
    const stringified = JSON.stringify(sanitized.handoff_context);
    sanitized.handoff_context = JSON.parse(sanitizeForLLM(stringified));
  }
  
  if (sanitized.findings?.raw_llm_reasoning) {
    sanitized.findings.raw_llm_reasoning = sanitizeForLLM(sanitized.findings.raw_llm_reasoning);
  }

  return sanitized as AgentHandoff;
}
