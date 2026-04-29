import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class IPReputationCollector extends BaseCollector {
  name = "IP Reputation";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const apiKey = process.env.ABUSEIPDB_API_KEY || '';
    const results: any = { isTor: false };

    if (apiKey) {
      const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${target.value}&maxAgeInDays=90`;
      const data = await this.safeRequest(url, { headers: { 'Key': apiKey, 'Accept': 'application/json' }});
      if (data && data.data) {
        results.abuseScore = data.data.abuseConfidenceScore;
        results.totalReports = data.data.totalReports;
        results.lastReportedAt = data.data.lastReportedAt;
        results.isp = data.data.isp;
      }
    }

    try {
      const torRes = await fetch('https://check.torproject.org/exit-addresses');
      const torText = await torRes.text();
      if (torText.includes(target.value)) {
        results.isTor = true;
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
