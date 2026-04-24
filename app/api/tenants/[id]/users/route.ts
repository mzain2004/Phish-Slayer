import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TenantManager } from "@/lib/tenant/manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const userSchema = z.object({
  user_id: z.string().min(1),
  role: z.enum(["owner", "analyst", "manager", "readonly"])
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
    const { data } = await supabase
      .from("tenant_users")
      .select("*")
      .eq("tenant_id", id)
      .eq("active", true);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { user_id, role } = userSchema.parse(body);

    const supabase = await createClient();
    const manager = new TenantManager(supabase);
    // Real scenario: check if calling user is owner/manager
    const user = await manager.addUser(id, user_id, role);

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("user_id");
    if (!targetUserId) throw new Error("Missing user_id");

    const supabase = await createClient();
    const manager = new TenantManager(supabase);
    await manager.removeUser(id, targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
