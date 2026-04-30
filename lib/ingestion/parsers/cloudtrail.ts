import { UDMEvent } from '../udm';

export function parseCloudtrail(raw: string | Buffer): Partial<UDMEvent> {
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
    
    if (data.eventTime) event.timestamp_utc = new Date(data.eventTime).toISOString();
    if (data.sourceIPAddress) event.src_ip = data.sourceIPAddress;
    if (data.userIdentity?.userName) event.user_name = data.userIdentity.userName;
    if (data.eventName) event.event_action = data.eventName;
    
    event.event_outcome = data.errorCode ? 'failure' : 'success';
    
    if (data.resources && Array.isArray(data.resources)) {
      event.extra!.aws_resource = data.resources.map((r: any) => r.ARN);
    }
  } catch (e) {
    warnings.push("Failed to parse CloudTrail JSON");
  }

  return event;
}
