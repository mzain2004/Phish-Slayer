import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FindingSchema = z.object({
  hunt_type: z.enum([
    "campaign_cluster",
    "identity_takeover_pattern",
    "escalation_burst",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
  indicators: z.record(z.string(), z.unknown()).default({}),
  source_records: z.array(z.string()).default([]),
});

const GeminiApiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(
            z.object({
              text: z.string().optional(),
            }),
          ),
        }),
      }),
    )
    .optional(),
});

const HuntSignalSchema = z.object({
  hunt_type: z.enum([
    "campaign_cluster",
    "identity_takeover_pattern",
    "escalation_burst",
  ]),
  summary: z.string(),
  telemetry: z.record(z.string(), z.unknown()),
  source_records: z.array(z.string()).default([]),
});

type HuntSignal = z.infer<typeof HuntSignalSchema>;
type HuntFinding = z.infer<typeof FindingSchema>;

type ScanRow = {
  id: string;
  target: string | null;
  risk_score: number | null;
  verdict: string | null;
  malicious_count: number | null;
  threat_category: string | null;
  created_at: string;
};

type EscalationRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  affected_ip: string | null;
  affected_user_id: string | null;
  created_at: string;
};

function getAdminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function getAuthHeaderValue(request: NextRequest): string {
  return request.headers.get("authorization") || "";
}

function isCronAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  return getAuthHeaderValue(request) === `Bearer ${cronSecret}`;
}

async function hasPrivilegedRole(): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return false;
  }

  return ["admin", "manager", "super_admin"].includes(profile.role);
}

async function runCampaignClusterHunt(
  adminClient: ReturnType<typeof getAdminClient>,
  sinceIso: string,
): Promise<HuntSignal> {
  const { data, error } = await adminClient
    .from("scans")
    .select(
      "id, target, risk_score, verdict, malicious_count, threat_category, created_at",
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(`Campaign cluster hunt failed: ${error.message}`);
  }

  const scans = (data || []) as ScanRow[];
  const byTarget = new Map<string, number>();
  const sourceRecords: string[] = [];
  let suspiciousCount = 0;

  for (const scan of scans) {
    const targetKey = (scan.target || "unknown").toLowerCase();
    byTarget.set(targetKey, (byTarget.get(targetKey) || 0) + 1);

    const riskScore = scan.risk_score || 0;
    const maliciousCount = scan.malicious_count || 0;
    const verdict = (scan.verdict || "").toLowerCase();

    if (
      riskScore >= 70 ||
      maliciousCount >= 3 ||
      verdict === "malicious" ||
      verdict === "phishing"
    ) {
      suspiciousCount += 1;
      sourceRecords.push(scan.id);
    }
  }

  const repeatedTargets = Array.from(byTarget.entries())
    .filter((entry) => entry[1] >= 3)
    .slice(0, 8)
    .map(([target, count]) => ({ target, count }));

  return {
    hunt_type: "campaign_cluster",
    summary: `Evaluated ${scans.length} recent scans and found ${suspiciousCount} suspicious items with ${repeatedTargets.length} repeated targets`,
    telemetry: {
      scans_considered: scans.length,
      suspicious_count: suspiciousCount,
      repeated_targets: repeatedTargets,
    },
    source_records: sourceRecords.slice(0, 50),
  };
}

