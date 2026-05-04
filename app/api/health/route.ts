import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PYTHON_API_URL = z
  .string()
  .url()
  .parse(process.env.PYTHON_API_URL ?? "http://localhost:8000");

export async function GET() {
  try {
    const upstreamResponse = await fetch(`${PYTHON_API_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: upstreamResponse.headers,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Python backend" },
      { status: 502 },
    );
  }
}
