import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";
import dns from "dns";

const { promises: dnsPromises } = dns;

export class DNSCollector extends BaseCollector {
  name = "DNS";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    if (target.type !== 'domain') {
      return { collector: this.name, success: false, data: null, iocs: [], error: 'Invalid target type' };
    }

    const results: any = {};
    const types: (keyof typeof dnsPromises)[] = ['resolve4', 'resolve6', 'resolveMx', 'resolveTxt', 'resolveNs', 'resolveSoa', 'resolveCname'];
    const typeMap: Record<string, string> = {
      'resolve4': 'A',
      'resolve6': 'AAAA',
      'resolveMx': 'MX',
      'resolveTxt': 'TXT',
      'resolveNs': 'NS',
      'resolveSoa': 'SOA',
      'resolveCname': 'CNAME'
    };

    for (const type of types) {
      try {
        const resolveFn = dnsPromises[type] as (hostname: string) => Promise<any>;
        results[typeMap[type]] = await resolveFn(target.value);
      } catch (e) {
        results[typeMap[type]] = [];
      }
    }

    return {
      collector: this.name,
      success: true,
      data: results,
      iocs: (results.A || []).map((ip: string) => ({ type: 'ip', value: ip, confidence: 0.5, source: this.name }))
    };
  }
}