async function runIdentityTakeoverPatternHunt(
  adminClient: ReturnType<typeof getAdminClient>,
  sinceIso: string,
): Promise<HuntSignal> {
  const { data, error } = await adminClient
    .from("escalations")
    .select(
      "id, title, severity, status, affected_user_id, affected_ip, created_at",
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(150);

  if (error) {
    throw new Error(`Identity takeover hunt failed: ${error.message}`);
  }

  const escalations = (data || []) as EscalationRow[];
  const affectedUserFrequency = new Map<string, number>();
  const ipFrequency = new Map<string, number>();

  for (const row of escalations) {
    if (row.affected_user_id) {
      affectedUserFrequency.set(
        row.affected_user_id,
        (affectedUserFrequency.get(row.affected_user_id) || 0) + 1,
      );
    }
    if (row.affected_ip) {
      ipFrequency.set(
        row.affected_ip,
        (ipFrequency.get(row.affected_ip) || 0) + 1,
      );
    }
  }

  const repeatedUsers = Array.from(affectedUserFrequency.entries())
    .filter((entry) => entry[1] >= 2)
    .slice(0, 10)
    .map(([userId, count]) => ({ user_id: userId, count }));

  const repeatedIps = Array.from(ipFrequency.entries())
    .filter((entry) => entry[1] >= 3)
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  return {
    hunt_type: "identity_takeover_pattern",
    summary: `Analyzed ${escalations.length} escalations, detected ${repeatedUsers.length} repeated users and ${repeatedIps.length} repeated IPs`,
    telemetry: {
      escalations_considered: escalations.length,
      repeated_users: repeatedUsers,
      repeated_ips: repeatedIps,
    },
    source_records: escalations.map((row) => row.id).slice(0, 60),
  };
}

async function runEscalationBurstHunt(
  adminClient: ReturnType<typeof getAdminClient>,
  sinceIso: string,
): Promise<HuntSignal> {
  const { data, error } = await adminClient
    .from("escalations")
    .select(
      "id, title, severity, status, affected_ip, affected_user_id, created_at",
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`Escalation burst hunt failed: ${error.message}`);
  }

  const rows = (data || []) as EscalationRow[];
  const highSeverity = rows.filter((row) =>
    ["high", "critical"].includes((row.severity || "").toLowerCase()),
  );

  const pending = rows.filter((row) =>
    ["pending", "l2_pending_approval"].includes(
      (row.status || "").toLowerCase(),
    ),
  );

  return {
    hunt_type: "escalation_burst",
    summary: `Observed ${rows.length} total escalations, ${highSeverity.length} high/critical, ${pending.length} still pending`,
    telemetry: {
      total_escalations: rows.length,
      high_or_critical: highSeverity.length,
      pending_or_hitl: pending.length,
    },
    source_records: rows.map((row) => row.id).slice(0, 80),
  };
}

function stripMarkdownCodeFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```") || !trimmed.endsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function buildFallbackFindings(signals: HuntSignal[]): HuntFinding[] {
  const findings: HuntFinding[] = [];

  for (const signal of signals) {
    if (signal.hunt_type === "campaign_cluster") {
      const suspiciousCount =
        typeof signal.telemetry.suspicious_count === "number"
          ? signal.telemetry.suspicious_count
          : 0;
      const repeatedTargets = Array.isArray(signal.telemetry.repeated_targets)
        ? signal.telemetry.repeated_targets.length
        : 0;

      if (suspiciousCount >= 5 || repeatedTargets >= 2) {
        findings.push({
          hunt_type: signal.hunt_type,
          title: "Potential phishing campaign cluster detected",
          description: signal.summary,
          severity: suspiciousCount >= 12 ? "critical" : "high",
          confidence: suspiciousCount >= 12 ? 0.88 : 0.74,
          indicators: signal.telemetry,
          source_records: signal.source_records,
        });
      }
    }

    if (signal.hunt_type === "identity_takeover_pattern") {
      const repeatedUsers = Array.isArray(signal.telemetry.repeated_users)
        ? signal.telemetry.repeated_users.length
        : 0;
      const repeatedIps = Array.isArray(signal.telemetry.repeated_ips)
        ? signal.telemetry.repeated_ips.length
        : 0;

      if (repeatedUsers > 0 || repeatedIps > 0) {
        findings.push({
          hunt_type: signal.hunt_type,
          title: "Identity takeover pattern surfaced",
          description: signal.summary,
          severity: repeatedUsers >= 2 || repeatedIps >= 2 ? "high" : "medium",
          confidence: repeatedUsers >= 2 || repeatedIps >= 2 ? 0.8 : 0.62,
          indicators: signal.telemetry,
          source_records: signal.source_records,
        });
      }
    }

    if (signal.hunt_type === "escalation_burst") {
      const highOrCritical =
        typeof signal.telemetry.high_or_critical === "number"
          ? signal.telemetry.high_or_critical
          : 0;
      const pendingCount =
        typeof signal.telemetry.pending_or_hitl === "number"
          ? signal.telemetry.pending_or_hitl
          : 0;

      if (highOrCritical >= 4 || pendingCount >= 6) {
        findings.push({
          hunt_type: signal.hunt_type,
          title: "Escalation burst requires immediate review",
          description: signal.summary,
          severity: highOrCritical >= 8 ? "critical" : "high",
          confidence: highOrCritical >= 8 ? 0.9 : 0.73,
          indicators: signal.telemetry,
          source_records: signal.source_records,
        });
      }
    }
  }

  return findings;
}

async function runGeminiHuntAnalysis(
  signals: HuntSignal[],
): Promise<HuntFinding[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackFindings(signals);
  }

  const prompt = `You are an autonomous Tier 3 Threat Hunter for a SOC.
