import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class FileHashCollector extends BaseCollector {
  name = "Malware Intel";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const vtKey = process.env.VIRUSTOTAL_API_KEY || '';
    const results: any = {};

    if (vtKey) {
      const vtUrl = `https://www.virustotal.com/api/v3/files/${target.value}`;
      const vtData = await this.safeRequest(vtUrl, { headers: { 'x-apikey': vtKey }});
      if (vtData && vtData.data) {
        const attr = vtData.data.attributes;
        results.vtMalicious = attr.last_analysis_stats.malicious;
        results.vtTotal = attr.last_analysis_stats.total;
        results.tags = attr.tags;
      }
    }

    try {
      const mbRes = await fetch('https://mb-api.abuse.ch/api/v1/', {
        method: 'POST',
        body: new URLSearchParams({ query: 'get_info', hash: target.value })
      });
      const mbData = await mbRes.json();
      if (mbData && mbData.query_status === 'ok') {
        const file = mbData.data[0];
        results.malwareFamily = file.signature;
        results.firstSeen = file.first_seen;
        results.lastSeen = file.last_seen;
      }
    } catch (e) {}

    return {
      collector: this.name,
      success: true,
      data: results,
      iocs: []
    };
  }
}
