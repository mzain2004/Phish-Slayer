"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, Search, Activity, Shield, User, Globe, Hash, Zap } from "lucide-react";
import { toast } from "sonner";
import { Entity360Profile } from "@/lib/l2/entity360";

export default function Entity360Page() {
  const { user } = useUser();
  const [type, setType] = useState('ip');
  const [value, setValue] = useState('');
  const [profile, setProfile] = useState<Entity360Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrg() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (data) setOrgId(data.organization_id);
    }
    loadOrg();
  }, [user]);

  const handleSearch = useCallback(async () => {
    if (!orgId || !value) return;
    setLoading(true);
    try {
      const res = await fetch("/api/entity360", {
        method: "POST",
        body: JSON.stringify({ entityType: type, entityValue: value, organizationId: orgId })
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        toast.error("Failed to fetch profile");
      }
    } catch (error) {
      toast.error("Error searching entity");
    } finally {
      setLoading(false);
    }
  }, [orgId, type, value]);

  return (
    <div className="flex flex-col gap-6 text-white p-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-cyan-400" />
          Entity 360 View
        </h1>
        <p className="text-white/50 text-sm">Deep investigation and cross-entity pivoting</p>
      </div>

      <div className="flex gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xl">
        <select 
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="ip">IP Address</option>
          <option value="user">User ID</option>
          <option value="domain">Domain</option>
          <option value="hash">File Hash</option>
          <option value="email">Email</option>
        </select>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
          <input 
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
            placeholder="Search entity value..."
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Investigate"}
        </button>
      </div>

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          <DashboardCard className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                {profile.entityType === 'ip' ? <Globe className="text-primary" /> : <User className="text-primary" />}
              </div>
              <div>
                <h2 className="text-xl font-bold font-mono">{profile.entityValue}</h2>
                <span className="text-xs text-white/40 uppercase tracking-widest">{profile.entityType}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Risk Score</span>
                <span className={`font-bold ${profile.riskScore > 70 ? 'text-red-400' : profile.riskScore > 30 ? 'text-orange-400' : 'text-green-400'}`}>
                  {profile.riskScore}/100
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${profile.riskScore > 70 ? 'bg-red-500' : profile.riskScore > 30 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${profile.riskScore}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-white/40 mb-1">First Seen</p>
                <p className="font-medium">{profile.firstSeen ? new Date(profile.firstSeen).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-white/40 mb-1">Last Seen</p>
                <p className="font-medium">{profile.lastSeen ? new Date(profile.lastSeen).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard className="lg:col-span-2 p-6 flex flex-col gap-4">
             <h3 className="font-bold flex items-center gap-2">
               <Zap className="w-4 h-4 text-primary" />
               Recent Activity
             </h3>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="text-white/40 border-b border-white/5">
                   <tr>
                     <th className="pb-3 px-2">Time</th>
                     <th className="pb-3 px-2">Event</th>
                     <th className="pb-3 px-2">Severity</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {profile.recentAlerts.map(a => (
                      <tr key={a.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-2 text-white/60">{new Date(a.created_at).toLocaleTimeString()}</td>
                        <td className="py-3 px-2 font-medium">{a.title}</td>
                        <td className="py-3 px-2">
                           <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-bold uppercase">L{a.severity_level}</span>
                        </td>
                      </tr>
                    ))}
                    {profile.recentAlerts.length === 0 && (
                      <tr><td colSpan={3} className="py-10 text-center text-white/20">No recent alerts found.</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
