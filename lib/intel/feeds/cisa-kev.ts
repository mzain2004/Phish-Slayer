import { deduplicateIOC } from '../ioc-processor';

export async function pullCISAKEV() {
    try {
        const response = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
        const data = await response.json();
        
        if (data.vulnerabilities) {
            for (const vuln of data.vulnerabilities) {
                await deduplicateIOC({
                    ioc_type: 'cve',
                    ioc_value: vuln.cveID,
                    threat_score: 95,
                    confidence: 0.99,
                    tags: ['kev', vuln.product, vuln.vulnerabilityName],
                    source: 'CISA KEV'
                });
            }
        }
    } catch (e) {
        console.error('CISA KEV pull failed', e);
    }
}
