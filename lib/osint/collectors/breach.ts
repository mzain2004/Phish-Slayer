import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class BreachCollector extends BaseCollector {
  name = "Data Breaches";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const apiKey = process.env.HIBP_API_KEY || '';
    if (!apiKey) return { collector: this.name, success: true, data: { breachCount: 0, note: 'No API key' }, iocs: [] };

    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(target.value)}`;
    const data = await this.safeRequest(url, { headers: { 'hibp-api-key': apiKey }});

    if (data === null) return { collector: this.name, success: true, data: { breachCount: 0 }, iocs: [] };

    return {
      collector: this.name,
      success: true,
      data: {
        breachCount: data.length,
        breaches: data.map((b: any) => ({ name: b.Name, date: b.BreachDate, dataClasses: b.DataClasses }))
      },
      iocs: []
    };
  }
}
