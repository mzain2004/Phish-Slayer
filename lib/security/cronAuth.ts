import { NextResponse } from "next/server";
import { safeCompare } from "@/lib/security/safeCompare";

export function verifyCronAuth(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const expectedAuthHeader = cronSecret ? `Bearer ${cronSecret}` : "";

  if (!cronSecret || !authHeader || !safeCompare(authHeader, expectedAuthHeader)) {
    return false;
  }
  return true;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