Input contains three hunt signal objects. Analyze and return only a JSON array.
Each item MUST match this schema:
{
  "hunt_type": "campaign_cluster" | "identity_takeover_pattern" | "escalation_burst",
  "title": string,
  "description": string,
  "severity": "low" | "medium" | "high" | "critical",
  "confidence": number between 0 and 1,
  "indicators": object,
  "source_records": string[]
}
Rules:
- Return an empty array if no meaningful findings.
- Use confidence >= 0.70 only for findings that should be escalated.
- Output raw JSON only.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: prompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(signals) }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini hunt call failed (${response.status}): ${details}`);
  }

  const rawResponse = await response.json();
  const parsedGemini = GeminiApiResponseSchema.safeParse(rawResponse);
  if (!parsedGemini.success) {
    throw new Error("Gemini hunt response shape validation failed");
  }

  const text =
    parsedGemini.data.candidates?.[0]?.content.parts
      .map((part) => part.text || "")
      .join("")
      .trim() || "[]";

  const cleaned = stripMarkdownCodeFence(text);
  let parsedArray: unknown;

  try {
    parsedArray = JSON.parse(cleaned);
  } catch {
    return buildFallbackFindings(signals);
  }

  const parsedFindings = z.array(FindingSchema).safeParse(parsedArray);
  if (!parsedFindings.success) {
    return buildFallbackFindings(signals);
  }

  return parsedFindings.data;
}

async function createEscalationForFinding(
  finding: HuntFinding,
  baseUrl: string,
): Promise<string | null> {
  const agentSecret = process.env.AGENT_SECRET || "";
  if (!agentSecret) {
    return null;
  }

  const response = await fetch(`${baseUrl}/api/actions/escalate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AGENT_SECRET: agentSecret,
    },
    body: JSON.stringify({
      alertId: `hunt-${finding.hunt_type}-${Date.now()}`,
      severity: finding.severity,
      title: `L3 Hunt: ${finding.title}`,
      description: finding.description,
      recommendedAction: "MANUAL_REVIEW",
      telemetrySnapshot: {
        hunt_type: finding.hunt_type,
        confidence: finding.confidence,
        indicators: finding.indicators,
        source_records: finding.source_records,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { escalation_id?: string };
  return payload.escalation_id || null;
}

async function processBatch(request: NextRequest) {
  const adminClient = getAdminClient();
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const hunts = await Promise.allSettled([
    runCampaignClusterHunt(adminClient, sinceIso),
    runIdentityTakeoverPatternHunt(adminClient, sinceIso),
    runEscalationBurstHunt(adminClient, sinceIso),
  ]);

  const huntErrors = hunts
    .filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
    .map((result) => String(result.reason));

  const signals = hunts
    .filter(
      (result): result is PromiseFulfilledResult<HuntSignal> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);

  if (signals.length === 0) {
    return NextResponse.json(
      {
        success: false,
        processed_hunts: 3,
        findings_saved: 0,
        escalated: 0,
        errors: huntErrors,
      },
      { status: 500 },
    );
  }

  let findings: HuntFinding[] = [];
  try {
    findings = await runGeminiHuntAnalysis(signals);
  } catch (error) {
    console.error("[L3 hunt] Gemini analysis failed, using fallback", error);
    findings = buildFallbackFindings(signals);
  }

  let escalated = 0;
  let findingsSaved = 0;
  const baseUrl = request.nextUrl.origin;

  for (const finding of findings) {
    const escalatable = finding.confidence >= 0.7;
    const escalationId = escalatable
      ? await createEscalationForFinding(finding, baseUrl)
      : null;

    if (escalationId) {
      escalated += 1;
    }

    const { error } = await adminClient.from("hunt_findings").insert({
      hunt_type: finding.hunt_type,
      severity: finding.severity,
      confidence: finding.confidence,
      title: finding.title,
      description: finding.description,
      indicators: finding.indicators,
      source_records: finding.source_records,
      escalated: Boolean(escalationId),
      escalation_id: escalationId,
      created_by: "l3_agent",
      created_at: new Date().toISOString(),
    });

    if (error) {
      huntErrors.push(`Failed to save finding: ${error.message}`);
      continue;
    }

    findingsSaved += 1;
  }

  return NextResponse.json({
    success: true,
    processed_hunts: 3,
    findings_generated: findings.length,
    findings_saved: findingsSaved,
    escalated,
    signal_count: signals.length,
    errors: huntErrors,
  });
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return processBatch(request);
}

export async function POST(request: NextRequest) {
  const authorized = await hasPrivilegedRole();
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: "Forbidden: insufficient privileges" },
      { status: 403 },
    );
  }

  return processBatch(request);
}
