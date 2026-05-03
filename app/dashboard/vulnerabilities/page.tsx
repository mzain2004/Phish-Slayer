"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Radar } from "lucide-react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";

// Helper to get client-side cookie
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}


type Vulnerability = {
  id: string;
  organization_id: string;
  asset_id?: string | null;
  cve_id: string;
  cvss_score?: number | null;
  severity?: string | null;
  description?: string | null;
  affected_product?: string | null;
  patch_available?: boolean | null;
  status?: "open" | "in_progress" | "resolved" | "accepted" | string;
  discovered_at?: string | null;
};

type ScanResponse = {
  success: boolean;
  count: number;
  error?: string;
};

function severityTone(severity?: string | null) {
  const value = (severity || "medium").toLowerCase();
  if (value === "critical") return "critical";
  if (value === "high") return "warning";
  if (value === "medium") return "pending";
  return "healthy";
}

export default function VulnerabilitiesPage() {
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;

  const [rows, setRows] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const fetchRows = useCallback(async () => {
    if (!userId || !orgId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/vulnerabilities", { cache: "no-store" });
      const payload = (await response.json()) as Vulnerability[] | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to load vulnerabilities");
      }

      const filtered = Array.isArray(payload)
        ? payload.filter((row) => row.organization_id === orgId)
        : [];
      setRows(filtered);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unable to load vulnerabilities");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    if (!orgLoaded) return;
    void fetchRows();
  }, [fetchRows, orgLoaded]);

  const handleScan = async () => {
    if (!orgId) return;
    setScanning(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/vulnerabilities/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });
      const payload = (await response.json()) as ScanResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Failed to run scan");
      }

      await fetchRows();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const stats = useMemo(() => {
    const totalOpen = rows.filter((row) => row.status === "open").length;
    const critical = rows.filter((row) => row.severity?.toLowerCase() === "critical").length;
    const high = rows.filter((row) => row.severity?.toLowerCase() === "high").length;
    const patched = rows.filter((row) => row.status === "resolved").length;
    return { totalOpen, critical, high, patched };
  }, [rows]);

  const handleStatusChange = (id: string, value: string) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status: value } : row)));
  };

  return (
    <div className="flex flex-col gap-6 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="dashboard-page-title text-white">Vulnerabilities</h1>
          <p className="text-sm text-slate-300">Track CVEs, patch readiness, and remediation status.</p>
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={!orgId || scanning}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7c6af7] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60"
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />}
          Run Scan
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">Total Open</p>
          <p className="dashboard-metric-value text-slate-100">{stats.totalOpen}</p>
        </DashboardCard>
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">Critical</p>
          <p className="dashboard-metric-value text-red-300">{stats.critical}</p>
        </DashboardCard>
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">High</p>
          <p className="dashboard-metric-value text-orange-300">{stats.high}</p>
        </DashboardCard>
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">Patched</p>
          <p className="dashboard-metric-value text-emerald-300">{stats.patched}</p>
        </DashboardCard>
      </div>

      {!orgLoaded ? (
        <DashboardCard className="text-white/70">Loading organization...</DashboardCard>
      ) : !orgId ? (
        <DashboardCard className="text-white/70">Initializing organization context...</DashboardCard>
      ) : loading ? (
        <DashboardCard className="text-white/70 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading vulnerabilities...
        </DashboardCard>
      ) : rows.length === 0 ? (
        <DashboardCard className="text-white/70">No vulnerabilities found.</DashboardCard>
      ) : (
        <DashboardCard className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-3 py-2">CVE</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Patch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-white">{row.cve_id}</p>
                    <p className="text-[10px] text-slate-400">{row.affected_product || "Unknown asset"}</p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={severityTone(row.severity)} label={row.severity || "medium"} />
                  </td>
                  <td className="px-3 py-3 text-white/70">{row.asset_id || "N/A"}</td>
                  <td className="px-3 py-3">
                    <select
                      value={row.status || "open"}
                      onChange={(event) => handleStatusChange(row.id, event.target.value)}
                      className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="accepted">Accepted</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 text-white/70">
                    {row.patch_available ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-slate-500">
            Status changes update locally; automation will sync remediation state on the next scan.
          </p>
        </DashboardCard>
      )}

      {errorText ? (
        <DashboardCard className="border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorText}
          </div>
        </DashboardCard>
      ) : null}
    </div>
  );
}
