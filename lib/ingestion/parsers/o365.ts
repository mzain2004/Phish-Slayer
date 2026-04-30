import { UDMEvent } from '../udm';

export function parseO365(raw: string | Buffer): Partial<UDMEvent> {
  const warnings: string[] = [];
  const rawStr = typeof raw === 'string' ? raw : raw.toString('utf-8');

  const event: Partial<UDMEvent> = {
    raw_log: rawStr,
    normalization_version: '1.0',
    normalization_warnings: warnings,
    event_type: 'audit',
    extra: {}
  };

  try {
    const data = JSON.parse(rawStr);
    
    if (data.CreationTime) event.timestamp_utc = new Date(data.CreationTime).toISOString();
    if (data.UserId) event.user_upn = data.UserId;
    if (data.ClientIP) event.src_ip = data.ClientIP;
    if (data.Operation) event.event_action = data.Operation;
    if (data.Workload) event.extra!.o365_workload = data.Workload;
    
    if (data.ResultStatus) {
      event.event_outcome = data.ResultStatus.toLowerCase();
    }
  } catch (e) {
    warnings.push("Failed to parse O365 JSON");
  }

  return event;
}
