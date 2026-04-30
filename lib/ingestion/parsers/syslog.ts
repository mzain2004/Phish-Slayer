import { UDMEvent } from '../udm';

export function parseSyslog(raw: string | Buffer): Partial<UDMEvent> {
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
    // Basic RFC 3164 match: <PRI>TIMESTAMP HOSTNAME TAG: MESSAGE
    // Example: <34>Oct 11 22:14:15 mymachine su: 'su root' failed
    const rfc3164 = rawStr.match(/^<(\d+)>([A-Z][a-z]{2}\s+\d+\s\d{2}:\d{2}:\d{2})\s+(\S+)\s+([^:]*?):\s+([\s\S]*)$/);
    
    if (rfc3164) {
      const [_, priStr, ts, host, tag, msg] = rfc3164;
      event.host_name = host;
      event.extra!.syslog_tag = tag;
      
      const pri = parseInt(priStr, 10);
      const severity = pri & 7; // Extract severity
      event.alert_severity_raw = severity.toString();
      
      // SSH Pattern mapping
      if (tag.includes('sshd')) {
        const sshMatch = msg.match(/(Accepted|Failed) password for (invalid user )?(\S+) from (\S+) port \d+ ssh2/);
        if (sshMatch) {
          event.event_outcome = sshMatch[1].toLowerCase();
          event.user_name = sshMatch[3];
          event.src_ip = sshMatch[4];
          event.event_action = 'login';
        }
      }
      return event;
    }

    warnings.push("Format did not match known syslog RFCs cleanly");
  } catch (e) {
    warnings.push("Syslog parsing error");
  }
  return event;
}
