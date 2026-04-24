import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { TenantManager } from "@/lib/tenant/manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const supabase = await createClient();
    
    // Authorization check
    const { data: membership } = await supabase
      .from("tenant_users")
      .select("id")
      .eq("tenant_id", id)
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const manager = new TenantManager(supabase);
    const stats = await manager.getTenantStats(id);

    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
