'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Target, Activity, AlertCircle, ShieldAlert, Loader2, Crosshair } from 'lucide-react';
import EmptyState from "@/components/ui/empty-state";

export default function ThreatHuntingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [missionsRes, findingsRes] = await Promise.all([
          supabase.from('hunt_missions').select('id, name, hypothesis, status, started_at, findings_count').order('started_at', { ascending: false }),
          supabase.from('hunt_findings').select('id, mission_id, title, severity, created_at').order('created_at', { ascending: false }).limit(10)
        ]);

        if (missionsRes.error) throw missionsRes.error;
        if (findingsRes.error) throw findingsRes.error;

        setMissions(missionsRes.data || []);
        setFindings(findingsRes.data || []);
      } catch (err: any) {
        console.error('Error fetching hunting data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const stats = [
    { label: 'Total Missions', value: missions.length, icon: Target, color: 'text-blue-400' },
    { label: 'Active Missions', value: missions.filter(m => m.status === 'active').length, icon: Activity, color: 'text-green-400' },
    { label: 'Findings This Week', value: findings.length, icon: AlertCircle, color: 'text-yellow-400' },
    { label: 'High Severity', value: findings.filter(f => ['high', 'critical'].includes(f.severity?.toLowerCase())).length, icon: ShieldAlert, color: 'text-red-400' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-xl border border-white/10" />
        <div className="h-64 bg-white/5 rounded-xl border border-white/10" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-xl text-red-400">
        <h3 className="font-bold mb-2">Error loading threat hunting data</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Threat Hunting</h1>
        <p className="text-gray-400">Active hunt missions and findings</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <DashboardCard key={i} className="flex items-center gap-4 p-5">
            <div className={`p-3 rounded-lg bg-white/5 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="dashboard-card-label">{stat.label}</p>
              <p className="dashboard-metric-value">{stat.value}</p>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Hunt Missions Table */}
      <DashboardCard className="overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="dashboard-section-heading">Hunt Missions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Mission Name</th>
                <th className="px-6 py-4 font-semibold">Hypothesis</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Started At</th>
                <th className="px-6 py-4 font-semibold">Findings</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {missions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <EmptyState 
                        icon={Crosshair}
                        title="No hunt hypotheses"
                        description="L3 agent generates hunt hypotheses from threat intel."
                        actionLabel="Generate Now"
                        actionOnClick={() => fetch('/api/hunting/generate', { method: 'POST' })}
                    />
                  </td>
                </tr>
              ) : (
                missions.map((mission) => (
                  <tr key={mission.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{mission.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-[200px]">{mission.hypothesis}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        mission.status === 'active' ? 'badge-info' : 
                        mission.status === 'completed' ? 'badge-clean' : 
                        'badge-offline'
                      }`}>
                        {mission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(mission.started_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-mono">
                      {mission.findings_count || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#22d3ee] hover:underline text-sm font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Findings Panel */}
      <DashboardCard className="overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="dashboard-section-heading">Recent Findings</h2>
        </div>
        <div className="divide-y divide-white/5">
          {findings.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No findings recorded yet.
            </div>
          ) : (
            findings.map((finding) => (
              <div key={finding.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col gap-1">
                  <span className="text-white font-medium">{finding.title}</span>
                  <span className="text-xs text-gray-500 font-mono">ID: {finding.id.slice(0, 8)} • {new Date(finding.created_at).toLocaleString()}</span>
                </div>
                <span className={`badge ${
                  finding.severity?.toLowerCase() === 'critical' || finding.severity?.toLowerCase() === 'high' ? 'badge-risk' :
                  finding.severity?.toLowerCase() === 'medium' ? 'badge-medium' :
                  'badge-info'
                }`}>
                  {finding.severity}
                </span>
              </div>
            ))
          )}
        </div>
      </DashboardCard>
    </div>
  );
}
