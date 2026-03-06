"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  ShieldAlert,
  Radar,
  AlertTriangle,
  Database,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import {
  getIncidents,
  getScans,
  getIntelIndicators,
} from "@/lib/supabase/actions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type ScanRecord = {
  target: string;
  status: string;
  date: string;
  verdict?: string;
  risk_score?: number;
  threat_category?: string;
  ai_summary?: string;
};

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Data
  const [totalScans, setTotalScans] = useState(0);
  const [maliciousScans, setMaliciousScans] = useState(0);
  const [activeIncidents, setActiveIncidents] = useState(0);
  const [intelVaultSize, setIntelVaultSize] = useState(0);
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [categoryData, setCategoryData] = useState<
    { name: string; count: number }[]
  >([]);

  // Extra derived
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [avgRisk, setAvgRisk] = useState(0);

  useEffect(() => {
    Promise.all([getIncidents(), getScans(), getIntelIndicators()])
      .then(([incidents, scans, intel]) => {
        // ── KPIs ──────────────────────────────────────────────
        const scanArr = scans as ScanRecord[];
        setTotalScans(scanArr.length);
        setMaliciousScans(
          scanArr.filter((s) => s.verdict?.toLowerCase() === "malicious").length
        );
        setTotalIncidents(incidents.length);
        const open = incidents.filter(
          (i: any) => !i.status?.toLowerCase().includes("resolved")
        );
        setActiveIncidents(open.length);
        setResolvedCount(
          incidents.filter((i: any) =>
            i.status?.toLowerCase().includes("resolved")
          ).length
        );
        setIntelVaultSize(intel.length);

        const scores = incidents
          .map((i: any) => i.risk_score)
          .filter((s: any) => typeof s === "number");
        setAvgRisk(
          scores.length
            ? Math.round(
                scores.reduce((a: number, b: number) => a + b, 0) /
                  scores.length
              )
            : 0
        );

        // ── Recent Scans (last 5) ─────────────────────────────
        const sorted = [...scanArr].sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecentScans(sorted.slice(0, 5));

        // ── Threats by Category ───────────────────────────────
        const cats: Record<string, number> = {};
        scanArr
          .filter((s) => s.threat_category && s.threat_category !== "Unknown")
          .forEach((s) => {
            const c = s.threat_category!;
            cats[c] = (cats[c] || 0) + 1;
          });
        const catArr = Object.entries(cats)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
        setCategoryData(catArr);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const scoreIndex = loaded ? Math.max(0, 100 - avgRisk) : 0;
  const postureDelta =
    totalIncidents > 0
      ? `+${((resolvedCount / totalIncidents) * 100).toFixed(1)}%`
      : "+0.0%";

  const Metric = ({ value }: { value: string | number }) =>
    !loaded ? (
      <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
    ) : (
      <>{value}</>
    );

  const BAR_COLORS = [
    "#0d9488",
    "#0ea5e9",
    "#f97316",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  return (
    <>
      <div className="relative flex-1 flex flex-col items-center p-8 bg-[#fdfdfb] min-h-full w-full pb-24">
        {/* Decorative Blur */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <header className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 z-40 mb-10">
          <div>
            <h2 className="text-slate-900 text-3xl font-light tracking-tight">
              Command Center
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium tracking-wide">
              Enterprise Security Posture — God&apos;s Eye View
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-tighter">
                Network Integrity
              </span>
              <span className="text-emerald-600 font-semibold">
                {!loaded ? (
                  <Loader2 className="w-4 h-4 animate-spin inline" />
                ) : activeIncidents === 0 ? (
                  "Resilient"
                ) : activeIncidents <= 5 ? (
                  "Stable"
                ) : (
                  "At Risk"
                )}
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  router.push(
                    `/dashboard/scans?search=${encodeURIComponent(searchQuery.trim())}`
                  );
                }
              }}
              className="relative flex items-center"
            >
              <div
                className={`flex items-center bg-white/40 backdrop-blur-md border border-white/60 transition-all rounded-full overflow-hidden ${
                  isSearchExpanded
                    ? "w-64 px-4 bg-white/60 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500"
                    : "w-12 hover:bg-white"
                } h-12`}
              >
                <button
                  type="button"
                  onClick={() => setIsSearchExpanded(true)}
                  className={`flex items-center justify-center shrink-0 ${isSearchExpanded ? "text-teal-600" : "text-slate-700 w-full h-full"}`}
                >
                  <Search className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder="Search IP or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                  className={`bg-transparent outline-none text-sm text-slate-800 placeholder-slate-500 transition-all ${
                    isSearchExpanded
                      ? "w-full ml-3 opacity-100"
                      : "w-0 opacity-0"
                  }`}
                />
              </div>
            </form>

            <button
              onClick={() => router.push("/dashboard/incidents")}
              className="px-6 h-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 text-white text-sm font-medium hover:from-teal-500 hover:to-blue-600 transition-all border-none shadow-lg hover:shadow-cyan-500/25"
            >
              Intervene
            </button>
          </div>
        </header>

        {/* ── Score Orb + Metrics ────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center justify-center group cursor-default mb-12">
          {/* Ripple Effects */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border border-emerald-200/40 rounded-full animate-[ripple_6s_infinite] opacity-40" />
            <div
              className="w-56 h-56 border border-blue-200/20 rounded-full animate-[ripple_6s_infinite] opacity-40"
              style={{ animationDelay: "2s" }}
            />
          </div>

          {/* Core Score Orb */}
          <div
            className="w-44 h-44 bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center relative shadow-[0_0_80px_rgba(16,185,129,0.2)]"
            style={{
              animation: "float 15s infinite ease-in-out",
              borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%",
            }}
          >
            <div className="text-center text-white drop-shadow-lg z-10">
              <span className="block text-5xl font-light tracking-tighter">
                <Metric value={scoreIndex} />
              </span>
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-80">
                Score Index
              </span>
            </div>
            <div className="absolute inset-0 animate-[spin_20s_linear_infinite] opacity-30 pointer-events-none">
              <div className="absolute top-0 left-1/2 w-1 h-16 bg-gradient-to-b from-white to-transparent rounded-full" />
            </div>
          </div>
        </div>

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* Total Scans */}
          <div className="bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total Scans
              </span>
              <Radar className="w-5 h-5 text-teal-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              <Metric value={totalScans} />
            </p>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </div>

          {/* Malicious */}
          <div className="bg-white/80 backdrop-blur border border-red-100/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Malicious
              </span>
              <ShieldAlert className="w-5 h-5 text-red-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              <Metric value={maliciousScans} />
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {loaded && totalScans > 0
                ? `${((maliciousScans / totalScans) * 100).toFixed(1)}% detection rate`
                : "—"}
            </p>
          </div>

          {/* Active Incidents */}
          <div className="bg-white/80 backdrop-blur border border-orange-100/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Active Incidents
              </span>
              <AlertTriangle className="w-5 h-5 text-orange-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-orange-600">
              <Metric value={activeIncidents} />
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {loaded
                ? `${resolvedCount} resolved`
                : "—"}
            </p>
          </div>

          {/* Intel Vault */}
          <div className="bg-white/80 backdrop-blur border border-teal-100/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Intel Vault
              </span>
              <Database className="w-5 h-5 text-teal-500 opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-3xl font-bold text-teal-600">
              <Metric value={intelVaultSize} />
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Proprietary indicators
            </p>
          </div>
        </div>

        {/* ── Charts + Activity Feed ────────────────────────────── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Bar Chart — Threats by Category */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Threats by Category
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {loaded
                  ? `${categoryData.length} categories`
                  : "Loading…"}
              </span>
            </div>
            {!loaded ? (
              <div className="flex items-center justify-center h-52">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <Activity className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">
                  No category data yet. Run some scans to populate.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={categoryData}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                    cursor={{ fill: "rgba(13,148,136,0.06)" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                    {categoryData.map((_entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={BAR_COLORS[idx % BAR_COLORS.length]}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-white/80 backdrop-blur border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Recent Activity
                </h3>
              </div>
            </div>
            {!loaded ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : recentScans.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Radar className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No scans yet.</p>
              </div>
            ) : (
              <ul className="space-y-1 flex-1">
                {recentScans.map((s, i) => {
                  const isMalicious =
                    s.verdict?.toLowerCase() === "malicious";
                  return (
                    <li
                      key={i}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => router.push("/dashboard/threats")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isMalicious
                              ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
                              : "bg-emerald-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate max-w-[160px] font-mono">
                            {s.target}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {s.date
                              ? new Date(s.date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isMalicious
                            ? "text-red-700 bg-red-50 border-red-200"
                            : "text-emerald-700 bg-emerald-50 border-emerald-200"
                        }`}
                      >
                        {s.verdict || "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="relative z-40 w-full max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-6 px-2">
          <div className="flex flex-wrap gap-6 sm:gap-8">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Posture Delta
              </p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-lg font-medium text-slate-700">
                  {!loaded ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    postureDelta
                  )}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 border-l border-slate-200 pl-6 sm:pl-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Avg Risk Index
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${avgRisk >= 70 ? "bg-red-500" : avgRisk >= 40 ? "bg-orange-400" : "bg-emerald-500"}`}
                />
                <span className="text-lg font-medium text-slate-700">
                  {!loaded ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : (
                    `${avgRisk}/100`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fdfdfb] to-transparent pointer-events-none z-30" />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.02); }
          }
          @keyframes ripple {
            0% { transform: scale(1); opacity: 0.4; }
            100% { transform: scale(2); opacity: 0; }
          }
        `,
        }}
      />
    </>
  );
}
