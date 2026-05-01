"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, Shield, Rocket, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useOrganization } from "@clerk/nextjs";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import PhishButton from "@/components/ui/PhishButton";

type Plan = "free" | "pro" | "enterprise";

type UsageData = {
  plan: Plan;
  limits: Record<string, number>;
  usage: Array<{
    metric: string;
    count: number;
    period_start: string;
    period_end: string;
  }>;
};

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ["100 alerts/day", "5 concurrent agents", "30 days retention", "3 connectors"],
  pro: ["10,000 alerts/day", "20 concurrent agents", "90 days retention", "10 connectors", "OSINT Brand Monitor", "Malware Sandbox"],
  enterprise: ["Unlimited alerts", "100 concurrent agents", "365 days retention", "Unlimited connectors", "Dark Web Monitoring", "Priority Support"],
};

export default function BillingPage() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const orgId = organization?.id;
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    async function loadUsage() {
      if (!orgId) return;
      try {
        const response = await fetch("/api/settings/usage", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load usage stats");
        const data = await response.json();
        setUsage(data);
      } catch (error) {
        toast.error("Failed to load billing information");
      } finally {
        setLoading(false);
      }
    }

    if (orgLoaded && orgId) {
      void loadUsage();
    } else if (orgLoaded && !orgId) {
      setLoading(false);
    }
  }, [orgLoaded, orgId]);

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || "Failed to initiate checkout");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
      setUpgrading(null);
    }
  };

  if (!orgLoaded || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7c6af7]" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="text-center py-20 text-slate-400">
        Please select an organization to view billing.
      </div>
    );
  }

  const currentPlan = usage?.plan || 'free';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="dashboard-page-title text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#7c6af7]" />
            Subscription & Usage
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your plan, limits, and billing details for <strong>{organization.name}</strong>.
          </p>
        </div>
        
        {currentPlan !== 'free' && (
            <PhishButton className="bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Customer Portal
            </PhishButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <DashboardCard className="lg:col-span-1 border-[#7c6af7]/30 bg-[#7c6af7]/5 p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-xs font-bold text-[#7c6af7] uppercase tracking-[0.2em] mb-1">Current Plan</p>
                    <h2 className="text-3xl font-black text-white uppercase">{currentPlan}</h2>
                </div>
                <StatusBadge status="healthy" label="Active" />
            </div>
            
            <div className="space-y-4 mb-8 flex-1">
                {PLAN_FEATURES[currentPlan].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-[#00d4aa]" />
                        {feature}
                    </div>
                ))}
            </div>

            {currentPlan === 'enterprise' ? (
                <div className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-center">
                    <p className="text-[#00d4aa] font-bold text-sm">You're on the best plan 🚀</p>
                </div>
            ) : (
                <p className="text-xs text-slate-500 text-center italic">Upgrade to unlock advanced autonomous capabilities.</p>
            )}
        </DashboardCard>

        {/* Usage Stats */}
        <DashboardCard className="lg:col-span-2 border-white/10 bg-[#0a0a0f] p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Usage this period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usage?.usage.map((u) => {
                    const limit = usage.limits[u.metric] || 0;
                    const percent = limit > 0 ? Math.min(100, (u.count / limit) * 100) : 0;
                    return (
                        <div key={u.metric} className="p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{u.metric.replace(/_/g, ' ')}</p>
                                <p className="text-sm font-mono">
                                    <span className="text-white font-bold">{u.count}</span>
                                    <span className="text-slate-500"> / {limit === -1 || limit === 0 ? '∞' : limit}</span>
                                </p>
                            </div>
                            {limit > 0 && (
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-[#7c6af7]'}`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                {(!usage?.usage || usage.usage.length === 0) && (
                    <div className="col-span-2 py-10 text-center text-slate-500 italic text-sm">
                        No usage data recorded for this period yet.
                    </div>
                )}
            </div>
        </DashboardCard>
      </div>

      {/* Upgrade Options */}
      {currentPlan !== 'enterprise' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPlan === 'free' && (
                <DashboardCard className="p-8 border-white/10 bg-white/5 hover:border-[#7c6af7]/50 transition-all group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-[#7c6af7]/20 group-hover:scale-110 transition-transform">
                            <Shield className="w-8 h-8 text-[#7c6af7]" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white">SOC Pro</h3>
                            <p className="text-[#7c6af7] font-bold">$49/mo per org</p>
                        </div>
                    </div>
                    <ul className="space-y-3 mb-8">
                        {PLAN_FEATURES.pro.map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-slate-400">
                                <ArrowRight className="w-3 h-3 text-[#7c6af7]" />
                                {f}
                            </li>
                        ))}
                    </ul>
                    <PhishButton 
                        onClick={() => handleUpgrade('pro')}
                        disabled={!!upgrading}
                        className="w-full bg-[#7c6af7] text-white py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition-all"
                    >
                        {upgrading === 'pro' ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Upgrade to Pro"}
                    </PhishButton>
                </DashboardCard>
            )}

            <DashboardCard className="p-8 border-[#00d4aa]/30 bg-[#00d4aa]/5 hover:border-[#00d4aa] transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <span className="bg-[#00d4aa] text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">Recommended</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-[#00d4aa]/20 group-hover:scale-110 transition-transform">
                        <Rocket className="w-8 h-8 text-[#00d4aa]" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white">Enterprise</h3>
                        <p className="text-[#00d4aa] font-bold">$199/mo per org</p>
                    </div>
                </div>
                <ul className="space-y-3 mb-8">
                    {PLAN_FEATURES.enterprise.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-400">
                            <ArrowRight className="w-3 h-3 text-[#00d4aa]" />
                            {f}
                        </li>
                    ))}
                </ul>
                <PhishButton 
                    onClick={() => handleUpgrade('enterprise')}
                    disabled={!!upgrading}
                    className="w-full bg-[#00d4aa] text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition-all"
                >
                    {upgrading === 'enterprise' ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Go Enterprise"}
                </PhishButton>
            </DashboardCard>
        </div>
      )}
    </div>
  );
}
