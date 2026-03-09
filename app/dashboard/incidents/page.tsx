"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Shield,
  ChevronRight,
  Download,
  Ban,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Loader2,
  FileWarning,
  Search,
} from "lucide-react";
import {
  getIncidents,
  resolveIncident,
  deleteIncident,
  blockIp,
} from "@/lib/supabase/actions";

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignee: string;
  description?: string;
  risk_score?: number;
  threat_category?: string;
  remediation_steps?: string[];
  created_at?: string;
  lastUpdated?: string;
};

function severityBadge(severity: string) {
  const s = severity?.toLowerCase() || "medium";
  if (s === "critical") return "bg-red-50 text-red-700 border-red-200";
  if (s === "high") return "bg-orange-50 text-orange-700 border-orange-200";
  if (s === "low") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-yellow-50 text-yellow-700 border-yellow-200";
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() || "";
  if (s.includes("resolved"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-teal-50 text-teal-700 border-teal-200";
}

export default function IncidentReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    getIncidents()
      .then((data) => setIncidents(data as Incident[]))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoaded(true));
  }, []);

  const refreshData = async () => {
    try {
      const data = await getIncidents();
      setIncidents(data as Incident[]);
    } catch {
      // silently ignore refresh errors
    }
  };

  const handleResolve = (id: string) => {
    setActionId(id);
    setActionType("resolve");
    startTransition(async () => {
      try {
        await resolveIncident(id, "Resolved via dashboard.");
        toast.success("Incident resolved.");
        await refreshData();
      } catch (err: any) {
        toast.error(err.message || "Failed to resolve incident.");
      } finally {
        setActionId(null);
        setActionType(null);
      }
    });
  };

  const handleDelete = (id: string) => {
    setActionId(id);
    setActionType("delete");
    startTransition(async () => {
      try {
        await deleteIncident(id);
        toast.success("Incident deleted.");
        await refreshData();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete incident.");
      } finally {
        setActionId(null);
        setActionType(null);
      }
    });
  };

  const extractTarget = (incident: Incident): string | null => {
    const combined = `${incident.title || ""} ${incident.description || ""}`;
    // Try IP first
    const ipMatch = combined.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    if (ipMatch) return ipMatch[1];
    // Try domain pattern (e.g. "Target: evil.com")
    const domainMatch = combined.match(
      /Target:\s*([a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    );
    if (domainMatch) return domainMatch[1];
    return null;
  };

  const handleBlockIp = (target: string, incidentId: string) => {
    setActionId(incidentId);
    setActionType("block");
    startTransition(async () => {
      try {
        await blockIp(target);
        toast.success(`Target ${target} blocked and added to Intel Vault.`);
      } catch (err: any) {
        toast.error(err.message || "Failed to block target.");
      } finally {
        setActionId(null);
        setActionType(null);
      }
    });
  };

  const isActioning = (id: string, type: string) =>
    isPending && actionId === id && actionType === type;

  const exportToExcel = async () => {
    const ExcelJS = (await import("exceljs"));
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Phish-Slayer";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Incidents");

    // Define columns
    sheet.columns = [
      { header: "Title", key: "title", width: 40 },
      { header: "Severity", key: "severity", width: 12 },
      { header: "Status", key: "status", width: 22 },
      { header: "Assignee", key: "assignee", width: 16 },
      { header: "Risk Score", key: "risk_score", width: 12 },
      { header: "Threat Category", key: "threat_category", width: 20 },
      { header: "Created At", key: "created_at", width: 22 },
    ];

    // Style header row
    sheet.getRow(1).eachCell((cell: import('exceljs').Cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0D9488" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    // Add rows
    incidents.forEach((i) => {
      sheet.addRow({
        title: i.title,
        severity: i.severity,
        status: i.status,
        assignee: i.assignee || "Unassigned",
        risk_score: i.risk_score ?? "N/A",
        threat_category: i.threat_category || "N/A",
        created_at: i.created_at
          ? new Date(i.created_at).toLocaleString()
          : "N/A",
      });
    });

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PhishSlayer_Incidents_Export.xlsx";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Incidents exported to Excel.");
  };

  const filtered = incidents.filter((i) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      i.title?.toLowerCase().includes(q) ||
      i.severity?.toLowerCase().includes(q) ||
      i.status?.toLowerCase().includes(q) ||
      i.assignee?.toLowerCase().includes(q) ||
      i.threat_category?.toLowerCase().includes(q)
    );
  });

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="bg-transparent text-slate-900 font-sans min-h-screen flex flex-col w-full">
      <main className="flex-1 px-4 sm:px-8 py-8 w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <a
              className="hover:text-teal-600 transition-colors"
              href="/dashboard"
            >
              Dashboard
            </a>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 font-medium">Incident Reports</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Incident Reports
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {incidents.length} incident{incidents.length !== 1 ? "s" : ""}{" "}
                on record
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter incidents…"
                  className="w-56 py-2 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Total Incidents
              </p>
              <Shield className="text-teal-600 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {incidents.length}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Open</p>
              <AlertTriangle className="text-orange-500 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {
                incidents.filter(
                  (i) => !i.status?.toLowerCase().includes("resolved"),
                ).length
              }
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Resolved</p>
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {
                incidents.filter((i) =>
                  i.status?.toLowerCase().includes("resolved"),
                ).length
              }
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">Critical</p>
              <AlertTriangle className="text-red-500 w-5 h-5" />
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {
                incidents.filter(
                  (i) => i.severity?.toLowerCase() === "critical",
                ).length
              }
            </p>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-16 text-center">
            <FileWarning className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              No incidents found
            </h3>
            <p className="text-sm text-slate-500">
              {filter
                ? "Try adjusting your search filter."
                : "Incidents created from scans will appear here."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      Assignee
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                      Risk
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[260px]">
                          {incident.title}
                        </p>
                        {incident.threat_category && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[260px]">
                            {incident.threat_category}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${severityBadge(
                            incident.severity,
                          )}`}
                        >
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge(
                            incident.status,
                          )}`}
                        >
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm text-slate-600">
                          {incident.assignee || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {incident.risk_score ?? "—"}
                          </span>
                          {incident.risk_score != null && (
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  incident.risk_score >= 75
                                    ? "bg-red-500"
                                    : incident.risk_score >= 40
                                      ? "bg-orange-400"
                                      : "bg-emerald-500"
                                }`}
                                style={{
                                  width: `${Math.min(incident.risk_score, 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Resolve */}
                          {!incident.status
                            ?.toLowerCase()
                            .includes("resolved") && (
                            <button
                              onClick={() => handleResolve(incident.id)}
                              disabled={isPending && actionId === incident.id}
                              title="Resolve"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              {isActioning(incident.id, "resolve") ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Resolve
                            </button>
                          )}

                          {/* Block IP/Domain — extract from title or description */}
                          {extractTarget(incident) && (
                            <button
                              onClick={() => {
                                const target = extractTarget(incident);
                                if (target) handleBlockIp(target, incident.id);
                              }}
                              disabled={isPending && actionId === incident.id}
                              title="Block IP"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
                            >
                              {isActioning(incident.id, "block") ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                              Block IP
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(incident.id)}
                            disabled={isPending && actionId === incident.id}
                            title="Delete"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            {isActioning(incident.id, "delete") ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
