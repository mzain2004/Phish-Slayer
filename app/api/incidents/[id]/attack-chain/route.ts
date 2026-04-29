import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { reconstructChain } from "@/lib/l2/attackChain";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const supabase = await createClient();
    const chain = await reconstructChain(supabase, id, orgId);

    return NextResponse.json(chain);
  } catch (error) {
    console.error("[api] Attack chain error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
