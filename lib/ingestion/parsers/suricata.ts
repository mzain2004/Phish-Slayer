import { UDMEvent } from '../udm';

export function parseSuricata(raw: string | Buffer): Partial<UDMEvent> {
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
    const data = JSON.parse(rawStr);
    
    if (data.timestamp) event.timestamp_utc = new Date(data.timestamp).toISOString();
    if (data.src_ip) event.src_ip = data.src_ip;
    if (data.dest_ip) event.dst_ip = data.dest_ip;
    if (data.src_port) event.src_port = data.src_port;
    if (data.dest_port) event.dst_port = data.dest_port;
    if (data.proto) event.protocol = data.proto.toLowerCase();
    
    if (data.alert) {
      event.event_type = 'alert';
      event.alert_rule_name = data.alert.signature;
      event.alert_rule_id = data.alert.signature_id?.toString();
      const sev = data.alert.severity;
      if (sev === 1) event.alert_severity_score = 75;
      else if (sev === 2) event.alert_severity_score = 50;
      else if (sev === 3) event.alert_severity_score = 25;
    }

    if (data.dns?.query) {
      event.dns_query = data.dns.rrname || data.dns.query;
    }
    
    if (data.http) {
      if (data.http.url) event.http_url = data.http.url;
      if (data.http.http_method) event.http_method = data.http.http_method;
      if (data.http.status) event.http_status = parseInt(data.http.status, 10);
    }
  } catch (e) {
    warnings.push("Failed to parse Suricata JSON");
  }

  return event;
}
