"use client";

import { useEffect, useState } from "react";
import { Grid, Search, Loader2, ArrowUpRight, Shield, Settings, Box } from "lucide-react";
import { useOrganization } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import PhishButton from "@/components/ui/PhishButton";
import { getAllIntegrations } from "@/lib/integrations/registry";

export default function IntegrationsMarketplacePage() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const orgId = organization?.id || null;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const supabase = createClient();

  const integrations = getAllIntegrations();

  useEffect(() => {
    async function loadStatus() {
      if (!orgId) {
        setLoading(false);
        return;
      }
      try {
        const { data: connectors } = await supabase
          .from('connectors')
          .select('connector_type')
          .eq('organization_id', orgId);
        
        if (connectors) {
          setConnectedIds(connectors.map(c => c.connector_type));
        }
      } catch (err) {
        console.error("Failed to load connector status", err);
      } finally {
        setLoading(false);
      }
    }

    if (orgLoaded) {
      loadStatus();
    }
  }, [orgId, orgLoaded, supabase]);

  const filteredIntegrations = integrations.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!orgLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="dashboard-page-title text-white flex items-center gap-3">
            <Grid className="w-8 h-8 text-primary" />
            Integrations Marketplace
          </h1>
          <p className="text-slate-400 mt-1">
            Connect your existing security stack to supercharge PhishSlayer automation.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search integrations..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => {
          const isConnected = connectedIds.includes(integration.id);
          return (
            <DashboardCard key={integration.id} className="group hover:border-primary/30 transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Box className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-tight">{integration.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{integration.vendor}</p>
                  </div>
                </div>
                {isConnected ? (
                   <StatusBadge status="healthy" label="Connected" />
                ) : integration.status === 'beta' ? (
                   <StatusBadge status="pending" label="Beta" />
                ) : integration.status === 'coming_soon' ? (
                   <StatusBadge status="idle" label="Soon" />
                ) : null}
              </div>

              <p className="text-sm text-slate-300 line-clamp-2 mb-6 flex-1">
                {integration.description}
              </p>

              <div className="flex items-center gap-2 mb-6">
                 {integration.capabilities.slice(0, 3).map(cap => (
                    <span key={cap} className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                        {cap.replace(/_/g, ' ')}
                    </span>
                 ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                 <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Shield className="w-3.5 h-3.5" />
                    <span>{integration.required_plan.toUpperCase()}</span>
                 </div>
                 
                 {isConnected ? (
                   <PhishButton className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                      <Settings className="w-3 h-3" /> Configure
                   </PhishButton>
                 ) : (
                   <PhishButton 
                     disabled={integration.status === 'coming_soon'}
                     className="text-xs bg-primary hover:bg-primary/80 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold disabled:opacity-50"
                   >
                      Connect <ArrowUpRight className="w-3 h-3" />
                   </PhishButton>
                 )}
              </div>
            </DashboardCard>
          );
        })}
      </div>
    </div>
  );
}
