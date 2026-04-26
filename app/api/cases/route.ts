import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { notifyExternalSystems } from "@/lib/connectors/index";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  organization_id: z.string().optional(),
  severity: z.enum(["p1", "p2", "p3", "p4"]).optional().default("p3"),
  status: z.enum(["open", "investigating", "contained", "closed"]).optional().default("open"),
  alert_type: z.string().optional(),
  source_ip: z.string().optional(),
  affected_asset: z.string().optional(),
  mitre_tactic: z.string().optional(),
  mitre_technique: z.string().optional(),
  sla_deadline: z.string().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClerkSupabaseClient();
  
  // Look up ALL tenants the user belongs to
  // tenant_id is UUID; cases.organization_id is TEXT — cast to string for the .in() filter
  const { data: memberships, error: memberError } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", userId);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Cast UUID → string so the .in() matches cases.organization_id (TEXT column)
  const orgIds = (memberships ?? []).map((m) => String(m.tenant_id));

  if (orgIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = createCaseSchema.parse(body);
    
    const supabase = await createClerkSupabaseClient();

    // Verify tenant membership before allowing case creation
    // tenant_users.tenant_id is UUID; validatedData.organization_id is TEXT string
    if (validatedData.organization_id) {
      const { data: membership, error: memberError } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", userId)
        .eq("tenant_id", validatedData.organization_id)
        .maybeSingle();

      if (memberError || !membership) {
        return NextResponse.json({ error: "Not authorized for this organization" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from("cases")
      .insert({
        ...validatedData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify External Systems
    void notifyExternalSystems(
        data.id, 
        data.title, 
        data.severity, 
        `Auto-created case for ${data.alert_type} on asset ${data.affected_asset || 'unknown'}`, 
        supabase
    );

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
