import { supabaseAdmin } from '@/lib/supabase/admin';

export async function mapInfrastructure(orgId: string, orgName: string) {
    
    const shodanKey = process.env.SHODAN_API_KEY;
    if (!shodanKey) {
        console.warn('SHODAN_API_KEY not found. Infrastructure footprinting will be disabled.');
        return;
    }

    try {
        const query = `org:"${orgName}"`;
        const response = await fetch(`https://api.shodan.io/shodan/host/search?key=${shodanKey}&query=${encodeURIComponent(query)}`);
        
        if (response.ok) {
            const data = await response.json();
            
            for (const match of data.matches) {
                const ip = match.ip_str;
                const port = match.port;
                const service = match.product || match.data;
                const hostname = match.hostnames?.[0] || '';

                // Upsert to attack_surface
                const { data: existing } = await supabaseAdmin
                    .from('attack_surface')
                    .select('id, port, service')
                    .eq('organization_id', orgId)
                    .eq('ip', ip)
                    .eq('port', port)
                    .maybeSingle();

                if (!existing) {
                    await supabaseAdmin.from('attack_surface').insert({
                        organization_id: orgId,
                        host: hostname,
                        ip: ip,
                        port: port,
                        service: service,
                        banner: match.data,
                        vulnerabilities: match.vulns || [],
                        tls_details: match.ssl || {}
                    });

                    await supabaseAdmin.from('osint_findings').insert({
                        organization_id: orgId,
                        type: 'new_exposed_asset',
                        severity: 'MEDIUM',
                        source: 'SHODAN',
                        details: { ip, port, service }
                    });
                } else if (existing.service !== service) {
                    await supabaseAdmin.from('attack_surface').update({
                        service: service,
                        banner: match.data,
                        last_seen: new Date().toISOString()
                    }).eq('id', existing.id);
                }

                if (match.vulns && Object.keys(match.vulns).length > 0) {
                    await supabaseAdmin.from('osint_findings').insert({
                        organization_id: orgId,
                        type: 'exposed_vulnerability',
                        severity: 'HIGH',
                        source: 'SHODAN',
                        details: { ip, port, vulns: match.vulns }
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error mapping infrastructure for ${orgName}:`, error);
    }
}
