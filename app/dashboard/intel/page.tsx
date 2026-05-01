'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Database, Zap, RefreshCw, AlertTriangle, Search, Filter, ChevronLeft, ChevronRight, Binary, ShieldAlert } from 'lucide-react';
import EmptyState from "@/components/ui/empty-state";
import SkeletonLoader from "@/components/ui/skeleton-loader";

const PAGE_SIZE = 25;

export default function ThreatIntelPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iocs, setIocs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const supabase = createClient();

  const feeds = [
    { name: 'AlienVault OTX', count: '45.2k', status: 'active', lastSync: '12m ago' },
    { name: 'MISP Feed', count: '12.8k', status: 'active', lastSync: '1h ago' },
    { name: 'PhishSlayer Internal', count: '2.4k', status: 'active', lastSync: 'Just now' },
    { name: 'MalwareBazaar', count: '89.1k', status: 'syncing', lastSync: '2m ago' },
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        let query = supabase
          .from('threat_intel')
          .select('id, indicator, type, source, severity, first_seen, last_seen', { count: 'exact' });

        if (typeFilter !== 'all') {
          query = query.eq('type', typeFilter);
        }
        if (severityFilter !== 'all') {
          query = query.eq('severity', severityFilter);
        }

        const { data, error, count } = await query
          .order('last_seen', { ascending: false })
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

        if (error) throw error;
        setIocs(data || []);
        setTotalCount(count || 0);
      } catch (err: any) {
        console.error('Error fetching threat intel:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page, typeFilter, severityFilter]);

  if (loading && page === 1) {
    return <SkeletonLoader />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Threat Intelligence</h1>
        <p className="text-gray-400">Feed sync status and global IOC repository</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard className="flex items-center gap-4 p-5">
          <div className="p-3 rounded-lg bg-white/5 text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="dashboard-card-label">Total IOCs</p>
            <p className="dashboard-metric-value">{totalCount.toLocaleString()}</p>
          </div>
        </DashboardCard>
        <DashboardCard className="flex items-center gap-4 p-5">
          <div className="p-3 rounded-lg bg-white/5 text-green-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="dashboard-card-label">Added Today</p>
            <p className="dashboard-metric-value">1,284</p>
          </div>
        </DashboardCard>
        <DashboardCard className="flex items-center gap-4 p-5">
          <div className="p-3 rounded-lg bg-white/5 text-purple-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="dashboard-card-label">Active Feeds</p>
            <p className="dashboard-metric-value">{feeds.length}</p>
          </div>
        </DashboardCard>
        <DashboardCard className="flex items-center gap-4 p-5">
          <div className="p-3 rounded-lg bg-white/5 text-yellow-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="dashboard-card-label">Last Sync</p>
            <p className="dashboard-metric-value text-xl">Just now</p>
          </div>
        </DashboardCard>
      </div>

      {/* Feed Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {feeds.map((feed, i) => (
          <DashboardCard key={i} className="p-4 bg-white/5 border-white/10 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-bold text-white">{feed.name}</span>
              <span className={`badge ${feed.status === 'active' ? 'badge-clean' : 'badge-info animate-pulse'}`}>
                {feed.status}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#22d3ee] font-mono">{feed.count}</span>
              <span className="text-xs text-gray-500 mt-1">Synced {feed.lastSync}</span>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Filter Bar */}
      <DashboardCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <label htmlFor="intel-search" className="sr-only">Search indicators</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              id="intel-search"
              type="text" 
              placeholder="Search indicators..." 
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#22d3ee]/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg text-sm px-3 py-2 outline-none"
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="ip">IP Address</option>
              <option value="domain">Domain</option>
              <option value="url">URL</option>
              <option value="hash">File Hash</option>
            </select>
            <select 
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg text-sm px-3 py-2 outline-none"
              aria-label="Filter by severity"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            Showing {(page-1)*PAGE_SIZE + 1} - {Math.min(page*PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * PAGE_SIZE >= totalCount}
              className="p-2 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DashboardCard>

      {/* IOC Table */}
      <DashboardCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Indicator</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Source</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">First Seen</th>
                <th className="px-6 py-4 font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {iocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <EmptyState 
                        icon={Binary}
                        title="No threat intel"
                        description="CTI feeds will populate actor profiles and IOCs automatically."
                    />
                  </td>
                </tr>
              ) : (
                iocs.map((ioc) => (
                  <tr key={ioc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-mono text-sm break-all">{ioc.indicator}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#22d3ee] uppercase tracking-widest font-bold">
                        {ioc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {ioc.source}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge flex items-center gap-1 w-fit ${
                        ioc.severity?.toLowerCase() === 'high' ? 'badge-risk' :
                        ioc.severity?.toLowerCase() === 'medium' ? 'badge-medium' :
                        'badge-info'
                      }`}>
                        {ioc.severity?.toLowerCase() === 'high' && <ShieldAlert className="w-3 h-3" aria-hidden="true" />}
                        {ioc.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {ioc.first_seen ? new Date(ioc.first_seen).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {ioc.last_seen ? new Date(ioc.last_seen).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </div>
  );
}
