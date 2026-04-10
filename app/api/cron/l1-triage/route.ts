import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TriageSummarySchema = z.object({
  success: z.boolean(),
  processed: z.number().int().nonnegative().optional(),
  closed: z.number().int().nonnegative().optional(),
  escalated: z.number().int().nonnegative().optional(),
  errors: z.number().int().nonnegative().optional(),
  results: z
    .array(
      z.object({
        scan_id: z.string(),
        decision: z.enum(["CLOSE", "ESCALATE"]),
        confidence: z.number(),
        severity: z.enum(["low", "medium", "high", "critical"]),
        reasoning: z.string(),
      }),
    )
    .optional(),
  error: z.string().optional(),
});

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("authorization") || "";
  return (
    Boolean(process.env.CRON_SECRET) &&
    auth === `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const response = await fetch(
    `${process.env.INTERNAL_API_URL}/api/agent/triage`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    },
  );

  const payload = await response.json();
  const parsed = TriageSummarySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid triage agent response",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed.data, { status: response.status });
}
