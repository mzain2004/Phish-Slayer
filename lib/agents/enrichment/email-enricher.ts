import { getCachedEnrichment, setCachedEnrichment } from './cache';

export interface EmailEnrichment {
  spf_result?: string;
  dkim_result?: string;
  dmarc_result?: string;
  display_name_spoofing?: boolean;
  reply_to_mismatch?: boolean;
  raw_parsed?: any;
}

export async function enrichEmailHeaders(rawHeaders: string, orgId: string): Promise<EmailEnrichment> {
  // Simple heuristic parsing for the agent chain
  // We use a pseudo ID based on length/hash to cache the parsed output briefly
  const cacheKey = Buffer.from(rawHeaders.slice(0, 100)).toString('base64');
  const cached = await getCachedEnrichment(orgId, 'email_header', cacheKey, 'all');
  if (cached) return cached;

  const result: EmailEnrichment = {};

  const authResultsMatch = rawHeaders.match(/Authentication-Results:\s*([\s\S]*?)(?=\n\S)/i);
  if (authResultsMatch) {
    const authStr = authResultsMatch[1].toLowerCase();
    if (authStr.includes('spf=pass')) result.spf_result = 'pass';
    else if (authStr.includes('spf=')) result.spf_result = 'fail/softfail';
    
    if (authStr.includes('dkim=pass')) result.dkim_result = 'pass';
    else if (authStr.includes('dkim=')) result.dkim_result = 'fail';

    if (authStr.includes('dmarc=pass')) result.dmarc_result = 'pass';
    else if (authStr.includes('dmarc=')) result.dmarc_result = 'fail';
  }

  const fromMatch = rawHeaders.match(/From:\s*([\s\S]*?)</i);
  if (fromMatch) {
    const displayName = fromMatch[1].toLowerCase();
    if (displayName.includes('security') || displayName.includes('admin') || displayName.includes('it')) {
      result.display_name_spoofing = true;
    }
  }

  const replyToMatch = rawHeaders.match(/Reply-To:\s*.*?<([^>]+)>/i);
  const fromEmailMatch = rawHeaders.match(/From:\s*.*?<([^>]+)>/i);
  
  if (replyToMatch && fromEmailMatch) {
    const replyToDomain = replyToMatch[1].split('@')[1];
    const fromDomain = fromEmailMatch[1].split('@')[1];
    if (replyToDomain && fromDomain && replyToDomain !== fromDomain) {
      result.reply_to_mismatch = true;
    }
  }

  await setCachedEnrichment(orgId, 'email_header', cacheKey, 'all', result, 1); // 1 hour TTL
  return result;
}
