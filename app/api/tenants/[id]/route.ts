import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TenantManager } from "@/lib/tenant/manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  branding: z.any().optional()
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const supabase = await createClient();
    const manager = new TenantManager(supabase);
    const tenant = await manager.getTenant(id);
    const stats = await manager.getTenantStats(id);

    return NextResponse.json({ ...tenant, stats });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const supabase = await createClient();
    // Simplified: in real scenario check if user is 'owner'
    const { data: tenant, error } = await supabase
      .from("tenants")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
