import { deduplicateIOC } from '../ioc-processor';

export async function pullNVD() {
    console.log('Pulling NVD CVE feed...');
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('.')[0]; // Format: YYYY-MM-DDTHH:MM:SS

        const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${dateStr}`);
        const data = await response.json();
        
        if (data.vulnerabilities) {
            for (const item of data.vulnerabilities) {
                const cve = item.cve;
                const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 
                             cve.metrics?.cvssMetricV30?.[0]?.cvssData?.baseScore || 5.0;

                await deduplicateIOC({
                    ioc_type: 'cve',
                    ioc_value: cve.id,
                    threat_score: Math.round(cvss * 10),
                    confidence: 0.85,
                    tags: [cve.vulnStatus],
                    source: 'NVD'
                });
            }
        }
    } catch (e) {
        console.error('NVD pull failed', e);
    }
}
