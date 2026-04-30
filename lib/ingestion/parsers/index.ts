import { UDMEvent } from '../udm';
import { parseWazuh } from './wazuh';
import { parseCEF } from './cef';
import { parseLEEF } from './leef';
import { parseSyslog } from './syslog';
import { parseJsonGeneric } from './json-generic';
import { parseCloudtrail } from './cloudtrail';
import { parseO365 } from './o365';
import { parseSuricata } from './suricata';
import { parseZeek } from './zeek';

export function detectFormat(raw: string | Buffer): string {
  const rawStr = typeof raw === 'string' ? raw : raw.toString('utf-8');
  
  if (rawStr.startsWith('CEF:')) return 'cef';
  if (rawStr.startsWith('LEEF:')) return 'leef';
  if (rawStr.match(/^<\d+>/)) return 'syslog';
  if (rawStr.startsWith('#separator')) return 'zeek';
  
  try {
    const json = JSON.parse(rawStr);
    if (json.rule && json.agent) return 'wazuh';
    if (json.userIdentity && json.eventSource === 'aws.amazonaws.com') return 'cloudtrail';
    if (json.CreationTime && json.Workload) return 'o365';
    if (json.event_type && json.src_ip && json.dest_ip) return 'suricata';
    return 'json-generic';
  } catch (e) {
    // Fallback if not JSON and not a known header
    return 'unknown';
  }
}

export function parseEvent(raw: string | Buffer, format: string, connectorType: string): Partial<UDMEvent> {
  const autoFormat = format && format !== 'unknown' ? format : detectFormat(raw);

  switch (autoFormat) {
    case 'wazuh': return parseWazuh(raw);
    case 'cef': return parseCEF(raw);
    case 'leef': return parseLEEF(raw);
    case 'syslog': return parseSyslog(raw);
    case 'cloudtrail': return parseCloudtrail(raw);
    case 'o365': return parseO365(raw);
    case 'suricata': return parseSuricata(raw);
    case 'zeek': return parseZeek(raw);
    case 'json-generic': return parseJsonGeneric(raw);
    default:
      // Unrecognized format fallback
      return {
        raw_log: typeof raw === 'string' ? raw : raw.toString('utf-8'),
        event_type: 'log',
        normalization_version: '1.0',
        normalization_warnings: ['UNRECOGNIZED_FORMAT']
      };
  }
}
