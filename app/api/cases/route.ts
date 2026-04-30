import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { notifyExternalSystems } from "@/lib/connectors/index";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createCaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  organization_id: z.string().min(1, "Organization ID is required"),
  severity: z.enum(["p1", "p2", "p3", "p4"]).optional().default("p3"),
  status: z.enum(["OPEN", "IN_PROGRESS", "CONTAINED", "REMEDIATED", "CLOSED", "ARCHIVED"]).optional().default("OPEN"),
  alert_type: z.string().optional(),
  source_ip: z.string().optional(),
  affected_asset: z.string().optional(),
  mitre_tactic: z.string().optional(),
  mitre_technique: z.string().optional(),
  sla_deadline: z.string().optional(),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!orgId) return NextResponse.json({ error: "orgId is required" }, { status: 400 });

  const supabase = await createClerkSupabaseClient();
  
  let query = supabase
    .from("cases")
    .select("*")
    .eq("organization_id", orgId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const validatedData = createCaseSchema.parse(body);
    
    const supabase = await createClerkSupabaseClient();

    const { data, error } = await supabase
      .from("cases")
      .insert({
        ...validatedData,
        user_id: userId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Initial timeline entry
    await supabase.from('case_timeline').insert({
        case_id: data.id,
        org_id: validatedData.organization_id,
        event_type: 'alert_triggered',
        actor: 'System',
        description: `Case created automatically for ${data.alert_type}`
    });

    void notifyExternalSystems(data.id, data.title, data.severity, `New case created: ${data.title}`, supabase);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
