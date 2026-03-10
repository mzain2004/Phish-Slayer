"use client";

import { useState, useEffect, useTransition, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { launchScan, getScans } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { useRole } from "@/lib/rbac/useRole";
import { canLaunchScans, canViewAllScans } from "@/lib/rbac/roles";
import {
  Crosshair,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileWarning,
  Eye,
  Filter,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
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
  user_id?: string;
};

const ITEMS_PER_PAGE = 15;

function verdictBadge(verdict?: string) {
  const v = verdict?.toLowerCase() || "";
  if (v === "malicious") return "bg-red-500/10 text-red-400 border-red-500/20";
  if (v === "clean")
    return "bg-green-500/10 text-green-400 border-green-500/20";
  return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
}

function ScanManagerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, loading: roleLoading } = useRole();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const searchFilter = searchParams.get("search") || "";
  const [target, setTarget] = useState(searchFilter);
  const [isPending, startTransition] = useTransition();
  const [allScans, setAllScans] = useState<ScanRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState<"all" | "today" | "7" | "30">(
    "all",
  );
  const [viewScope, setViewScope] = useState<"all" | "my">("all");
  const [page, setPage] = useState(0);

  const refreshScans = () => {
    getScans()
      .then((rows) => setAllScans(rows as ScanRecord[]))
      .catch(() => {})
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    refreshScans();
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data?.user) setCurrentUserId(data.user.id);
      });
  }, []);

  const handleScan = () => {
    if (!target.trim() || !role || !canLaunchScans(role)) return;
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

  const filteredScans = useMemo(() => {
    let result = allScans;

    // View Scope Filter
    if (viewScope === "my" && currentUserId) {
      result = result.filter((s) => s.user_id === currentUserId);
    }

    // Text Search
    if (searchFilter) {
      const lowerSearch = searchFilter.toLowerCase();
      result = result.filter((s) =>
        s.target.toLowerCase().includes(lowerSearch),
      );
    }

    // Date Range Filter
    if (dateRange !== "all") {
      const now = new Date();
      result = result.filter((s) => {
        if (!s.date) return false;
        const d = new Date(s.date);
        const diffMs = now.getTime() - d.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (dateRange === "today") return diffDays <= 1;
        if (dateRange === "7") return diffDays <= 7;
        if (dateRange === "30") return diffDays <= 30;
        return true;
      });
    }

    return result;
  }, [allScans, searchFilter, dateRange, viewScope, currentUserId]);

  const totalPages = Math.ceil(filteredScans.length / ITEMS_PER_PAGE);
  const paginatedScans = filteredScans.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  // Reset page when filters change
  useEffect(() => setPage(0), [searchFilter, dateRange, viewScope]);

  if (!loaded || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const isViewer = role === "viewer";
  const isManagerOrAdmin = role && canViewAllScans(role);

  return (
    <div className="bg-[#0a0f1e] font-sans text-slate-100 antialiased min-h-screen flex flex-col w-full">
      <main className="flex-1 px-4 sm:px-8 py-8 w-full max-w-5xl mx-auto flex flex-col gap-10">
        {/* Hero Scanner Section */}
        <section className="relative bg-[#0f1629] rounded-2xl border border-slate-800 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-teal-900/20 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl opacity-40"></div>
          </div>

          {isViewer && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 shadow-sm">
              <Eye className="w-3.5 h-3.5" />
              View Only
            </div>
          )}

          <div className="relative z-10 px-8 py-12 sm:px-12 sm:py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 mb-6">
              <Crosshair className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              Threat Scanner
            </h1>
            <p className="text-slate-500 text-base max-w-lg mb-10 leading-relaxed">
              Enter a URL or IP address to run a deep threat analysis powered by
              VirusTotal and Gemini AI.
            </p>

            {/* Scanner Input for analysts/managers/admins */}
            {!isViewer && (
              <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Crosshair className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !isPending && handleScan()
                    }
                    disabled={isPending}
                    placeholder="e.g. 8.8.8.8 or suspicious-domain.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <button
                  onClick={handleScan}
                  disabled={isPending || !target.trim()}
                  className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white border-none text-base font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap min-w-[160px]"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                  {isPending ? "Scanning…" : "Scan Target"}
                </button>
              </div>
            )}
            {isViewer && (
              <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-400 font-medium flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                Your role restricts launching new scans. You can view existing
                historical scans below.
              </div>
            )}

            {isPending && (
              <p className="mt-4 text-sm text-teal-400 font-medium animate-pulse">
                Analyzing target with VirusTotal + Gemini AI — this may take a
                moment…
              </p>
            )}
          </div>
        </section>

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Scan History</h2>
            {role === "analyst" && (
              <span className="text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full">
                Viewing your scans
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Scope Toggle for Managers+ */}
            {isManagerOrAdmin && (
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setViewScope("all")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewScope === "all" ? "bg-slate-800 shadow-sm text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  <Users className="w-3.5 h-3.5" /> All Users
                </button>
                <button
                  onClick={() => setViewScope("my")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewScope === "my" ? "bg-slate-800 shadow-sm text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  <User className="w-3.5 h-3.5" /> My Scans
                </button>
              </div>
            )}

            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <Filter className="w-4 h-4 text-slate-400 ml-2" />
              <select
                value={dateRange}
                onChange={(e: any) => setDateRange(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-slate-300 py-1.5 pr-8 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scans Table */}
        <section>
          {paginatedScans.length === 0 ? (
            <div className="bg-[#0f1629] rounded-xl border border-slate-800 p-16 text-center">
              <FileWarning className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-1">
                No scans found
              </h3>
              <p className="text-sm text-slate-500">
                Adjust your filters or launch a new scan to populate history.
              </p>
            </div>
          ) : (
            <div className="bg-[#0f1629] rounded-xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800">
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Verdict
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                        Engines
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                        Risk
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                        Category
                      </th>
                      <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paginatedScans.map((s, i) => (
                      <tr
                        key={s.id || i}
                        onClick={() => router.push("/dashboard/threats")}
                        className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-teal-400 truncate max-w-[220px] font-mono">
                            {s.target}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {s.status}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {s.verdict ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${verdictBadge(s.verdict)}`}
                            >
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
                          {s.malicious_count != null &&
                          s.total_engines != null ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-300">
                                {s.malicious_count}/{s.total_engines}
                              </span>
                              <div className="w-16 bg-slate-800 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    s.malicious_count > 0
                                      ? "bg-red-500"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{
                                    width:
                                      s.total_engines > 0
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
                            <span
                              className={`text-sm font-bold ${
                                s.risk_score >= 70
                                  ? "text-red-400"
                                  : s.risk_score >= 40
                                    ? "text-orange-400"
                                    : "text-green-400"
                              }`}
                            >
                              {s.risk_score}/100
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-slate-400">
                            {s.threat_category || "—"}
                          </span>
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-t border-slate-800">
                  <span className="text-sm text-slate-500">
                    Showing {page * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(
                      (page + 1) * ITEMS_PER_PAGE,
                      filteredScans.length,
                    )}{" "}
                    of {filteredScans.length} scans
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-400 px-2">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ScanManagerDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      }
    >
      <ScanManagerContent />
    </Suspense>
  );
}
