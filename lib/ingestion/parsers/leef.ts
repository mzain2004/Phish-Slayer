import { UDMEvent } from '../udm';

export function parseLEEF(raw: string | Buffer): Partial<UDMEvent> {
  const warnings: string[] = [];
  const rawStr = typeof raw === 'string' ? raw : raw.toString('utf-8');

  const event: Partial<UDMEvent> = {
    raw_log: rawStr,
    normalization_version: '1.0',
    normalization_warnings: warnings,
    event_type: 'log',
    extra: {}
  };

  try {
    // Format: LEEF:Version|Vendor|Product|Version|EventID|delimiter|key=value pairs
    const match = rawStr.match(/^LEEF:([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([\s\S]*)$/);
    if (!match) {
      warnings.push("Not a valid LEEF format");
      return event;
    }

    const [_, version, vendor, product, prodVer, eventId, delimiterChar, extStr] = match;
    event.alert_rule_id = eventId;
    
    // Parse key-value pairs depending on delimiter
    const delim = delimiterChar || '\t';
    const pairs = extStr.split(delim);
    
    const ext: Record<string, string> = {};
    for (const p of pairs) {
      const idx = p.indexOf('=');
      if (idx > -1) {
        ext[p.substring(0, idx)] = p.substring(idx + 1);
      }
    }

    if (ext.src) event.src_ip = ext.src;
    if (ext.dst) event.dst_ip = ext.dst;
    if (ext.srcPort) event.src_port = parseInt(ext.srcPort, 10);
    if (ext.dstPort) event.dst_port = parseInt(ext.dstPort, 10);
    if (ext.usrName) event.user_name = ext.usrName;
    if (ext.devTimeFormat) {
      // Just an example, LEEF time formats vary
      if (ext.devTime) {
        event.timestamp_utc = new Date(ext.devTime).toISOString();
      }
    }
  } catch (e) {
    warnings.push("Failed to fully parse LEEF");
  }

  return event;
}
