"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Eye, Loader2 } from "lucide-react";
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


type LeakRecord = {
  id: string;
  organization_id: string;
  email: string;
  breach_source: string;
  breach_date?: string | null;
  exposed_data: string[];
  severity: string;
  is_resolved: boolean;
};

type ScanResponse = {
  success: boolean;
  results?: unknown;
  error?: string;
};

function severityTone(value?: string) {
  const level = (value || "medium").toLowerCase();
  if (level === "critical") return "critical";
  if (level === "high") return "warning";
  if (level === "medium") return "pending";
  return "healthy";
}

export default function DarkWebPage() {
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;

  const [leaks, setLeaks] = useState<LeakRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [scanEmails, setScanEmails] = useState("");
  const [scanDomain, setScanDomain] = useState("");
  const [scanning, setScanning] = useState(false);

  const fetchLeaks = useCallback(async () => {
    if (!userId || !orgId) {
      setLeaks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch("/api/darkweb/leaks", { cache: "no-store" });
      const payload = (await response.json()) as LeakRecord[] | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to load leaks");
      }

      const filtered = Array.isArray(payload)
        ? payload.filter((leak) => leak.organization_id === orgId)
        : [];
      setLeaks(filtered);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unable to load leaks");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    if (!orgLoaded) return;
    void fetchLeaks();
  }, [fetchLeaks, orgLoaded]);

  const stats = useMemo(() => {
    const total = leaks.length;
    const unresolved = leaks.filter((leak) => !leak.is_resolved).length;
    const exposedEmails = new Set(leaks.map((leak) => leak.email)).size;
    return { total, unresolved, exposedEmails };
  }, [leaks]);

  const handleScan = async () => {
    if (!orgId) return;

    const emails = scanEmails
      .split(/\s|,|;|\n/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (emails.length === 0 || !scanDomain.trim()) {
      setErrorText("Provide at least one email and a domain to scan.");
      return;
    }

    setScanning(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/darkweb/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails,
          domain: scanDomain.trim(),
          organizationId: orgId,
        }),
      });
      const payload = (await response.json()) as ScanResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Scan failed");
      }

      setScanEmails("");
      setScanDomain("");
      await fetchLeaks();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="dashboard-page-title text-white">Dark Web</h1>
        <p className="mt-2 text-sm text-slate-300">
          Monitor credential leaks and trigger dark web scans.
        </p>
      </div>

      <DashboardCard className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <DashboardCard className="bg-black/20 px-3 py-2">
            <p className="dashboard-card-label">Total Leaks</p>
            <p className="dashboard-metric-value">{stats.total}</p>
          </DashboardCard>
          <DashboardCard className="bg-black/20 px-3 py-2">
            <p className="dashboard-card-label">Unresolved</p>
            <p className="dashboard-metric-value text-red-300">{stats.unresolved}</p>
          </DashboardCard>
          <DashboardCard className="bg-black/20 px-3 py-2">
            <p className="dashboard-card-label">Exposed Emails</p>
            <p className="dashboard-metric-value text-orange-300">{stats.exposedEmails}</p>
          </DashboardCard>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={scanDomain}
            onChange={(event) => setScanDomain(event.target.value)}
            placeholder="Domain (example.com)"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
          <input
            value={scanEmails}
            onChange={(event) => setScanEmails(event.target.value)}
            placeholder="Emails (comma separated)"
            className="md:col-span-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleScan}
          disabled={!orgId || scanning}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7c6af7] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60"
        >
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Run Scan
        </button>
      </DashboardCard>

      {!orgLoaded ? (
        <DashboardCard className="text-white/70">Loading organization...</DashboardCard>
      ) : !orgId ? (
        <DashboardCard className="text-white/70">Initializing organization context...</DashboardCard>
      ) : loading ? (
        <DashboardCard className="text-white/70 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dark web leaks...
        </DashboardCard>
      ) : leaks.length === 0 ? (
        <DashboardCard className="text-white/70">No leaks detected.</DashboardCard>
      ) : (
        <DashboardCard className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Exposed Data</th>
                <th className="px-3 py-2">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leaks.map((leak) => (
                <tr key={leak.id}>
                  <td className="px-3 py-3 text-white">{leak.email}</td>
                  <td className="px-3 py-3 text-white/70">{leak.breach_source}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {leak.exposed_data?.length
                        ? leak.exposed_data.map((item) => (
                            <span
                              key={`${leak.id}-${item}`}
                              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] uppercase tracking-widest text-white/70"
                            >
                              {item}
                            </span>
                          ))
                        : "N/A"}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={severityTone(leak.severity)} label={leak.severity} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
