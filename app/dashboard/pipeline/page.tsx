'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { GitBranch, CheckCircle2, XCircle, Clock, Eye, RefreshCw, Loader2 } from 'lucide-react';

export default function PipelinePage() {
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  async function fetchData() {
    try {
      const { data, error } = await supabase
        .from('pipeline_runs')
        .select('id, trigger, status, started_at, duration_ms, actions_taken, full_log')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRuns(data || []);
    } catch (err) {
      console.error('Error fetching pipeline runs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      refreshInterval.current = setInterval(fetchData, 30000);
    } else if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
    }
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [autoRefresh]);

  const stats = [
    { label: 'Total Runs', value: runs.length, icon: GitBranch, color: 'text-blue-400' },
    { label: 'Successful', value: runs.filter(r => r.status === 'success').length, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Failed', value: runs.filter(r => r.status === 'failed').length, icon: XCircle, color: 'text-red-400' },
    { 
      label: 'Avg Processing', 
      value: runs.length > 0 ? `${Math.round(runs.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / runs.length / 1000)}s` : '0s', 
      icon: Clock, 
      color: 'text-purple-400' 
    },
  ];

  if (loading && runs.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
          ))}
        </div>
        <div className="h-96 bg-white/5 rounded-xl border border-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Autonomous Pipeline</h1>
          <p className="text-gray-400">Audit trail for all autonomous triage and response actions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Auto-Refresh</span>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-8 h-4 rounded-full transition-colors relative ${autoRefresh ? 'bg-[#22d3ee]' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoRefresh ? 'left-4.5' : 'left-0.5'}`} />
            </button>
          </div>
          <button 
            onClick={() => { setLoading(true); fetchData(); }}
            className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Runs Table */}
        <DashboardCard className={`overflow-hidden lg:col-span-2 ${selectedRun ? 'hidden lg:block' : ''}`}>
          <div className="p-6 border-b border-white/10">
            <h2 className="dashboard-section-heading">Recent Pipeline Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Trigger</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Started At</th>
                  <th className="px-6 py-4 font-semibold">Duration</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No pipeline runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr 
                      key={run.id} 
                      className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedRun?.id === run.id ? 'bg-white/5' : ''}`}
                      onClick={() => setSelectedRun(run)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium text-sm">{run.trigger}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{run.id.slice(0, 12)}...</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          run.status === 'success' ? 'badge-clean' : 
                          run.status === 'failed' ? 'badge-risk' : 
                          'badge-info'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(run.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-white font-mono">
                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-[#22d3ee] hover:text-[#22d3ee]/80">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        {/* Detail Panel */}
        <div className={`${selectedRun ? 'block' : 'hidden'} lg:block`}>
          <DashboardCard className="h-full flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="dashboard-section-heading">Run Details</h2>
              {selectedRun && (
                <button onClick={() => setSelectedRun(null)} className="lg:hidden text-gray-400 hover:text-white">
                  Close
                </button>
              )}
            </div>
            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
              {!selectedRun ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4 text-center">
                  <div className="p-4 rounded-full bg-white/5">
                    <Eye className="w-8 h-8" />
                  </div>
                  <p className="text-sm">Select a pipeline run to view detailed logs and autonomous actions taken.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest text-gray-500">Actions Taken</span>
                      <span className="text-xs font-mono text-[#22d3ee]">{selectedRun.actions_taken?.length || 0} Steps</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRun.actions_taken?.map((action: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-[#22d3ee]/10 text-[#22d3ee] text-[10px] rounded border border-[#22d3ee]/20">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 overflow-hidden mt-4">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Full Execution Log</span>
                    <pre className="flex-1 p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-cyan-100/70 overflow-y-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedRun.full_log || { message: "No log data available" }, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
