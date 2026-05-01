import { deduplicateIOC } from '../ioc-processor';

export async function pullAbuseCH() {
    
    // 1. URLhaus (Recent URLs)
    try {
        const response = await fetch('https://urlhaus-api.abuse.ch/v1/urls/recent/');
        const data = await response.json();
        if (data.query_status === 'ok') {
            for (const item of data.urls) {
                await deduplicateIOC({
                    ioc_type: 'url',
                    ioc_value: item.url,
                    threat_score: 80,
                    confidence: 0.8,
                    tags: item.tags || [],
                    source: 'abuse.ch/urlhaus'
                });
            }
        }
    } catch (e) { console.error('URLhaus pull failed', e); }

    // 2. ThreatFox (Recent IOCs)
    try {
        const response = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
            method: 'POST',
            body: JSON.stringify({ query: 'get_iocs', days: 1 })
        });
        const data = await response.json();
        if (data.query_status === 'ok') {
            for (const item of data.data) {
                let type: any = null;
                if (item.ioc_type === 'ip:port') type = 'ip';
                else if (item.ioc_type === 'domain') type = 'domain';
                else if (item.ioc_type === 'url') type = 'url';
                else if (item.ioc_type === 'md5_hash') type = 'hash_md5';
                else if (item.ioc_type === 'sha256_hash') type = 'hash_sha256';

                if (type) {
                    await deduplicateIOC({
                        ioc_type: type,
                        ioc_value: item.ioc.split(':')[0], // Strip port for IP
                        threat_score: 75,
                        confidence: 0.75,
                        tags: [item.threat_type],
                        malware_families: [item.malware_printable],
                        source: 'abuse.ch/threatfox'
                    });
                }
            }
        }
    } catch (e) { console.error('ThreatFox pull failed', e); }

    // 3. MalwareBazaar (Recent Hashes)
    try {
        const response = await fetch('https://mb-api.abuse.ch/api/v1/', {
            method: 'POST',
            body: new URLSearchParams({ query: 'get_recent', selector: '100' })
        });
        const data = await response.json();
        if (data.query_status === 'ok') {
            for (const item of data.data) {
                await deduplicateIOC({
                    ioc_type: 'hash_sha256',
                    ioc_value: item.sha256_hash,
                    threat_score: 90,
                    confidence: 0.9,
                    tags: item.tags || [],
                    malware_families: [item.signature],
                    source: 'abuse.ch/malwarebazaar'
                });
            }
        }
    } catch (e) { console.error('MalwareBazaar pull failed', e); }
}
