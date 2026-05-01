import { supabaseAdmin } from '@/lib/supabase/admin';

export interface FrameworkScore {
    nist_csf: number;
    iso_27001: number;
    soc2: number;
}

const MITRE_TO_NIST_ISO: Record<string, { nist: string[], iso: string[] }> = {
    'T1566': { nist: ['DE.CM-1', 'PR.DS-5'], iso: ['A.12.4.1', 'A.13.2.1'] }, // Phishing
    'T1059': { nist: ['PR.IP-1'], iso: ['A.12.1.2'] }, // Command and Scripting Interpreter
    'T1078': { nist: ['PR.AC-1', 'PR.AC-4'], iso: ['A.9.2.1', 'A.9.4.1'] }, // Valid Accounts
    'T1486': { nist: ['RC.RP-1'], iso: ['A.17.1.1'] }, // Data Encrypted for Impact (Ransomware)
    'T1133': { nist: ['PR.AC-3'], iso: ['A.9.4.2'] }, // External Remote Services
    'T1210': { nist: ['PR.PT-4'], iso: ['A.12.6.1'] }, // Exploitation of Remote Services
    'T1003': { nist: ['PR.AC-6'], iso: ['A.9.4.4'] }, // OS Credential Dumping
};

export async function getCompliancePosture(orgId: string): Promise<FrameworkScore> {

    try {
        // 1. Fetch MITRE Coverage
        const { data: coverage } = await supabaseAdmin
            .from('mitre_coverage')
            .select('technique_id, coverage_level')
            .eq('organization_id', orgId);

        if (!coverage || coverage.length === 0) {
            return { nist_csf: 0, iso_27001: 0, soc2: 0 };
        }

        const coveredTechniques = coverage.filter(c => (c.coverage_level || 0) > 50).map(c => c.technique_id);
        
        let nistHits = 0;
        let isoHits = 0;
        const totalTechniquesMapped = Object.keys(MITRE_TO_NIST_ISO).length;

        for (const tid of coveredTechniques) {
            if (MITRE_TO_NIST_ISO[tid]) {
                nistHits++;
                isoHits++;
            }
        }

        // Naive calculation for POC
        return {
            nist_csf: Math.round((nistHits / totalTechniquesMapped) * 100),
            iso_27001: Math.round((isoHits / totalTechniquesMapped) * 100),
            soc2: Math.round(((nistHits + isoHits) / (totalTechniquesMapped * 2)) * 100)
        };

    } catch (error) {
        console.error('[FrameworkMapper] Posture calculation failed:', error);
        return { nist_csf: 0, iso_27001: 0, soc2: 0 };
    }
}
