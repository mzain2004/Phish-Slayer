import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const schema = z.record(z.string(), z.any());

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    feeds: [
      { name: "OTX AlienVault", status: "active", type: "subscribed" },
      { name: "MISP Circl.lu", status: "active", type: "public" },
      { name: "Abuse.ch URLhaus", status: "active", type: "public" },
    ],
    lastSync: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawBody = await req.json();
  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const body = parsed.data;

  // Placeholder for adding custom feeds
  return NextResponse.json({
    success: true,
    message: "Feed configured",
    feed: body,
  });
}
