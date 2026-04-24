import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TenantManager } from "@/lib/tenant/manager";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createSchema = z.object({
  name: z.string().min(2),
  plan: z.enum(["starter", "professional", "enterprise"]).optional().default("starter")
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = await createClient();
    const manager = new TenantManager(supabase);
    const tenants = await manager.getUserTenants(userId);
    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, plan } = createSchema.parse(body);

    const supabase = await createClient();
    const manager = new TenantManager(supabase);
    const tenant = await manager.createTenant(name, userId, plan as any);

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
