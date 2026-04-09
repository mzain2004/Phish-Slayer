import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RawIoc = {
  type: string;
  value: string;
  threat: string | null;
  source: "urlhaus" | "threatfox" | "openphish";
  tags: string[];
  malware: string | null;
  date: string | null;
  raw_data: unknown;
};

function getAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function isAuthorized(request: NextRequest): boolean {
  return (
    Boolean(process.env.CRON_SECRET) &&
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
  );
}

function ensureStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
}

async function fetchUrlhaus(): Promise<RawIoc[]> {
  const response = await fetch(
    "https://urlhaus-api.abuse.ch/v1/urls/recent/limit/25/",
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`URLhaus request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    urls?: Array<{
      url?: string;
      threat?: string;
      tags?: unknown;
      date_added?: string;
    }>;
  };

  const rows = payload.urls || [];

  return rows
    .filter((row) => typeof row.url === "string" && row.url.trim().length > 0)
    .map((row) => ({
      type: "url",
      value: row.url!.trim(),
      threat: typeof row.threat === "string" ? row.threat : null,
      source: "urlhaus",
      tags: ensureStringArray(row.tags),
      malware: null,
      date: typeof row.date_added === "string" ? row.date_added : null,
      raw_data: row,
    }));
}

async function fetchThreatFox(): Promise<RawIoc[]> {
  const response = await fetch("https://threatfox-api.abuse.ch/api/v1/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "get_iocs", days: 1 }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ThreatFox request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    data?: Array<{
      ioc_value?: string;
      ioc_type?: string;
      threat_type?: string;
      malware?: string;
      tags?: unknown;
      first_seen?: string;
      last_seen?: string;
    }>;
  };

  const rows = payload.data || [];

  return rows
    .filter(
      (row) =>
        typeof row.ioc_value === "string" && row.ioc_value.trim().length > 0,
    )
    .map((row) => ({
      type: typeof row.ioc_type === "string" ? row.ioc_type : "unknown",
      value: row.ioc_value!.trim(),
      threat: typeof row.threat_type === "string" ? row.threat_type : null,
      source: "threatfox",
      tags: ensureStringArray(row.tags),
      malware: typeof row.malware === "string" ? row.malware : null,
      date:
        typeof row.last_seen === "string"
          ? row.last_seen
          : typeof row.first_seen === "string"
            ? row.first_seen
            : null,
      raw_data: row,
    }));
}

async function fetchOpenPhish(): Promise<RawIoc[]> {
  const response = await fetch("https://openphish.com/feed.txt", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`OpenPhish request failed (${response.status})`);
  }

  const text = await response.text();
  const urls = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 25);

  return urls.map((url) => ({
    type: "url",
    value: url,
    threat: "phishing",
    source: "openphish",
    tags: ["phishing"],
    malware: null,
    date: null,
    raw_data: { url },
  }));
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const adminClient = getAdminClient();

  const settled = await Promise.allSettled([
    fetchUrlhaus(),
    fetchThreatFox(),
    fetchOpenPhish(),
  ]);

  const labels: Array<"urlhaus" | "threatfox" | "openphish"> = [
    "urlhaus",
    "threatfox",
    "openphish",
  ];

  const bySource = {
    urlhaus: 0,
    threatfox: 0,
    openphish: 0,
  };

  const allIocs: RawIoc[] = [];

  for (let i = 0; i < settled.length; i += 1) {
    const result = settled[i];
    const source = labels[i];

    if (result.status === "fulfilled") {
      const feedIocs = result.value;
      bySource[source] = feedIocs.length;
      allIocs.push(...feedIocs);

      await adminClient.from("audit_logs").insert({
        action: "L3_INTEL_INGESTED",
        severity: "low",
        metadata: {
          source,
          status: "success",
          fetched: feedIocs.length,
        },
      });
    } else {
      await adminClient.from("audit_logs").insert({
        action: "L3_INTEL_INGESTED",
        severity: "medium",
        metadata: {
          source,
          status: "failure",
          error: String(result.reason),
        },
      });
    }
  }

  const dedupedMap = new Map<string, RawIoc>();
  for (const ioc of allIocs) {
    const key = ioc.value.trim().toLowerCase();
    if (!key) {
      continue;
    }
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, ioc);
    }
  }

  const dedupedIocs = Array.from(dedupedMap.values());
  const upsertRows = dedupedIocs.map((ioc) => ({
    ioc_type: ioc.type,
    ioc_value: ioc.value,
    threat_type: ioc.threat,
    source: ioc.source,
    tags: ioc.tags,
    malware: ioc.malware,
    raw_data: ioc.raw_data,
    ingested_at: ioc.date ? ioc.date : new Date().toISOString(),
    hunted: false,
  }));

  let inserted = 0;

  if (upsertRows.length > 0) {
    const { data, error } = await adminClient
      .from("threat_intel")
      .upsert(upsertRows, { onConflict: "ioc_value" })
      .select("id");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to upsert threat intel: ${error.message}`,
        },
        { status: 500 },
      );
    }

    inserted = data?.length || 0;
  }

  return NextResponse.json({
    success: true,
    total_iocs: allIocs.length,
    by_source: bySource,
    inserted,
    deduplicated: dedupedIocs.length,
  });
}
