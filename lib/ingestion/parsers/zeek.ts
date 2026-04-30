import { UDMEvent } from '../udm';

export function parseZeek(raw: string | Buffer): Partial<UDMEvent> {
  const warnings: string[] = [];
  const rawStr = typeof raw === 'string' ? raw : raw.toString('utf-8');

  const event: Partial<UDMEvent> = {
    raw_log: rawStr,
    normalization_version: '1.0',
    normalization_warnings: warnings,
    event_type: 'network',
    extra: {}
  };

  try {
    // Detect log type by scanning for #path
    const pathMatch = rawStr.match(/#path\s+(\S+)/);
    const path = pathMatch ? pathMatch[1] : 'unknown';
    
    // In a full implementation, we would split columns based on #fields
    // Since this is generic representation, we fallback to warnings for unimplemented tabular mapping
    warnings.push(`Zeek tabular parsing incomplete for path: ${path}`);
  } catch (e) {
    warnings.push("Failed to parse Zeek format");
  }

  return event;
}
