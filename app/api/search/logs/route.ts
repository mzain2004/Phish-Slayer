import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing organization context" }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  if (!q || !start || !end) {
    return NextResponse.json({ error: "Missing required query parameters: q, start, end" }, { status: 400 });
  }

  const startMs = Date.now();
  const supabase = await createClient();

  // Basic query building
  let query = supabase.from("udm_events")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .gte("timestamp_utc", start)
    .lte("timestamp_utc", end)
    .order("timestamp_utc", { ascending: false })
    .limit(limit);

  // Advanced search handling
  const isIP = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(q);
  const isHash = /^[a-fA-F0-9]{64}$/.test(q);

  if (isIP) {
    query = query.or(`src_ip.eq.${q},dst_ip.eq.${q},host_ip.eq.${q}`);
  } else if (isHash) {
    query = query.or(`file_hash_sha256.eq.${q},process_hash_sha256.eq.${q}`);
  } else {
    // Text search fallback
    query = query.or(`raw_log.ilike.%${q}%,host_name.ilike.%${q}%,user_name.ilike.%${q}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Very simplified checking for archive fallback
  const isArchiveRange = new Date(start).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (isArchiveRange && data?.length === 0) {
    // Implement archive searching here
  }

  const searchTimeMs = Date.now() - startMs;

  return NextResponse.json({
    events: data,
    total_count: count,
    search_time_ms: searchTimeMs
  });
}
