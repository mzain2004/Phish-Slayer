import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class ShodanCollector extends BaseCollector {
  name = "Shodan";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const apiKey = process.env.SHODAN_API_KEY || '';
    if (!apiKey) return { collector: this.name, success: true, data: { ports: [], note: 'No API key' }, iocs: [] };

    const url = `https://api.shodan.io/shodan/host/${target.value}?key=${apiKey}`;
    const data = await this.safeRequest(url);

    if (!data) return { collector: this.name, success: false, data: null, iocs: [], error: 'Shodan fetch failed' };

    return {
      collector: this.name,
      success: true,
      data: {
        ports: data.ports,
        hostnames: data.hostnames,
        vulns: data.vulns,
        org: data.org,
        country: data.country_name,
        last_update: data.last_update
      },
      iocs: []
    };
  }
}
