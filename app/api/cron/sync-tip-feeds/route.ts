import { NextRequest, NextResponse } from "next/server";
import { syncAllFeeds } from "@/lib/tip/feedManager";
import { storeIOCs } from "@/lib/tip/iocStore";
import { verifyCronAuth, unauthorizedResponse } from "@/lib/security/cronAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return unauthorizedResponse();
  }

  try {
    const iocs = await syncAllFeeds();
    await storeIOCs(iocs);
    return NextResponse.json({ success: true, count: iocs.length });
  } catch (error) {
    console.error("TIP sync error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
