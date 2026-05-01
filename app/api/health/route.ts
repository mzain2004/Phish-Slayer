import { apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return apiSuccess({ status: "ok" });
}
