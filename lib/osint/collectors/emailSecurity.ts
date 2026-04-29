import { BaseCollector } from "../baseCollector";
import { OsintTarget, CollectorResult } from "../types";
import dns from "dns";

const { promises: dnsPromises } = dns;

export class EmailSecurityCollector extends BaseCollector {
  name = "Email Security";

  async collect(target: OsintTarget): Promise<CollectorResult> {
    const domain = target.value;
    const results: any = {
      spf: { exists: false, policy: null },
      dkim: { exists: false },
      dmarc: { exists: false, policy: null }
    };

    try {
      const txt = await dnsPromises.resolveTxt(domain);
      const spfRecord = txt.flat().find(r => r.startsWith("v=spf1"));
      if (spfRecord) {
        results.spf.exists = true;
        results.spf.policy = spfRecord;
      }
    } catch (e) {}

    try {
      const dmarcTxt = await dnsPromises.resolveTxt(`_dmarc.${domain}`);
      const dmarcRecord = dmarcTxt.flat().find(r => r.startsWith("v=DMARC1"));
      if (dmarcRecord) {
        results.dmarc.exists = true;
        results.dmarc.policy = dmarcRecord;
      }
    } catch (e) {}

    let score = 0;
    if (results.spf.exists) score += 40;
    if (results.dmarc.exists) score += 60;
    
    results.grade = score >= 100 ? 'A' : score >= 40 ? 'B' : 'F';

    return {
      collector: this.name,
      success: true,
      data: results,
      iocs: []
    };
  }
}
