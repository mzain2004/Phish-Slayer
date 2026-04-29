import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({ 
  title: z.string(), 
  organization_id: z.string().optional(), 
  incident_id: z.string().optional(), 
  timeline: z.string().optional(), 
  root_cause: z.string().optional(), 
  impact: z.string().optional(), 
  response_actions: z.string().optional(), 
  lessons_learned: z.string().optional() 
}).passthrough();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId") || orgId;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_incident_reviews")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawBody = await req.json();
    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const body = parsed.data;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("post_incident_reviews")
      .insert({ ...body, created_by: userId })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
