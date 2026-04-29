import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";

export class WhoisCollector extends BaseCollector {
  name = "Whois";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const apiKey = process.env.WHOISXMLAPI_KEY || '';
    if (!apiKey) {
      return { 
        collector: this.name, 
        success: true, 
        data: { registrar: 'unknown', age: null, note: 'No API key provided' }, 
        iocs: [] 
      };
    }

    const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=${target.value}&apiKey=${apiKey}&outputFormat=JSON`;
    const data = await this.safeRequest(url);

    if (!data || !data.WhoisRecord) {
      return { collector: this.name, success: false, data: null, iocs: [], error: 'Failed to fetch whois' };
    }

    const record = data.WhoisRecord;
    return {
      collector: this.name,
      success: true,
      data: {
        registrar: record.registrarName,
        created_date: record.createdDate,
        expiry_date: record.expiresDate,
        registrant: record.registrant?.organization,
        nameservers: record.nameServers?.hostNames
      },
      iocs: []
    };
  }
}
