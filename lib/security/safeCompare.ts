import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns false immediately if lengths differ (this is unavoidable),
 * but the actual content comparison is timing-safe.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

/**
 * Sanitize a domain/IP target input to prevent injection attacks.
 * Strips protocol, path, null bytes, and validates format.
 */
export function sanitizeTarget(input: string): { target: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { target: '', error: 'Missing target parameter.' };
  }

  let t = input.trim();

  // Strip null bytes
  t = t.replace(/\0/g, '');

  // Strip protocol
  t = t.replace(/^https?:\/\//i, '');
  t = t.replace(/^www\./i, '');
  t = t.replace(/\/+$/, '');
  t = t.split('/')[0]; // Remove path

  // Max domain length
  if (t.length > 253) {
    return { target: '', error: 'Target exceeds maximum length (253 characters).' };
  }

  // Reject shell metacharacters
  if (/[&|;$><`\\]/.test(t)) {
    return { target: '', error: 'Target contains invalid characters.' };
  }

  // Validate IP or domain format
  const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(t);
  const isDomain = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(t);

  if (!isIp && !isDomain) {
    return { target: '', error: 'Invalid target format. Must be a valid IP address or domain.' };
  }

  return { target: t };
}
