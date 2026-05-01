import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function generateAPIKey(
  orgId: string,
  name: string,
  scopes: string[],
  expiresAt?: Date
): Promise<{ key: string; prefix: string; id: string }> {
  const rawKey = crypto.randomBytes(32).toString('base64url');
  const prefix = 'ps_' + rawKey.substring(0, 8);
  const hash = await bcrypt.hash(rawKey, 10);

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      org_id: orgId,
      name: name,
      key_hash: hash,
      key_prefix: prefix,
      scopes: scopes,
      expires_at: expiresAt?.toISOString()
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to generate API key: ${error.message}`);
  }

  return {
    key: rawKey,
    prefix: prefix,
    id: data.id
  };
}

export async function verifyAPIKey(
  rawKey: string,
  requiredScope?: string
): Promise<{ orgId: string; keyId: string } | null> {
  if (!rawKey.startsWith('ps_')) return null;

  const prefix = rawKey.substring(0, 11); // ps_ + 8 chars = 11 chars

  const { data: keys, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, org_id, key_hash, scopes, expires_at')
    .eq('key_prefix', prefix)
    .eq('is_active', true);

  if (error || !keys || keys.length === 0) return null;

  for (const key of keys) {
    const isMatch = await bcrypt.compare(rawKey, key.key_hash);
    if (isMatch) {
      // Check expiry
      if (key.expires_at && new Date(key.expires_at) < new Date()) {
        continue;
      }

      // Check scope
      if (requiredScope && !key.scopes.includes(requiredScope)) {
        continue;
      }

      // Update last used
      await supabaseAdmin
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', key.id);

      return {
        orgId: key.org_id,
        keyId: key.id
      };
    }
  }

  return null;
}
