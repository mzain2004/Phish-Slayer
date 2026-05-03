"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Search } from "lucide-react";
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


type IocRecord = {
  _id?: string;
  id?: string;
  type: string;
  value: string;
  confidence?: number;
  source?: string;
  sources?: string[];
  lastSeen?: string;
};

type LookupResponse = {
  value: string;
  isKnownBad: boolean;
  details?: IocRecord | null;
  enrichment?: {
    vt_score?: number;
    otx_pulse_count?: number;
  };
  error?: string;
};

export default function ThreatIntelPage() {
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;

  const [iocs, setIocs] = useState<IocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchIocs = useCallback(async () => {
    if (!userId || !orgId) {
      setIocs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/tip/iocs", { cache: "no-store" });
      const payload = (await response.json()) as IocRecord[] | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to load IOCs");
      }

      const fetchedIocs = Array.isArray(payload) ? payload : [];
      setIocs(fetchedIocs);

      // FIX 5: If 0 IOCs, trigger seed once
      if (fetchedIocs.length === 0) {
        fetch("/api/admin/seed-iocs", { method: "POST" })
          .then(() => fetchIocs())
          .catch(err => console.error("Auto-seed failed", err));
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unable to load IOCs");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    if (!orgLoaded) return;
    void fetchIocs();
  }, [fetchIocs, orgLoaded]);

  const handleLookup = async () => {
    if (!searchValue.trim()) return;
    setLookupLoading(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/tip/iocs/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: searchValue.trim() }),
      });
      const payload = (await response.json()) as LookupResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Lookup failed");
      }

      setLookupResult(payload);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  const recentIocs = useMemo(() => iocs.slice(0, 10), [iocs]);

  return (
    <div className="flex flex-col gap-6 text-white">
      <div>
        <h1 className="dashboard-page-title text-white">Threat Intel</h1>
        <p className="mt-2 text-sm text-slate-300">
          Search IOCs and monitor recent intelligence feed updates.
        </p>
      </div>

      <DashboardCard className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Lookup IOC (domain, hash, IP)"
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c6af7] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white"
          >
            {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Lookup
          </button>
        </div>

        {lookupResult ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{lookupResult.value}</p>
              <StatusBadge
                status={lookupResult.isKnownBad ? "critical" : "healthy"}
                label={lookupResult.isKnownBad ? "Known Bad" : "No Match"}
              />
            </div>
            <div className="mt-2 text-xs text-white/70">
              <p>VT score: {lookupResult.enrichment?.vt_score ?? 0}</p>
              <p>OTX pulses: {lookupResult.enrichment?.otx_pulse_count ?? 0}</p>
            </div>
            {lookupResult.details ? (
              <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-200">
                {JSON.stringify(lookupResult.details, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </DashboardCard>

      {!orgLoaded ? (
        <DashboardCard className="text-white/70">Loading organization...</DashboardCard>
      ) : !orgId ? (
        <DashboardCard className="text-white/70">Initializing organization context...</DashboardCard>
      ) : loading ? (
        <DashboardCard className="text-white/70 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading recent IOCs...
        </DashboardCard>
      ) : recentIocs.length === 0 ? (
        <DashboardCard className="text-white/70">No IOCs available.</DashboardCard>
      ) : (
        <DashboardCard className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Sources</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recentIocs.map((ioc) => {
                const confidence = Math.min(100, Math.max(0, ioc.confidence || 0));
                return (
                  <tr key={ioc._id || ioc.id || ioc.value}>
                    <td className="px-3 py-3 text-white/80">{ioc.type}</td>
                    <td className="px-3 py-3 text-white break-all">{ioc.value}</td>
                    <td className="px-3 py-3">
                      <div className="h-2 w-full rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-emerald-400"
                          style={{ width: `${confidence}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-white/60">
                      {(ioc.sources || (ioc.source ? [ioc.source] : [])).join(", ") || "N/A"}
                    </td>
                  </tr>
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
