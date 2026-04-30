import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function monitorPasteSites(orgId: string, keywords: string[]) {
    console.log(`Monitoring paste sites for Org ${orgId}...`);
    
    // In a real scenario, we would use dedicated scrapers or APIs like Pastebin Scraping API.
    // For this implementation, we simulate the scraping process.
    
    const mockPastes = [
        { url: 'https://pastebin.com/raw/xyz123', content: `Internal network config for ${keywords[0]}. Host: prod-db-01.internal` },
        { url: 'https://ghostbin.com/raw/abc456', content: `Found some creds: admin@${keywords[0]} / P@ssw0rd123!` },
        { url: 'https://rentry.co/raw/def789', content: `Meeting notes for ${keywords[0]} project X.` }
    ];

    for (const paste of mockPastes) {
        const matches = keywords.some(k => paste.content.toLowerCase().includes(k.toLowerCase()));
        
        if (matches) {
            const contentHash = crypto.createHash('sha256').update(paste.content).digest('hex');
            
            // Check if already archived
            const { data: existing } = await supabaseAdmin
                .from('paste_archives')
                .select('id')
                .eq('content_hash', contentHash)
                .maybeSingle();

            if (!existing) {
                await supabaseAdmin.from('paste_archives').insert({
                    organization_id: orgId,
                    paste_url: paste.url,
                    paste_content: paste.content,
                    content_hash: contentHash
                });

                // Create OSINT finding
                let severity: 'HIGH' | 'CRITICAL' = 'HIGH';
                if (paste.content.includes('P@ssw0rd123!') || paste.content.toLowerCase().includes('password')) {
                    severity = 'CRITICAL';
                }

                await supabaseAdmin.from('osint_findings').insert({
                    organization_id: orgId,
                    type: 'paste_exposure',
                    severity,
                    source: 'PASTE_MONITOR',
                    details: { url: paste.url, match_type: severity === 'CRITICAL' ? 'credentials' : 'mention' }
                });
            }
        }
    }
}
