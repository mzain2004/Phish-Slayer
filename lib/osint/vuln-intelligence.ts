import { supabaseAdmin } from '@/lib/supabase/admin';

export async function trackVulnerabilities(orgId: string) {
    console.log(`Tracking vulnerabilities for Org ${orgId}...`);
    
    try {
        // 1. Fetch Organization Assets (Software names)
        const { data: assets } = await supabaseAdmin
            .from('assets')
            .select('id, name, type, metadata')
            .eq('organization_id', orgId);

        if (!assets || assets.length === 0) return;

        // 2. Fetch Latest CVEs (Simulated NVD pull for current date)
        // In a real scenario, we'd pull from NVD API or our global threat_iocs table from Sprint 4
        const { data: latestCVEs } = await supabaseAdmin
            .from('threat_iocs')
            .select('*')
            .eq('ioc_type', 'cve')
            .order('last_seen', { ascending: false })
            .limit(100);

        if (!latestCVEs) return;

        for (const asset of assets) {
            const assetName = asset.name.toLowerCase();
            
            for (const cve of latestCVEs) {
                const cveValue = cve.ioc_value;
                const tags = cve.tags || [];
                const isKev = tags.includes('kev');
                
                // Naive match logic: check if asset name appears in CVE tags or malware families
                const match = tags.some((t: string) => assetName.includes(t.toLowerCase())) || 
                              cve.malware_families?.some((f: string) => assetName.includes(f.toLowerCase()));

                if (match) {
                    // Calculate Priority Score
                    const cvss = cve.threat_score / 10;
                    const epss = 0.5; // Hypothetical EPSS
                    const hasPoc = tags.includes('has_poc') || tags.includes('exploit');
                    
                    const priorityScore = (cvss * 10) + (epss * 20) + (isKev ? 30 : 0) + (hasPoc ? 15 : 0);

                    // Insert to vuln_tracking
                    const { data: existing } = await supabaseAdmin
                        .from('vuln_tracking')
                        .select('id')
                        .eq('organization_id', orgId)
                        .eq('cve_id', cveValue)
                        .eq('asset_id', asset.id)
                        .maybeSingle();

                    if (!existing) {
                        await supabaseAdmin.from('vuln_tracking').insert({
                            organization_id: orgId,
                            cve_id: cveValue,
                            asset_id: asset.id,
                            priority_score: Math.round(priorityScore),
                            status: 'open',
                            is_kev: isKev,
                            has_poc: hasPoc
                        });

                        await supabaseAdmin.from('osint_findings').insert({
                            organization_id: orgId,
                            type: 'vulnerability_match',
                            severity: priorityScore > 70 ? 'CRITICAL' : 'HIGH',
                            source: 'VULN_INTEL',
                            details: { cve_id: cveValue, asset_name: asset.name, score: priorityScore }
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error tracking vulnerabilities for Org ${orgId}:`, error);
    }
}
