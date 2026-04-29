import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const supabase = await createClient();
    
    const [{ data: investigation }, { data: results }, { data: reports }] = await Promise.all([
      supabase.from("osint_investigations").select("*").eq("id", id).single(),
      supabase.from("osint_results").select("*").eq("investigation_id", id),
      supabase.from("osint_reports").select("*").eq("investigation_id", id).single()
    ]);

    return NextResponse.json({ investigation, results, report: reports });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
