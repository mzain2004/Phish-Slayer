import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createTimelineSchema = z.object({
  action: z.string().min(1, "Action is required"),
  actor: z.string().optional(),
  details: z.any().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClerkSupabaseClient();
  const { data, error } = await supabase
    .from("case_timeline")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validatedData = createTimelineSchema.parse(body);
    
    const supabase = await createClerkSupabaseClient();
    const { data, error } = await supabase
      .from("case_timeline")
      .insert({
        ...validatedData,
        case_id: id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
