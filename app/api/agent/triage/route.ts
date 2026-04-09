import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DecisionSchema = z.object({
  decision: z.enum(["CLOSE", "ESCALATE"]),
  confidence: z.number().min(0).max(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  reasoning: z.string().min(1),
  recommended_action: z.enum([
    "CLOSE",
    "ISOLATE_IDENTITY",
    "BLOCK_IP",
    "MANUAL_REVIEW",
  ]),
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

type ScanRecord = {
  source: "scans";
  id: string;
  target: string | null;
  status: string | null;
  risk_score: number | null;
  verdict: string | null;
  threat_category: string | null;
  total_engines: number | null;
  malicious_count: number | null;
  ai_summary: string | null;
  ai_heuristic: unknown;
  payload: unknown;
  user_id: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type AlertRecord = {
  source: "wazuh";
  id: string;
  status: string | null;
  rule_level: number | null;
  rule_id: string | null;
  rule_description: string | null;
  rule_groups: string[] | null;
  agent_id: string | null;
  agent_name: string | null;
  agent_ip: string | null;
  src_ip: string | null;
  dest_ip: string | null;
  process_name: string | null;
  process_id: string | null;
  file_path: string | null;
  file_hash_sha256: string | null;
  mitre_technique_id: string | null;
  mitre_tactic: string | null;
  full_payload: unknown;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

type QueueRecord = ScanRecord | AlertRecord;

type Decision = z.infer<typeof DecisionSchema>;

const SYSTEM_PROMPT = `You are an autonomous Tier 1 SOC analyst for Phish-Slayer,
a cybersecurity platform. Your job is to triage phishing and
malware alerts. You will receive a JSON object with a source field.
Analyze it and respond ONLY with a valid JSON object in this exact format:
{
  'decision': 'CLOSE' or 'ESCALATE',
  'confidence': float between 0.0 and 1.0,
  'severity': 'low' or 'medium' or 'high' or 'critical',
  'reasoning': 'one sentence max',
  'recommended_action': 'CLOSE' or 'ISOLATE_IDENTITY' or 'BLOCK_IP' or 'MANUAL_REVIEW'
}
Rules:
- If source is 'wazuh':
  - ESCALATE when rule_level >= 12
  - ESCALATE if rule_description or rule_groups indicate credential theft, malware, ransomware, C2, privilege escalation, lateral movement, suspicious PowerShell, or persistence
  - CLOSE if rule_level <= 8 and indicators are benign/expected
- If source is 'scans':
  - ESCALATE if risk_score >= 70 OR malicious_count >= 3
  - ESCALATE if verdict is 'malicious' or 'phishing'
  - CLOSE if risk_score < 30 AND malicious_count <= 1
- If uncertain, always ESCALATE. Never CLOSE a borderline case.
- Respond with raw JSON only. No markdown. No explanation.`;

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

async function fetchUnreviewedScans(
  adminClient: ReturnType<typeof getAdminClient>,
): Promise<{ data: ScanRecord[] | null; error: { message: string } | null }> {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const result = await adminClient
    .from("scans")
    .select(
      "id, target, status, risk_score, verdict, threat_category, total_engines, malicious_count, ai_summary, ai_heuristic, payload, user_id, created_at, reviewed_by, reviewed_at",
    )
    .in("status", ["pending", "unreviewed"])
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(20);

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ? { message: result.error.message } : null,
    };
  }

  return {
    data: result.data.map((scan) => ({
      ...scan,
      source: "scans" as const,
    })),
    error: null,
  };
}

async function fetchPendingWazuhAlerts(
  adminClient: ReturnType<typeof getAdminClient>,
): Promise<{ data: AlertRecord[] | null; error: { message: string } | null }> {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const result = await adminClient
    .from("alerts")
    .select(
      "id, status, source, rule_level, rule_id, rule_description, rule_groups, agent_id, agent_name, agent_ip, src_ip, dest_ip, process_name, process_id, file_path, file_hash_sha256, mitre_technique_id, mitre_tactic, full_payload, created_at, reviewed_by, reviewed_at",
    )
    .eq("status", "pending")
    .eq("source", "wazuh")
    .gte("created_at", sinceIso)
    .order("rule_level", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(20);

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error ? { message: result.error.message } : null,
    };
  }

  return {
    data: result.data.map((alert) => ({
      ...alert,
      source: "wazuh" as const,
    })),
    error: null,
  };
}

async function runGeminiTriage(record: QueueRecord): Promise<Decision> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: JSON.stringify(record) }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini call failed (${response.status}): ${errorText}`);
  }

  const rawResponse = await response.json();
  const parsedGemini = GeminiApiResponseSchema.safeParse(rawResponse);
  if (!parsedGemini.success) {
    throw new Error("Gemini response shape validation failed");
  }

  const modelText =
    parsedGemini.data.candidates?.[0]?.content.parts
      .map((part) => part.text || "")
      .join("")
      .trim() || "";

  try {
    const decisionJson = JSON.parse(modelText);
    const parsedDecision = DecisionSchema.safeParse(decisionJson);
    if (!parsedDecision.success) {
      throw new Error("Decision schema validation failed");
    }

    return parsedDecision.data;
  } catch {
    return {
      decision: "ESCALATE",
      confidence: 0,
      severity: "high",
      reasoning:
        "Model response could not be parsed as valid JSON, escalating by policy.",
      recommended_action: "MANUAL_REVIEW",
    };
  }
}

async function escalateScan(
  record: QueueRecord,
  decision: Decision,
  baseUrl: string,
) {
  const title =
    record.source === "wazuh"
      ? `L1 Agent Escalation: ${record.rule_description || record.rule_id || record.id}`
      : `L1 Agent Escalation: ${record.target || record.id}`;

  const affectedIp =
    record.source === "wazuh"
      ? record.src_ip || record.dest_ip || record.agent_ip || null
      : null;

  const affectedUserId = record.source === "scans" ? record.user_id || undefined : undefined;

  const response = await fetch(`${baseUrl}/api/actions/escalate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      AGENT_SECRET: process.env.AGENT_SECRET || "",
    },
    body: JSON.stringify({
      alertId: record.id,
      severity: decision.severity,
      title,
      description: decision.reasoning,
      affectedUserId,
      affectedIp,
      recommendedAction: decision.recommended_action,
      telemetrySnapshot: record,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Escalation endpoint failed (${response.status}): ${details}`,
    );
  }
}

async function processBatch(request: NextRequest) {
  const adminClient = getAdminClient();
  const { data: scans, error: scansError } =
    await fetchUnreviewedScans(adminClient);
  const { data: alerts, error: alertsError } =
    await fetchPendingWazuhAlerts(adminClient);

  if (scansError || alertsError) {
    return NextResponse.json(
      {
        success: false,
        error: scansError?.message || alertsError?.message || "Failed to fetch queue",
      },
      { status: 500 },
    );
  }

  let processed = 0;
  let closed = 0;
  let escalated = 0;
  let errors = 0;

  const results: Array<{
    item_id: string;
    source: QueueRecord["source"];
    decision: Decision["decision"];
    confidence: number;
    severity: Decision["severity"];
    reasoning: string;
  }> = [];

  const baseUrl = request.nextUrl.origin;
  const queue: QueueRecord[] = [...(alerts || []), ...(scans || [])];

  for (const item of queue) {
    try {
      const decision = await runGeminiTriage(item);
      const reviewedAt = new Date().toISOString();

      if (decision.decision === "CLOSE") {
        const updateQuery =
          item.source === "wazuh"
            ? adminClient
                .from("alerts")
                .update({
                  status: "auto_closed",
                  reviewed_by: "l1_agent",
                  reviewed_at: reviewedAt,
                })
                .eq("id", item.id)
            : adminClient
                .from("scans")
                .update({
                  status: "auto_closed",
                  reviewed_by: "l1_agent",
                  reviewed_at: reviewedAt,
                })
                .eq("id", item.id);

        const { error: updateError } = await updateQuery;

        if (updateError) {
          throw new Error(
            `Failed to auto-close ${item.source} record ${item.id}: ${updateError.message}`,
          );
        }

        const { error: auditError } = await adminClient
          .from("audit_logs")
          .insert({
            action: "L1_AUTO_CLOSED",
            severity: decision.severity,
            metadata: {
              source: item.source,
              record_id: item.id,
              reasoning: decision.reasoning,
              confidence: decision.confidence,
            },
            reviewed_by: "l1_agent",
            created_at: reviewedAt,
          });

        if (auditError) {
          throw new Error(
            `Failed to write auto-close audit log for ${item.source} record ${item.id}: ${auditError.message}`,
          );
        }

        closed += 1;
      } else {
        await escalateScan(item, decision, baseUrl);

        const updateQuery =
          item.source === "wazuh"
            ? adminClient
                .from("alerts")
                .update({
                  status: "escalated",
                  reviewed_by: "l1_agent",
                  reviewed_at: reviewedAt,
                })
                .eq("id", item.id)
            : adminClient
                .from("scans")
                .update({
                  status: "escalated",
                  reviewed_by: "l1_agent",
                  reviewed_at: reviewedAt,
                })
                .eq("id", item.id);

        const { error: updateError } = await updateQuery;

        if (updateError) {
          throw new Error(
            `Failed to mark ${item.source} record ${item.id} escalated: ${updateError.message}`,
          );
        }

        escalated += 1;
      }

      processed += 1;
      results.push({
        item_id: item.id,
        source: item.source,
        decision: decision.decision,
        confidence: decision.confidence,
        severity: decision.severity,
        reasoning: decision.reasoning,
      });
    } catch (error) {
      errors += 1;
      console.error("[L1 triage] Failed to process record", {
        source: item.source,
        record_id: item.id,
        error,
      });
    }
  }

  return NextResponse.json({
    success: true,
    processed,
    closed,
    escalated,
    errors,
    results,
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
