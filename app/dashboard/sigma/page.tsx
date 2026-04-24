'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Shield, CheckCircle2, Clock, Terminal, Rocket, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function SigmaRulesPage() {
  const [loading, setLoading] = useState(true);
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sigma_rules')
          .select('id, name, severity, status, created_at, source_alert_id, yaml_content')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRules(data || []);
      } catch (err: any) {
        console.error('Error fetching sigma rules:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleDeploy = async (id: string) => {
    try {
      setDeployingId(id);
      const response = await fetch('/api/sigma/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: id }),
      });

      if (!response.ok) throw new Error('Failed to deploy rule');

      // Update local state
      setRules(rules.map(r => r.id === id ? { ...r, status: 'deployed' } : r));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeployingId(null);
    }
  };

  const stats = [
    { label: 'Total Rules', value: rules.length, icon: Shield, color: 'text-blue-400' },
    { label: 'Deployed Rules', value: rules.filter(r => r.status === 'deployed').length, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Pending Deploy', value: rules.filter(r => r.status === 'pending').length, icon: Clock, color: 'text-yellow-400' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Sigma Rules</h1>
        <p className="text-gray-400">Auto-generated detection rules from autonomous triage</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Rules Table */}
      <DashboardCard className="overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="dashboard-section-heading">Rule Repository</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Rule Name</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No sigma rules generated yet.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <React.Fragment key={rule.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Terminal className="w-4 h-4 text-[#22d3ee]" />
                          <span className="font-medium text-white">{rule.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          rule.severity?.toLowerCase() === 'critical' || rule.severity?.toLowerCase() === 'high' ? 'badge-risk' :
                          rule.severity?.toLowerCase() === 'medium' ? 'badge-medium' :
                          'badge-info'
                        }`}>
                          {rule.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          rule.status === 'deployed' ? 'badge-clean' : 
                          rule.status === 'pending' ? 'badge-info' : 
                          'badge-offline'
                        }`}>
                          {rule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                        {new Date(rule.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {rule.status === 'pending' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeploy(rule.id); }}
                              disabled={deployingId === rule.id}
                              className="p-2 bg-[#22d3ee]/10 text-[#22d3ee] rounded-md hover:bg-[#22d3ee]/20 transition-colors disabled:opacity-50"
                              title="Deploy Rule"
                            >
                              {deployingId === rule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-white transition-colors">
                            {expandedId === rule.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === rule.id && (
                      <tr className="bg-black/40">
                        <td colSpan={5} className="px-6 py-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-widest text-[#22d3ee]">Rule YAML Definition</span>
                              <span className="text-xs text-gray-500 font-mono">Source Alert: {rule.source_alert_id || 'N/A'}</span>
                            </div>
                            <pre className="p-4 bg-black/60 rounded-lg border border-white/5 font-mono text-xs text-cyan-100/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                              {rule.yaml_content || '# No YAML content available for this rule.'}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}

// Need to import React for React.Fragment
import React from 'react';
