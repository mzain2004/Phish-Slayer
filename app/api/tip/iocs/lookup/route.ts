import { NextRequest, NextResponse } from "next/server";
import { isKnownBad } from "@/lib/tip/iocStore";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const schema = z.object({ value: z.string() });

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const { value } = parsed.data;
    const ioc = await isKnownBad(value);

    // Live enrichment (placeholder - would call VirusTotal, OTX, etc. live)
    const enrichment = {
      vt_score: 0,
      otx_pulse_count: 0,
    };

    return NextResponse.json({
      value,
      isKnownBad: !!ioc,
      details: ioc,
      enrichment,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
