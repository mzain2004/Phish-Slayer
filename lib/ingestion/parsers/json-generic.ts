import { UDMEvent } from '../udm';

export function parseJsonGeneric(raw: string | Buffer): Partial<UDMEvent> {
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
    const data = JSON.parse(rawStr);
    
    // Auto detect timestamps
    const tsKey = ['timestamp', 'time', '@timestamp', 'date', 'created_at', 'eventTime'].find(k => data[k]);
    if (tsKey) event.timestamp_utc = new Date(data[tsKey]).toISOString();

    // Auto detect IP
    const ipKey = ['src_ip', 'srcip', 'source_ip', 'sourceIp', 'client_ip', 'clientIp'].find(k => data[k]);
    if (ipKey) event.src_ip = data[ipKey];

    // Auto detect user
    const userKey = ['user', 'username', 'user_name', 'userName', 'account'].find(k => data[k]);
    if (userKey) event.user_name = data[userKey];

    // Auto detect host
    const hostKey = ['host', 'hostname', 'host_name', 'hostName', 'computer', 'device'].find(k => data[k]);
    if (hostKey) event.host_name = data[hostKey];

    // Any leftovers in extra
    Object.keys(data).forEach(k => {
      if (![tsKey, ipKey, userKey, hostKey].includes(k)) {
        event.extra![k] = data[k];
      }
    });
  } catch (e) {
    warnings.push("Failed to parse Generic JSON");
  }

  return event;
}
