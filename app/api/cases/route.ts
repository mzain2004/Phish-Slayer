import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { notifyExternalSystems } from "@/lib/connectors/index";
import { getCases } from "@/lib/db";
import { connectMongo } from "@/lib/mongodb";

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
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClerkSupabaseClient();
  
  // Look up ALL tenants the user belongs to
  // tenant_id is UUID; cases.organization_id is TEXT — cast to string for the .in() filter
  const { data: memberships, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);

  if (memberError) {
    console.error("[cases] GET: member lookup error:", memberError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Cast UUID → string so the .in() matches cases.organization_id (TEXT column)
  const orgIds = (memberships ?? []).map((m) => String(m.organization_id));

  if (orgIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .in("organization_id", orgIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[cases] GET: query error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Also fetch from MongoDB if available
  let mongoCases: any[] = [];
  if (orgIds.length > 0) {
    try {
      await connectMongo();
      const CaseModel = await getCases();
      if (CaseModel) {
        mongoCases = await CaseModel.find({ 
          org_id: { $in: orgIds } 
        }).sort({ created_at: -1 }).lean();
      }
    } catch (mongoError) {
      console.warn("[cases] GET: MongoDB fetch failed:", mongoError);
    }
  }

  // Merge results (Supabase takes precedence, MongoDB is additive)
  const combined = [...data, ...mongoCases.map(m => ({ ...m, _id: m._id?.toString() }))];
  
  return NextResponse.json(combined);
}

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
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
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("organization_id", validatedData.organization_id)
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
      console.error("[cases] POST: insert error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Also write to MongoDB if available
    try {
      await connectMongo();
      const CaseModel = await getCases();
      if (CaseModel) {
        await CaseModel.create({
          org_id: validatedData.organization_id,
          title: validatedData.title,
          severity: validatedData.severity.replace('p', 'p') as any,
          status: validatedData.status || 'open',
          description: '',
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    } catch (mongoError) {
      console.warn("[cases] POST: MongoDB write failed:", mongoError);
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
