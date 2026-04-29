import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  // Get organization for the user
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "No organization found" }, { status: 404 });

  const { data: alerts, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("org_id", membership.organization_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Add computed field: triage_age_seconds: seconds since created_at if not acknowledged
  const now = new Date();
  const enhancedAlerts = alerts.map(alert => ({
    ...alert,
    triage_age_seconds: alert.acknowledged_at 
      ? null 
      : Math.floor((now.getTime() - new Date(alert.created_at).getTime()) / 1000)
  }));

  return NextResponse.json(enhancedAlerts);
}
