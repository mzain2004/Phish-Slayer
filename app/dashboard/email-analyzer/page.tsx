"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";

type HeaderParsed = {
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  suspiciousFlags: string[];
  riskScore: number;
  originatingIp?: string | null;
};

type UrlResult = {
  verdict: string;
  score: number;
  categories?: string[];
};

type EmailSandboxResponse = {
  headers: {
    parsed: HeaderParsed;
    ai: string | Record<string, unknown>;
  };
  urls: {
    results: Record<string, UrlResult>;
    verdict: string;
  };
  overallRisk: number;
  error?: string;
};

function scoreTone(score: number) {
  if (score >= 80) return "critical";
  if (score >= 60) return "warning";
  if (score >= 30) return "pending";
  return "healthy";
}

function authTone(value?: string | null) {
  if (!value) return "pending";
  const normalized = value.toLowerCase();
  if (normalized === "pass") return "healthy";
  if (normalized === "fail") return "critical";
  return "warning";
}

import { Suspense } from "react";

function EmailAnalyzerPageContent() {
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };
  const orgId = organization?.id || searchParams.get('orgId') || getCookie('ps_org_id');

  const [rawEmail, setRawEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [result, setResult] = useState<EmailSandboxResponse | null>(null);

  const urlEntries = useMemo(() => {
    return Object.entries(result?.urls?.results || {});
  }, [result]);

  const handleSubmit = async () => {
    if (!userId || !orgId || !rawEmail.trim()) return;

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch("/api/sandbox/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawEmail, organizationId: orgId }),
      });

      const payload = (await response.json()) as EmailSandboxResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Failed to analyze email");
      }

      setResult(payload);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const parsed = result?.headers?.parsed;

  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="dashboard-page-title flex items-center gap-2 text-white">
          <Mail className="h-6 w-6 text-[#7c6af7]" />
          Email Analyzer
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Detonate suspicious emails to extract header integrity, URL verdicts, and AI insights.
        </p>
      </div>

      <DashboardCard className="flex flex-col gap-4">
        <textarea
          value={rawEmail}
          onChange={(event) => setRawEmail(event.target.value)}
          placeholder="Paste raw email headers or full RFC822 message here..."
          className="min-h-[200px] w-full rounded-xl border border-[rgba(48,54,61,0.9)] bg-black/30 p-4 text-sm text-white"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={!orgLoaded || !userId || !orgId || !rawEmail.trim() || loading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c6af7] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Analyze Email
          </button>
          {!orgLoaded ? (
            <span className="text-xs text-slate-400">Loading organization...</span>
          ) : !orgId ? (
            <span className="text-xs text-slate-400">Select an organization first.</span>
          ) : null}
        </div>
      </DashboardCard>

      {errorText ? (
        <DashboardCard className="border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorText}
          </div>
        </DashboardCard>
      ) : null}

      {result ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DashboardCard className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Risk Snapshot</h2>
              <StatusBadge status={scoreTone(result.overallRisk)} label={`risk ${result.overallRisk}`} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs text-slate-400">SPF</p>
                <StatusBadge status={authTone(parsed?.spf)} label={parsed?.spf || "unknown"} />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs text-slate-400">DKIM</p>
                <StatusBadge status={authTone(parsed?.dkim)} label={parsed?.dkim || "unknown"} />
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs text-slate-400">DMARC</p>
                <StatusBadge status={authTone(parsed?.dmarc)} label={parsed?.dmarc || "unknown"} />
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Suspicious Flags</p>
              {parsed?.suspiciousFlags?.length ? (
                <ul className="mt-2 space-y-1 text-sm text-white/80">
                  {parsed.suspiciousFlags.map((flag) => (
                    <li key={flag}>• {flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-white/60">No suspicious flags detected.</p>
              )}
            </div>
          </DashboardCard>

          <DashboardCard className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white">Groq AI Analysis</h2>
            <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-200">
              {typeof result.headers.ai === "string"
                ? result.headers.ai
                : JSON.stringify(result.headers.ai, null, 2)}
            </pre>
          </DashboardCard>

          <DashboardCard className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">URL Verdicts</h2>
              <StatusBadge status={authTone(result.urls.verdict)} label={result.urls.verdict} />
            </div>

            {urlEntries.length === 0 ? (
              <p className="mt-3 text-sm text-white/70">No URLs extracted from the message.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="px-3 py-2">URL</th>
                      <th className="px-3 py-2">Verdict</th>
                      <th className="px-3 py-2">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {urlEntries.map(([url, verdict]) => (
                      <tr key={url} className="text-slate-200">
                        <td className="px-3 py-2 break-all">{url}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={authTone(verdict.verdict)} label={verdict.verdict} />
                        </td>
                        <td className="px-3 py-2">{Math.round(verdict.score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>
        </div>
      ) : null}
    </div>
  );
}

export default function EmailAnalyzerPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#7c6af7]" /></div>}>
      <EmailAnalyzerPageContent />
    </Suspense>
  );
}
