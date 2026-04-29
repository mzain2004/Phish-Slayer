import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getEntityProfile, EntityType } from "@/lib/l2/entity360";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  entityType: z.enum(['ip', 'domain', 'user', 'email', 'hash']),
  entityValue: z.string().min(1),
  organizationId: z.string().uuid()
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { entityType, entityValue, organizationId } = schema.parse(body);

    const supabase = await createClient();
    const profile = await getEntityProfile(supabase, entityType as EntityType, entityValue, organizationId);

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    console.error("[api] Entity360 error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
