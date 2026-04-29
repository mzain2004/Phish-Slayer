"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import DashboardCard from "@/components/dashboard/DashboardCard";
import { Loader2, Plus, Trash2, ShieldOff } from "lucide-react";
import { toast } from "sonner";

type SuppressionRule = {
  id: string;
  name: string;
  rule_type: string;
  match_value: string;
  time_start: string | null;
  time_end: string | null;
  is_active: boolean;
  hit_count: number;
  created_at: string;
};

export default function SuppressionRulesPage() {
  const { user } = useUser();
  const [rules, setRules] = useState<SuppressionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    rule_type: "ip",
    match_value: "",
    time_start: "",
    time_end: ""
  });

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
      if (data) {
        setOrgId(data.organization_id);
        fetchRules(data.organization_id);
      }
    }
    loadOrg();
  }, [user]);

  async function fetchRules(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/suppression-rules?organization_id=${id}`);
      const data = await res.json();
      setRules(data);
    } catch (error) {
      toast.error("Failed to load rules");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRule() {
    if (!orgId) return;
    try {
      const res = await fetch("/api/suppression-rules", {
        method: "POST",
        body: JSON.stringify({ ...newRule, organization_id: orgId })
      });
      if (res.ok) {
        toast.success("Rule added");
        setIsModalOpen(false);
        fetchRules(orgId);
      }
    } catch (error) {
      toast.error("Failed to add rule");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/suppression-rules/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rule deleted");
        if (orgId) fetchRules(orgId);
      }
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/suppression-rules/${id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: !current })
      });
      if (res.ok) {
        if (orgId) fetchRules(orgId);
      }
    } catch (error) {
      toast.error("Failed to update rule");
    }
  }

  return (
    <div className="flex flex-col gap-6 text-white p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldOff className="text-purple-400" />
            Suppression Rules
          </h1>
          <p className="text-white/50 text-sm">Manage automatic alert silencing</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <DashboardCard className="overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : rules.length === 0 ? (
          <div className="p-20 text-center text-white/40">No suppression rules found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-white/70 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Hits</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{rule.name}</td>
                    <td className="px-6 py-4"><span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded text-xs">{rule.rule_type}</span></td>
                    <td className="px-6 py-4 text-sm font-mono text-cyan-300">{rule.match_value || "-"}</td>
                    <td className="px-6 py-4 text-sm">{rule.hit_count}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleActive(rule.id, rule.is_active)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${rule.is_active ? 'bg-green-500' : 'bg-white/20'}`}
                      >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${rule.is_active ? 'right-1' : 'left-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(rule.id)} className="text-white/40 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <DashboardCard className="w-full max-w-md p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold">Add Suppression Rule</h2>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">Rule Name</label>
              <input 
                className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                value={newRule.name}
                onChange={e => setNewRule({...newRule, name: e.target.value})}
                placeholder="e.g. Suppress Scanner IP"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-white/60">Match Type</label>
              <select 
                className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                value={newRule.rule_type}
                onChange={e => setNewRule({...newRule, rule_type: e.target.value})}
              >
                <option value="ip">Source IP</option>
                <option value="domain">Domain</option>
                <option value="severity">Max Severity</option>
                <option value="rule_name">Rule Name (Title)</option>
                <option value="time_window">Time Window</option>
              </select>
            </div>

            {newRule.rule_type !== 'time_window' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">Match Value</label>
                <input 
                  className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none focus:border-primary"
                  value={newRule.match_value}
                  onChange={e => setNewRule({...newRule, match_value: e.target.value})}
                  placeholder="Value to match"
                />
              </div>
            )}

            {newRule.rule_type === 'time_window' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Start Time</label>
                  <input type="time" className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none" 
                    value={newRule.time_start} onChange={e => setNewRule({...newRule, time_start: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">End Time</label>
                  <input type="time" className="bg-white/5 border border-white/10 rounded-lg p-2 text-sm outline-none" 
                    value={newRule.time_end} onChange={e => setNewRule({...newRule, time_end: e.target.value})} />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddRule}
                className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-all font-semibold"
              >
                Create Rule
              </button>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
