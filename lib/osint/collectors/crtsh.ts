import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class CrtshCollector extends BaseCollector {
  name = "Certificate Transparency";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const url = `https://crt.sh/?q=${target.value}&output=json`;
    const data = await this.safeRequest(url);

    if (!data || !Array.isArray(data)) {
      return { collector: this.name, success: false, data: { subdomains: [] }, iocs: [], error: 'crt.sh failure' };
    }

    const subdomains = Array.from(new Set(data.map(item => item.common_name).concat(data.map(item => item.name_value.split('\n')).flat())));
    const filteredSubdomains = subdomains.filter(s => s && s.includes(target.value) && !s.includes('*'));

    return {
      collector: this.name,
      success: true,
      data: {
        subdomains: filteredSubdomains,
        certCount: data.length,
        oldestCert: data.length > 0 ? data[data.length-1].not_before : null,
        newestCert: data.length > 0 ? data[0].not_before : null
      },
      iocs: filteredSubdomains.map(s => ({ type: 'domain', value: s, confidence: 0.4, source: this.name }))
    };
  }
}
