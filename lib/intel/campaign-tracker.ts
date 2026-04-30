import { supabaseAdmin } from '@/lib/supabase/admin';
import { matchActor } from './actor-matcher';

export async function checkCampaignLink(orgId: string, alert: any): Promise<void> {
    console.log(`[CampaignTracker] Checking campaign links for alert ${alert.id}`);

    try {
        // 1. Extract IOCs from alert payload/enrichment
        const iocs = {
            ips: [] as string[],
            domains: [] as string[],
            hashes: [] as string[]
        };

        if (alert.enrichment?.ip) iocs.ips.push(alert.enrichment.ip);
        if (alert.enrichment?.domain) iocs.domains.push(alert.enrichment.domain);
        if (alert.enrichment?.hash) iocs.hashes.push(alert.enrichment.hash);

        // 2. Query existing active campaigns for matching IOCs
        // Using a basic overlap check for POC
        const { data: campaigns } = await supabaseAdmin
            .from('campaigns')
            .select('*')
            .eq('org_id', orgId)
            .eq('status', 'active');

        let matchedCampaign = null;
        if (campaigns) {
            for (const campaign of campaigns) {
                const cIocs = campaign.iocs;
                const hasMatch = iocs.ips.some(ip => cIocs.ips.includes(ip)) ||
                                 iocs.domains.some(d => cIocs.domains.includes(d)) ||
                                 iocs.hashes.some(h => cIocs.hashes.includes(h));
                
                if (hasMatch) {
                    matchedCampaign = campaign;
                    break;
                }
            }
        }

        if (matchedCampaign) {
            // 3. Update existing campaign
            const updatedIocs = {
                ips: Array.from(new Set([...matchedCampaign.iocs.ips, ...iocs.ips])),
                domains: Array.from(new Set([...matchedCampaign.iocs.domains, ...iocs.domains])),
                hashes: Array.from(new Set([...matchedCampaign.iocs.hashes, ...iocs.hashes]))
            };

            await supabaseAdmin.from('campaigns').update({
                iocs: updatedIocs,
                linked_alerts: Array.from(new Set([...matchedCampaign.linked_alerts, alert.id])),
                last_seen: new Date().toISOString()
            }).eq('id', matchedCampaign.id);

            console.log(`[CampaignTracker] Linked alert ${alert.id} to campaign ${matchedCampaign.id}`);
        } else {
            // 4. Try actor attribution for new campaign
            const techniques = alert.mitre_techniques?.map((t: any) => t.id) || [];
            const actorMatches = await matchActor(orgId, techniques);
            
            if (actorMatches.length > 0 && actorMatches[0].confidence > 0.6) {
                const actor = actorMatches[0].actor;
                const dateStr = new Date().toISOString().split('T')[0];

                await supabaseAdmin.from('campaigns').insert({
                    org_id: orgId,
                    name: `${actor.name} Campaign - ${dateStr}`,
                    actor_id: actor.id,
                    status: 'active',
                    iocs: iocs,
                    linked_alerts: [alert.id],
                    first_seen: new Date().toISOString(),
                    last_seen: new Date().toISOString(),
                    tlp: 'AMBER'
                });
                
                console.log(`[CampaignTracker] Created new campaign for actor ${actor.id}`);
            }
        }

    } catch (error) {
        console.error('[CampaignTracker] Error:', error);
    }
}
