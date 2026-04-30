import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

export type ActorType = 'L1_AGENT' | 'L2_AGENT' | 'L3_AGENT' | 'SYSTEM' | 'USER';

export interface AuditData {
    actor_type: ActorType;
    actor_id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    metadata?: Record<string, any>;
}

/**
 * Logs an immutable audit entry with cryptographic hash-chaining.
 */
export async function logAudit(orgId: string, data: AuditData) {
    console.log(`[AuditLogger] Logging action: ${data.action} for Org ${orgId}`);

    try {
        // 1. Get the latest entry's hash for this organization
        const { data: latestEntry } = await supabaseAdmin
            .from('audit_trail')
            .select('current_hash')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const previousHash = latestEntry?.current_hash || 'GENESIS';
        const timestamp = new Date().toISOString();

        // 2. Compute current hash: SHA256(previous_hash + payload + timestamp)
        const payload = JSON.stringify({
            ...data,
            org_id: orgId,
            timestamp
        });

        const currentHash = crypto
            .createHash('sha256')
            .update(previousHash + payload + timestamp)
            .digest('hex');

        // 3. Insert into audit_trail
        await supabaseAdmin.from('audit_trail').insert({
            org_id: orgId,
            ...data,
            previous_hash: previousHash,
            current_hash: currentHash,
            created_at: timestamp
        });

    } catch (error) {
        console.error('[AuditLogger] Failed to log audit:', error);
        // We don't throw here to avoid crashing the caller, but in a mission-critical 
        // system, we might want to ensure audit logging succeeds.
    }
}

export default logAudit;
