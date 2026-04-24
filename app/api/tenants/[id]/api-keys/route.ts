import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAPIKey } from "@/lib/tenant/api-keys";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const keySchema = z.object({
  label: z.string().min(1),
  permissions: z.array(z.string()).optional().default(["read"])
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
      .from("whitelabel_api_keys")
      .select("id, label, permissions, active, created_at, last_used_at")
      .eq("tenant_id", id);

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
    const { label, permissions } = keySchema.parse(body);

    const supabase = await createClient();
    // Real scenario: check if user is 'owner'
    const result = await createAPIKey(id, label, permissions, supabase);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
