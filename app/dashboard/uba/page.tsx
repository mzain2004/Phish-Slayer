"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Loader2, ShieldAlert } from "lucide-react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";

// Helper to get client-side cookie
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}


type RiskProfile = {
  id: string;
  organization_id: string;
  user_id: string;
  risk_score: number;
  risk_level: string;
  anomalies: any[];
  triggered_rules?: string[] | null;
  last_anomaly_at?: string | null;
  updated_at?: string | null;
};

function riskTone(level?: string) {
  const value = (level || "low").toLowerCase();
  if (value === "critical") return "bg-red-500/10 border-red-400/40 text-red-200";
  if (value === "high") return "bg-orange-500/10 border-orange-400/40 text-orange-200";
  if (value === "medium") return "bg-yellow-500/10 border-yellow-400/40 text-yellow-200";
  return "bg-emerald-500/10 border-emerald-400/40 text-emerald-200";
}

export default function UbaPage() {
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;

  const [profiles, setProfiles] = useState<RiskProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!userId || !orgId) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch("/api/uba/profiles", { cache: "no-store" });
      const payload = (await response.json()) as RiskProfile[] | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to load profiles");
      }

      const filtered = Array.isArray(payload)
        ? payload.filter((profile) => profile.organization_id === orgId)
        : [];
      setProfiles(filtered);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unable to load profiles");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    if (!orgLoaded) return;
    void fetchProfiles();
  }, [fetchProfiles, orgLoaded]);

  const summary = useMemo(() => {
    const total = profiles.length;
    const critical = profiles.filter((profile) => profile.risk_level?.toLowerCase() === "critical").length;
    const high = profiles.filter((profile) => profile.risk_level?.toLowerCase() === "high").length;
    return { total, critical, high };
  }, [profiles]);

  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="dashboard-page-title flex items-center gap-2 text-white">
          <ShieldAlert className="h-6 w-6 text-[#7c6af7]" />
          UBA Profiles
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          User behavioral analytics with risk scoring and anomaly expansion.
        </p>
      </div>

      <DashboardCard className="flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <DashboardCard className="bg-black/20 px-3 py-2">
            <p className="dashboard-card-label">Total Profiles</p>
            <p className="dashboard-metric-value">{summary.total}</p>
          </DashboardCard>
          <DashboardCard className="bg-black/20 px-3 py-2">
            <p className="dashboard-card-label">Critical</p>
            <p className="dashboard-metric-value text-red-300">{summary.critical}</p>
          </DashboardCard>
          <DashboardCard className="bg-black/20 px-3 py-2">
            <p className="dashboard-card-label">High</p>
            <p className="dashboard-metric-value text-orange-300">{summary.high}</p>
          </DashboardCard>
        </div>
      </DashboardCard>

      {!orgLoaded ? (
        <DashboardCard className="text-white/70">Loading organization...</DashboardCard>
      ) : !orgId ? (
        <DashboardCard className="text-white/70">Initializing organization context...</DashboardCard>
      ) : loading ? (
        <DashboardCard className="text-white/70 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading risk profiles...
        </DashboardCard>
      ) : profiles.length === 0 ? (
        <DashboardCard className="text-white/70">No UBA profiles found.</DashboardCard>
      ) : (
        <DashboardCard className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Risk Level</th>
                <th className="px-3 py-2">Risk Score</th>
                <th className="px-3 py-2">Last Anomaly</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {profiles.map((profile) => {
                const expanded = expandedId === profile.id;
                return (
                  <Fragment key={profile.id}>
                    <tr
                      className={`cursor-pointer ${riskTone(profile.risk_level)}`}
                      onClick={() =>
                        setExpandedId(expanded ? null : profile.id)
                      }
                    >
                      <td className="px-3 py-3 font-medium text-white">
                        {profile.user_id}
                      </td>
                      <td className="px-3 py-3 uppercase tracking-widest text-[10px]">
                        {profile.risk_level}
                      </td>
                      <td className="px-3 py-3 text-white">
                        {profile.risk_score}
                      </td>
                      <td className="px-3 py-3 text-white/70">
                        {profile.last_anomaly_at
                          ? new Date(profile.last_anomaly_at).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-black/30">
                        <td colSpan={5} className="px-4 py-4 text-xs text-white/70">
                          <p className="text-[10px] uppercase tracking-widest text-slate-400">
                            Anomaly Details
                          </p>
                          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] text-slate-200">
                            {JSON.stringify(profile.anomalies || [], null, 2)}
                          </pre>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
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
