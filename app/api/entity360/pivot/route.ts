import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  fromType: z.enum(['ip', 'domain', 'user', 'email', 'hash']),
  fromValue: z.string().min(1),
  toType: z.enum(['ip', 'domain', 'user', 'email', 'hash']),
  organizationId: z.string().uuid()
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { fromType, fromValue, toType, organizationId } = schema.parse(body);

    const supabase = await createClient();
    let results: any[] = [];

    if (fromType === 'ip' && toType === 'user') {
      const { data: alerts } = await supabase
        .from("alerts")
        .select("raw_log")
        .eq("org_id", organizationId)
        .eq("source_ip", fromValue);
      
      const users = new Set(alerts?.map(a => a.raw_log?.user).filter(Boolean));
      results = Array.from(users).map(u => ({ type: 'user', value: u }));
    } else if (fromType === 'user' && toType === 'ip') {
       const { data: alerts } = await supabase
        .from("alerts")
        .select("source_ip")
        .eq("org_id", organizationId)
        .eq("raw_log->>user", fromValue);
      
      const ips = new Set(alerts?.map(a => a.source_ip).filter(Boolean));
      results = Array.from(ips).map(ip => ({ type: 'ip', value: ip }));
    }

    return NextResponse.json({ from: fromValue, to: toType, results });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
