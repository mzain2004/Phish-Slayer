import { createClient } from "@/lib/supabase/server";

export async function logAuditEvent(
  userId: string,
  action: string,
  resource?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      resource,
      details,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error("[Audit] Failed to log event:", err);
  }
}
