import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError, API_CODES } from "@/lib/api/response";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return apiError(API_CODES.UNAUTHORIZED, "Unauthorized", 401);

  const supabase = await createClient();

  // Get organization for the user
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) return apiError(API_CODES.NOT_FOUND, "No organization found", 404);

  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("org_id", membership.organization_id)
    .order("queue_priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return apiError(API_CODES.INTERNAL_ERROR, error.message, 500);

  // Add computed field: triage_age_seconds: seconds since created_at if not acknowledged
  const now = new Date();
  const enhancedAlerts = alerts.map(alert => ({
    ...alert,
    triage_age_seconds: alert.acknowledged_at 
      ? null 
      : Math.floor((now.getTime() - new Date(alert.created_at).getTime()) / 1000)
  }));

  return apiSuccess(enhancedAlerts);
}
