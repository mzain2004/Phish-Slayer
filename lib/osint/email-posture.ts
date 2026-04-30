import { supabaseAdmin } from '@/lib/supabase/admin';
import dns from 'dns/promises';

export async function checkEmailPosture(orgId: string, domain: string) {
    console.log(`Checking email posture for ${domain} (Org ${orgId})...`);
    
    let score = 100;
    const result: any = { domain, organization_id: orgId };

    try {
        // 1. SPF Check
        const txtRecords = await dns.resolveTxt(domain).catch(() => []);
        const spfRecord = txtRecords.flat().find(r => r.startsWith('v=spf1'));
        result.spf_record = spfRecord || 'Missing';
        
        if (!spfRecord) {
            result.spf_status = 'MISSING';
            score -= 30;
        } else if (spfRecord.includes('+all')) {
            result.spf_status = 'CRITICAL_VULNERABLE';
            score -= 50;
        } else {
            result.spf_status = 'VALID';
        }

        // 2. DMARC Check
        const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`).catch(() => []);
        const dmarcRecord = dmarcRecords.flat().find(r => r.startsWith('v=DMARC1'));
        result.dmarc_record = dmarcRecord || 'Missing';

        if (!dmarcRecord) {
            result.dmarc_status = 'MISSING';
            score -= 30;
        } else if (dmarcRecord.includes('p=none')) {
            result.dmarc_status = 'WEAK_POLICY';
            score -= 15;
        } else {
            result.dmarc_status = 'SECURE';
        }

        // 3. DKIM Check (Hard to check without selector, we'll check common one)
        const commonSelectors = ['google', 'default', 'k1'];
        let dkimFound = false;
        for (const selector of commonSelectors) {
            const dkim = await dns.resolveTxt(`${selector}._domainkey.${domain}`).catch(() => []);
            if (dkim.length > 0) {
                dkimFound = true;
                break;
            }
        }
        result.dkim_status = dkimFound ? 'FOUND' : 'UNKNOWN';

        result.security_score = Math.max(0, score);
        
        await supabaseAdmin.from('email_posture_results').insert(result);

        if (score < 70) {
            await supabaseAdmin.from('osint_findings').insert({
                organization_id: orgId,
                type: 'weak_email_security',
                severity: score < 50 ? 'CRITICAL' : 'HIGH',
                source: 'EMAIL_POSTURE',
                details: { score: result.security_score, spf: result.spf_status, dmarc: result.dmarc_status }
            });
        }

    } catch (error) {
        console.error(`Error checking email posture for ${domain}:`, error);
    }
}
