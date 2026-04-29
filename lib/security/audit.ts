import { createClient } from "@/lib/supabase/server";
import { redactSensitive } from "@/lib/security/redact";

export async function logAuditEvent(
  userId: string,
  orgId: string,
  action: string,
  resource?: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
) {
  try {
    const supabase = await createClient();
    const safeDetails = redactSensitive(details || undefined) || null;
    await supabase.from("audit_logs").insert({
      user_id: userId,
      organization_id: orgId,
      action,
      resource,
      details: safeDetails,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error("[Audit] Failed to log event:", err);
  }
}
