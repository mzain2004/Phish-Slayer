import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { resolveExternalSystems } from "@/lib/connectors/index";
import { getCases } from "@/lib/db";
import { connectMongo } from "@/lib/mongodb";
import { Types } from "mongoose";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateCaseSchema = z.object({
  title: z.string().min(1).optional(),
  severity: z.enum(["p1", "p2", "p3", "p4"]).optional(),
  status: z.enum(["open", "investigating", "contained", "closed"]).optional(),
  alert_type: z.string().optional(),
  source_ip: z.string().optional(),
  affected_asset: z.string().optional(),
  mitre_tactic: z.string().optional(),
  mitre_technique: z.string().optional(),
  sla_deadline: z.string().optional(),
  closed_at: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClerkSupabaseClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  // Also try to fetch from MongoDB
  let mongoCase: any = null;
  try {
    await connectMongo();
    const CaseModel = await getCases();
    if (CaseModel && Types.ObjectId.isValid(id)) {
      mongoCase = await CaseModel.findOne({ _id: new Types.ObjectId(id), org_id: orgId }).lean();
    }
  } catch (mongoError) {
    console.warn("[cases/[id]] GET: MongoDB fetch failed:", mongoError);
  }

  // Merge Supabase with MongoDB data
  const result = mongoCase 
    ? { ...data, ...mongoCase, _id: mongoCase._id?.toString() }
    : data;
  
  return NextResponse.json(result);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validatedData = updateCaseSchema.parse(body);
    
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from("cases")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Resolve External Systems if case closed/contained
    if (data.status === "closed" || data.status === "contained") {
        void resolveExternalSystems(id, supabase);
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
