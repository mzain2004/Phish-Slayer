import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import KpiCards from "./components/KpiCards";
import QuickActionsPanel from "./components/QuickActionsPanel";
import L1AgentStatusWidget from "@/components/dashboard/L1AgentStatusWidget";
import AgentChainStatusWidget from "@/components/dashboard/AgentChainStatusWidget";        
import InfrastructureHealthWidget from "@/components/dashboard/InfrastructureHealthWidget";
import SOCTierBadge from "@/components/soc/SOCTierBadge";
import AgentSwarmPanel from "@/components/soc/AgentSwarmPanel";
import EscalationQueue from "@/components/soc/EscalationQueue";
import Tier0BlockFeed from "@/components/soc/Tier0BlockFeed";
import L1DecisionLog from "@/components/soc/L1DecisionLog";
import NetworkTelemetryChart from "@/components/dashboard/NetworkTelemetryChart";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { ShieldCheck, AlertCircle, Cpu } from "lucide-react";

type ScanRow = {
  target: string | null;
  verdict: string | null;
  date: string | null;
  risk_score: number | null;
};

type IncidentRow = {
  status: string | null;
};

export default async function DashboardOverviewPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const orgId = membership?.organization_id;

  if (!orgId) {
    return <></>;
  }

  // Fetch connector health for blind spot warning
  const { data: connectors } = await supabase
    .from('connector_health')
    .select('connector_name, last_seen')
    .eq('org_id', orgId);

  const silentConnector = connectors?.find(c => {
    const lastSeen = new Date(c.last_seen).getTime();
    const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
    return lastSeen < thirtyMinsAgo;
  });

  const [{ data: scans }, { data: incidents }, { count: intelCount }, { data: orgData }] =
    await Promise.all([
      supabase
        .from("scans")
        .select("target, verdict, date, risk_score")
        .eq("organization_id", orgId)
        .order("date", { ascending: false })
        .limit(100),
      supabase.from("incidents").select("status").eq("organization_id", orgId),
      supabase
        .from("proprietary_intel")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase
        .from("organizations")
        .select("name, risk_score, risk_level")
        .eq("id", orgId)
        .single(),
    ]);

  const scanRows = (scans ?? []) as ScanRow[];
  const incidentRows = (incidents ?? []) as IncidentRow[];

  const totalScans = scanRows.length;
  const maliciousScans = scanRows.filter(
    (scan) => (scan.verdict || "").toLowerCase() === "malicious",
  ).length;
  const activeIncidents = incidentRows.filter(
    (incident) => !(incident.status || "").toLowerCase().includes("resolved"),
  ).length;

  const riskScore = orgData?.risk_score || 0;
  const riskColor = riskScore > 70 ? 'text-red-500' : riskScore > 30 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="flex flex-col gap-6 text-white">
      {silentConnector && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-3 text-red-500 animate-pulse">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">⚠ BLIND SPOT: {silentConnector.connector_name} not reporting</span>
        </div>
      )}

      <DashboardCard className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {orgData?.name || "Command Center"}
            </h1>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-black">
                Autopilot Mode: <span className="text-emerald-400">ACTIVE</span>
                </p>
                <div className="h-1 w-1 rounded-full bg-white/20" />
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-black flex items-center gap-1">
                   <Cpu className="w-3 h-3 text-primary" /> 3 Agents Running
                </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex items-center gap-4">
               <div className={`text-5xl font-black ${riskColor}`}>
                  {riskScore}
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Global Risk</span>
                  <span className={`text-xs font-black uppercase ${riskColor}`}>
                     {orgData?.risk_level || 'LOW'} SECTOR
                  </span>
               </div>
           </div>
           <div className="h-10 w-px bg-white/10 hidden md:block" />
           <SOCTierBadge tier={1} />
        </div>
      </DashboardCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">Total Scans</p>
          <p className="dashboard-metric-value text-white">{totalScans}</p>
        </DashboardCard>
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">Malicious</p>
          <p className="dashboard-metric-value text-red-300">
            {maliciousScans}
          </p>
        </DashboardCard>
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">Incidents</p>
          <p className="dashboard-metric-value text-orange-200">
            {activeIncidents}
          </p>
        </DashboardCard>
        <DashboardCard className="bg-black/20 px-3 py-2">
          <p className="dashboard-card-label">Intel Records</p>
          <p className="dashboard-metric-value text-cyan-200">
            {intelCount ?? 0}
          </p>
        </DashboardCard>
      </div>

      <AgentSwarmPanel />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 flex flex-col gap-6">
          <NetworkTelemetryChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <EscalationQueue />
             <Tier0BlockFeed />
          </div>
          <L1DecisionLog />
        </div>

        <div className="xl:col-span-2 flex flex-col gap-6">
          <QuickActionsPanel />
          <L1AgentStatusWidget />
          <AgentChainStatusWidget />        
          <InfrastructureHealthWidget />
        </div>
      </div>
    </div>
  );
}
