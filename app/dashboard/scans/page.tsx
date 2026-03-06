"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { launchScan, getScans } from "@/lib/supabase/actions";
import {
  Crosshair,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
} from "lucide-react";

type ScanRecord = {
  id?: string;
  target: string;
  status: string;
  date: string;
  verdict?: string;
  malicious_count?: number;
  total_engines?: number;
  ai_summary?: string;
  risk_score?: number;
  threat_category?: string;
};

function ScanManagerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFilter = searchParams.get("search") || "";
  const [target, setTarget] = useState(searchFilter);
  const [isPending, startTransition] = useTransition();
  const [allScans, setAllScans] = useState<ScanRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refreshScans = () => {
    getScans()
      .then((rows) => setAllScans(rows as ScanRecord[]))
      .catch(() => {})
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    refreshScans();
  }, []);

  const scans = searchFilter
    ? allScans.filter((scan) => scan.target.toLowerCase().includes(searchFilter.toLowerCase()))
    : allScans;

  const handleScan = () => {
    if (!target.trim()) return;
    startTransition(async () => {
      const result = await launchScan(target.trim());
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Scan complete for ${target.trim()}`);
        setTarget("");
        refreshScans();
      }
    });
  };

  function verdictBadge(verdict?: string) {
    const v = verdict?.toLowerCase() || "";
    if (v === "malicious") return "bg-red-50 text-red-700 border-red-200";
    if (v === "clean") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  return (
    <div className="bg-transparent font-sans text-slate-900 antialiased min-h-screen flex flex-col w-full">
      <main className="flex-1 px-4 sm:px-8 py-8 w-full max-w-5xl mx-auto flex flex-col gap-10">

        {/* Hero Scanner Section */}
        <section className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-40"></div>
          </div>

          <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 mb-6">
              <Crosshair className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Threat Scanner
            </h1>
            <p className="text-slate-500 text-base max-w-lg mb-10 leading-relaxed">
              Enter a URL or IP address to run a deep threat analysis powered by VirusTotal and Gemini AI.
            </p>

            {/* Scanner Input */}
            <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Crosshair className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isPending && handleScan()}
                  disabled={isPending}
                  placeholder="e.g. 8.8.8.8 or suspicious-domain.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                />
              </div>
              <button
                onClick={handleScan}
                disabled={isPending || !target.trim()}
                className="px-8 py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white border-none text-base font-bold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap min-w-[160px]"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
                {isPending ? "Scanning…" : "Scan Target"}
              </button>
            </div>

            {isPending && (
              <p className="mt-4 text-sm text-blue-600 font-medium animate-pulse">
                Analyzing target with VirusTotal + Gemini AI — this may take a moment…
              </p>
            )}
          </div>
        </section>

        {/* Recent Scans Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Recent Scans</h2>
            <span className="text-sm text-slate-500 font-medium">
              {loaded ? `${scans.length} scan${scans.length !== 1 ? "s" : ""} on record` : "Loading…"}
            </span>
          </div>

          {!loaded ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : scans.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
              <FileWarning className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No scans yet</h3>
              <p className="text-sm text-slate-500">
                Enter a target above and hit &quot;Scan Target&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Verdict</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Engines</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Risk</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Category</th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scans.map((s, i) => (
                      <tr 
                        key={s.id || i} 
                        onClick={() => router.push("/dashboard/threats")}
                        className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 truncate max-w-[220px] font-mono">
                            {s.target}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{s.status}</p>
                        </td>
                        <td className="px-6 py-4">
                          {s.verdict ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${verdictBadge(s.verdict)}`}>
                              {s.verdict.toLowerCase() === "malicious" ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {s.verdict}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          {s.malicious_count != null && s.total_engines != null ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {s.malicious_count}/{s.total_engines}
                              </span>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    s.malicious_count > 0 ? "bg-red-500" : "bg-emerald-500"
                                  }`}
                                  style={{
                                    width: s.total_engines > 0
                                      ? `${(s.malicious_count / s.total_engines) * 100}%`
                                      : "0%",
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          {s.risk_score != null ? (
                            <span className={`text-sm font-bold ${
                              s.risk_score >= 70 ? "text-red-600" : s.risk_score >= 40 ? "text-orange-500" : "text-emerald-600"
                            }`}>
                              {s.risk_score}/100
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-slate-600">{s.threat_category || "—"}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-500 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {s.date
                              ? new Date(s.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default function ScanManagerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>}>
      <ScanManagerContent />
    </Suspense>
  );
}
