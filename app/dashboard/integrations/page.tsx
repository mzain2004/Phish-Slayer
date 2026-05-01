"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Plug, ShieldCheck, CheckCircle2, Info } from "lucide-react";
import { useOrganization } from "@clerk/nextjs";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Integration } from "@/lib/integrations/registry";

type MarketplaceIntegration = Integration & {
  is_connected: boolean;
};

type ApiError = {
  error?: string;
};

export default function IntegrationsPage() {
  const { organization, isLoaded } = useOrganization();
  const orgId = organization?.id || null;
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([]);

  const loadIntegrations = useCallback(async () => {
    if (!orgId) {
      setIntegrations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch("/api/integrations/marketplace", {
        method: "GET",
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load integrations");
      }

      setIntegrations(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Unable to load integrations",
      );
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isLoaded) return;
    void loadIntegrations();
  }, [isLoaded, loadIntegrations]);

  const stats = useMemo(() => {
    const connected = integrations.filter(i => i.is_connected).length;
    return { total: integrations.length, connected };
  }, [integrations]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(integrations.map(i => i.category)));
    return cats.sort();
  }, [integrations]);

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div>
        <h1 className="dashboard-page-title flex items-center gap-2 text-white">
          <Plug className="h-6 w-6 text-[#7c6af7]" />
          Integration Marketplace
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Connect your security stack to PhishSlayer for automated detection and response.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard className="border-[#7c6af7]/30 bg-[#0a0a0f] p-4 flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Total Integrations</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <Plug className="h-8 w-8 text-[#7c6af7] opacity-50" />
        </DashboardCard>
        <DashboardCard className="border-[#00d4aa]/30 bg-[#0a0a0f] p-4 flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Connected</p>
                <p className="text-2xl font-bold text-[#00d4aa]">{stats.connected}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-[#00d4aa] opacity-50" />
        </DashboardCard>
        <DashboardCard className="border-white/10 bg-[#0a0a0f] p-4 flex items-center justify-between">
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Categories</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
            <Info className="h-8 w-8 text-slate-400 opacity-50" />
        </DashboardCard>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
            {category.replace('_', ' ')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.filter(i => i.category === category).map(integration => (
              <DashboardCard 
                key={integration.id}
                className={`border-white/10 bg-[#0a0a0f] hover:border-[#7c6af7]/50 transition-colors cursor-pointer group ${integration.is_connected ? 'ring-1 ring-[#00d4aa]/30' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white group-hover:text-[#7c6af7] transition-colors">
                    {integration.name}
                  </h3>
                  {integration.is_connected ? (
                    <StatusBadge status="healthy" label="connected" />
                  ) : integration.status === 'coming_soon' ? (
                    <StatusBadge status="pending" label="soon" />
                  ) : (
                    <StatusBadge status="pending" label={integration.status} />
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 h-8 mb-3">
                  {integration.description}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {integration.vendor}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    integration.required_plan === 'enterprise' ? 'bg-purple-500/10 text-purple-400' :
                    integration.required_plan === 'pro' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {integration.required_plan}
                  </span>
                </div>
              </DashboardCard>
            ))}
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c6af7]" />
        </div>
      )}

      {!loading && integrations.length === 0 && !errorText && (
        <div className="text-center py-20 text-slate-400">
            No integrations found.
        </div>
      )}

      {errorText && (
        <DashboardCard className="border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorText}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
