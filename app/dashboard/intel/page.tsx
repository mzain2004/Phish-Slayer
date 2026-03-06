"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Loader2,
  ShieldCheck,
  Database,
  ListPlus,
  AlertTriangle,
  Code,
  Copy,
} from "lucide-react";
import {
  getWhitelist,
  removeFromWhitelist,
  getIntelIndicators,
  removeIntelIndicator,
} from "@/lib/supabase/actions";

/* ── Severity Badge ───────────────────────────────────────────────── */
function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toLowerCase() ?? "";
  let bg = "bg-slate-100 text-slate-600 border-slate-200";
  if (s === "critical")
    bg =
      "bg-red-50 text-red-700 border-red-200 shadow-[0_0_6px_rgba(239,68,68,0.15)]";
  else if (s === "high")
    bg =
      "bg-orange-50 text-orange-700 border-orange-200 shadow-[0_0_6px_rgba(249,115,22,0.12)]";
  else if (s === "medium")
    bg = "bg-amber-50 text-amber-700 border-amber-200";
  else if (s === "low") bg = "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${bg} transition-colors`}
    >
      {severity || "Unknown"}
    </span>
  );
}

/* ── Main Page ────────────────────────────────────────────────────── */
export default function IntelVaultPage() {
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Promise.all([
      getWhitelist().then((data: any[]) => setWhitelist(data)),
      getIntelIndicators().then((data: any[]) => setIndicators(data)),
    ]).finally(() => setLoaded(true));
  }, []);

  const handleRemoveWhitelist = (id: string) => {
    startTransition(async () => {
      try {
        await removeFromWhitelist(id);
        const data = await getWhitelist();
        setWhitelist(data);
        toast.success("Target removed from whitelist.");
      } catch (err: any) {
        toast.error(err.message || "Failed to remove target.");
      }
    });
  };

  const handleRemoveIndicator = (id: string) => {
    startTransition(async () => {
      try {
        await removeIntelIndicator(id);
        const data = await getIntelIndicators();
        setIndicators(data);
        toast.success("Indicator removed from Intel Vault.");
      } catch (err: any) {
        toast.error(err.message || "Failed to remove indicator.");
      }
    });
  };

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  /* ── Page ─────────────────────────────────────────────────────────── */
  return (
    <div className="bg-transparent text-slate-900 font-sans min-h-screen flex flex-col w-full overflow-x-hidden">
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Database className="w-7 h-7 text-teal-600" />
            Intel Vault
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Manage your organization&apos;s whitelisted targets and proprietary threat intelligence indicators.
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Whitelisted",
              value: whitelist.length,
              icon: ShieldCheck,
              color: "text-emerald-600 bg-emerald-50 border-emerald-200",
            },
            {
              label: "Total Indicators",
              value: indicators.length,
              icon: Database,
              color: "text-teal-600 bg-teal-50 border-teal-200",
            },
            {
              label: "Critical",
              value: indicators.filter(
                (i) => i.severity?.toLowerCase() === "critical"
              ).length,
              icon: AlertTriangle,
              color: "text-red-600 bg-red-50 border-red-200",
            },
            {
              label: "High",
              value: indicators.filter(
                (i) => i.severity?.toLowerCase() === "high"
              ).length,
              icon: AlertTriangle,
              color: "text-orange-600 bg-orange-50 border-orange-200",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`rounded-xl border p-4 flex items-center gap-4 ${kpi.color} transition-shadow hover:shadow-md`}
            >
              <kpi.icon className="w-6 h-6 shrink-0 opacity-80" />
              <div>
                <p className="text-2xl font-bold leading-none">{kpi.value}</p>
                <p className="text-xs font-semibold mt-1 uppercase tracking-wider opacity-70">
                  {kpi.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">

          {/* ────────────── Whitelist Table ────────────── */}
          <div className="w-full xl:w-[380px] xl:min-w-[340px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Target Whitelist
              </h2>
              <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
                {whitelist.length}
              </span>
            </div>

            {/* Table header */}
            <div className="bg-slate-50 px-5 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Target
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Date Added
              </span>
            </div>

            {/* Body */}
            {whitelist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <ListPlus className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  No whitelisted targets found.
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                  Targets added from the Threat Intel dashboard will appear
                  here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {whitelist.map((item) => (
                  <li
                    key={item.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {item.target}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveWhitelist(item.id)}
                      disabled={isPending}
                      aria-label={`Remove ${item.target} from whitelist`}
                      className="p-1.5 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ────────────── Intel Vault Table ────────────── */}
          <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Proprietary Intel Vault
              </h2>
              <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
                {indicators.length}
              </span>
            </div>

            {/* Table header */}
            <div className="bg-slate-50 px-5 py-2 border-b border-slate-200 grid grid-cols-12 gap-3 items-center">
              <span className="col-span-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Indicator
              </span>
              <span className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Type
              </span>
              <span className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Severity
              </span>
              <span className="col-span-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Source
              </span>
              <span className="col-span-1" />
            </div>

            {/* Body */}
            {indicators.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <Database className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  No threat indicators found.
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Run the intel harvester or manually add indicators to populate
                  this vault.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {indicators.map((item) => (
                  <li
                    key={item.id}
                    className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Indicator */}
                    <div className="col-span-5 min-w-0">
                      <p
                        className="text-sm font-semibold text-slate-900 truncate"
                        title={item.indicator}
                      >
                        {item.indicator}
                      </p>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-200">
                        {item.type || "—"}
                      </span>
                    </div>

                    {/* Severity */}
                    <div className="col-span-2">
                      <SeverityBadge severity={item.severity} />
                    </div>

                    {/* Source */}
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-slate-500 truncate block">
                        {item.source || "—"}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => handleRemoveIndicator(item.id)}
                        disabled={isPending}
                        aria-label={`Remove indicator ${item.indicator}`}
                        className="p-1.5 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ────────────── API Documentation ────────────── */}
        <div className="mt-10 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-900 flex items-center gap-3">
            <Code className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-semibold text-white">
              Public API v1
            </h2>
            <span className="ml-auto text-[10px] font-bold text-teal-400 bg-teal-400/10 rounded-full px-2.5 py-0.5 border border-teal-400/20">
              BETA
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Endpoint */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Endpoint
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-mono text-sm text-slate-800 flex items-center justify-between gap-4">
                <span>
                  <span className="text-teal-600 font-bold">GET</span>{" "}
                  <span className="text-slate-500">/api/v1/scan</span>
                  <span className="text-slate-400">?target=example.com</span>
                </span>
              </div>
            </div>

            {/* Auth */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Authentication
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Include your API key in the <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-teal-700 border border-slate-200">x-api-key</code> header. Set <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-teal-700 border border-slate-200">PHISH_SLAYER_API_KEY</code> in your environment.
              </p>
            </div>

            {/* cURL Example */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  cURL Example
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `curl -X GET "https://your-domain.com/api/v1/scan?target=example.com" -H "x-api-key: YOUR_API_KEY"`
                    );
                    toast.success("Copied to clipboard!");
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-300 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X GET \\
  "https://your-domain.com/api/v1/scan?target=example.com" \\
  -H "x-api-key: YOUR_API_KEY"`}
              </pre>
            </div>

            {/* POST Example */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                POST Example
              </h3>
              <pre className="bg-slate-900 text-slate-300 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
{`curl -X POST "https://your-domain.com/api/v1/scan" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"target": "suspicious-domain.xyz"}'`}
              </pre>
            </div>

            {/* Response */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wide">
                Response Format
              </h3>
              <pre className="bg-slate-900 text-emerald-400 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "data": {
    "target": "example.com",
    "verdict": "malicious",
    "risk_score": 85,
    "threat_category": "phishing",
    "ai_summary": "AI-generated threat analysis...",
    "malicious_count": 12,
    "total_engines": 70,
    "source": "virustotal",
    "scan_date": "2026-03-06T..."
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
