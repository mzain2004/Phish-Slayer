import { UDMEvent } from '../udm';

export function parseCEF(raw: string | Buffer): Partial<UDMEvent> {
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
    // Format: CEF:Version|DeviceVendor|Product|Version|SignatureId|Name|Severity|Extension
    const cefMatch = rawStr.match(/^CEF:(\d+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([\s\S]*)$/);
    if (!cefMatch) {
      warnings.push("Not a valid CEF string format");
      return event;
    }

    const [_, version, vendor, product, prodVer, sigId, name, severity, extStr] = cefMatch;
    event.alert_rule_id = sigId;
    event.alert_rule_name = name;
    event.alert_severity_raw = severity;
    event.event_type = severity ? 'alert' : 'log';
    
    // Parse extensions
    const extPairs = [...extStr.matchAll(/([a-zA-Z0-9_]+)=((?:[^=](?!\s+[a-zA-Z0-9_]+=))*)/g)];
    const ext: Record<string, string> = {};
    for (const match of extPairs) {
      ext[match[1]] = match[2].trim();
    }

    if (ext.src) event.src_ip = ext.src;
    if (ext.dst) event.dst_ip = ext.dst;
    if (ext.spt) event.src_port = parseInt(ext.spt, 10);
    if (ext.dpt) event.dst_port = parseInt(ext.dpt, 10);
    if (ext.suser) event.user_name = ext.suser;
    if (ext.dhost) event.host_name = ext.dhost;
    if (ext.act) event.event_action = ext.act;
    if (ext.outcome) event.event_outcome = ext.outcome;
    if (ext.rt) {
      const timestamp = parseInt(ext.rt, 10);
      if (!isNaN(timestamp)) event.timestamp_utc = new Date(timestamp).toISOString();
    }

    if (ext.cs1) event.extra!.cs1 = ext.cs1;
    if (ext.cs2) event.extra!.cs2 = ext.cs2;
    if (ext.cs3) event.extra!.cs3 = ext.cs3;

  } catch (e) {
    warnings.push("Failed to fully parse CEF");
  }

  return event;
}
