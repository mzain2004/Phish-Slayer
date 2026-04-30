import { UDMEvent } from '../udm';

export function parseWazuh(raw: string | Buffer): Partial<UDMEvent> {
  const warnings: string[] = [];
  try {
    const rawStr = typeof raw === 'string' ? raw : raw.toString('utf-8');
    const json = JSON.parse(rawStr);
    
    const event: Partial<UDMEvent> = {
      raw_log: rawStr,
      normalization_version: '1.0',
      normalization_warnings: warnings,
      event_type: json.rule?.level ? 'alert' : 'log',
      extra: {}
    };

    if (json.rule) {
      const lvl = parseInt(json.rule.level);
      if (!isNaN(lvl)) {
        event.alert_severity_score = Math.min(100, Math.floor(lvl * 6.25));
        event.alert_severity_raw = json.rule.level.toString();
      }
      event.alert_rule_id = json.rule.id;
      event.alert_rule_name = json.rule.description;
    }

    if (json.agent) {
      event.src_ip = json.agent.ip;
      event.host_name = json.agent.name;
    }

    if (json.data) {
      if (json.data.srcip) event.src_ip = json.data.srcip;
      if (json.data.dstip) event.dst_ip = json.data.dstip;
      if (json.data.dstport) event.dst_port = parseInt(json.data.dstport, 10);
      
      if (json.data.win) {
        if (json.data.win.system?.subjectUserName) {
          event.user_name = json.data.win.system.subjectUserName;
        }
        if (json.data.win.eventdata?.commandLine) {
          event.process_cmdline = json.data.win.eventdata.commandLine;
        }
        if (json.data.win.eventdata?.hashes) {
          // Extract SHA256=...
          const hashMatch = json.data.win.eventdata.hashes.match(/SHA256=([A-Fa-f0-9]{64})/i);
          if (hashMatch) {
            event.process_hash_sha256 = hashMatch[1].toLowerCase();
          }
        }
      }
    }

    if (json.timestamp) {
      // Wazuh timestamps are generally ISO
      event.timestamp_utc = new Date(json.timestamp).toISOString();
    }

    return event;
  } catch (e) {
    warnings.push("Failed to parse Wazuh JSON");
    return {
      raw_log: typeof raw === 'string' ? raw : raw.toString('utf-8'),
      normalization_warnings: warnings
    };
  }
}
