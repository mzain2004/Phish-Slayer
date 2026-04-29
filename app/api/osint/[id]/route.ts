import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const supabase = await createClient();
    
    const [{ data: investigation }, { data: results }, { data: reports }] = await Promise.all([
      supabase.from("osint_investigations").select("*").eq("id", id).eq('organization_id', orgId).single(),
      supabase.from("osint_results").select("*").eq("investigation_id", id).eq('organization_id', orgId),
      supabase.from("osint_reports").select("*").eq("investigation_id", id).eq('organization_id', orgId).single()
    ]);

    return NextResponse.json({ investigation, results, report: reports });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
