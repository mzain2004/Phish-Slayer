import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const L3HuntResponseSchema = z.object({
  success: z.boolean(),
  processed_hunts: z.number().int().nonnegative().optional(),
  findings_generated: z.number().int().nonnegative().optional(),
  findings_saved: z.number().int().nonnegative().optional(),
  escalated: z.number().int().nonnegative().optional(),
  signal_count: z.number().int().nonnegative().optional(),
  errors: z.array(z.string()).optional(),
  error: z.string().optional(),
});

function isAuthorized(request: NextRequest): boolean {
  return (
    Boolean(process.env.CRON_SECRET) &&
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const response = await fetch(`${request.nextUrl.origin}/api/agent/hunt`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  const payload = await response.json();
  const parsed = L3HuntResponseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid L3 hunt response payload",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed.data, { status: response.status });
}
