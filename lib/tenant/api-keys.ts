import * as crypto from "node:crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import { WhitelabelAPIKey } from "../soc/types";
import { v4 as uuidv4 } from "uuid";

export function generateAPIKey(): string {
  const bytes = crypto.randomBytes(48);
  return `ps_${bytes.toString("hex")}`;
}

export function hashAPIKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Creates a new API key for a tenant.
 * Note: The plain key is returned once — not stored — cannot be recovered.
 */
export async function createAPIKey(
  tenant_id: string, 
  label: string, 
  permissions: string[], 
  supabase: SupabaseClient
): Promise<{ key: string, record: WhitelabelAPIKey }> {
  const key = generateAPIKey();
  const hash = hashAPIKey(key);
  const id = uuidv4();

  const { data, error } = await supabase
    .from("whitelabel_api_keys")
    .insert({
      id,
      tenant_id,
      key_hash: hash,
      label,
      permissions,
      active: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  return { key, record: data };
}

export async function validateAPIKey(
  raw_key: string, 
  supabase: SupabaseClient
): Promise<WhitelabelAPIKey | null> {
  const hash = hashAPIKey(raw_key);

  const { data, error } = await supabase
    .from("whitelabel_api_keys")
    .select("*")
    .eq("key_hash", hash)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  // Update last used
  await supabase
    .from("whitelabel_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data;
}
