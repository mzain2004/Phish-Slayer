'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Users, Globe, Key, Plus, Settings2, ShieldOff, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function TenantsPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: '', slug: '', plan: 'starter' });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, plan, status, created_at');

      if (error) throw error;
      
      // In a real scenario, we'd join with whitelabel_api_keys count
      // Mocking count for now
      const tenantsWithCount = (data || []).map(t => ({ ...t, api_keys_count: Math.floor(Math.random() * 5) }));
      setTenants(tenantsWithCount);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTenant = async () => {
    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('tenants')
        .insert([{ ...newTenant, status: 'active' }])
        .select();

      if (error) throw error;
      
      setIsModalOpen(false);
      setNewTenant({ name: '', slug: '', plan: 'starter' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this tenant?')) return;
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: 'suspended' })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const stats = [
    { label: 'Total Tenants', value: tenants.length, icon: Users, color: 'text-blue-400' },
    { label: 'Active Tenants', value: tenants.filter(t => t.status === 'active').length, icon: Globe, color: 'text-green-400' },
    { label: 'Total API Keys', value: tenants.reduce((acc, t) => acc + (t.api_keys_count || 0), 0), icon: Key, color: 'text-purple-400' },
  ];

  if (loading && tenants.length === 0) {
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenant Management</h1>
          <p className="text-gray-400">MSSP multi-tenant portal and API control</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#22d3ee] text-[#0a0a0a] rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#22d3ee]/90 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
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

      {/* Tenants Table */}
      <DashboardCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Tenant Name</th>
                <th className="px-6 py-4 font-semibold">Slug</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold">API Keys</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No tenants found. Add your first tenant to get started.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{tenant.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500">{tenant.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs uppercase font-bold tracking-widest text-purple-400">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        tenant.status === 'active' ? 'badge-clean' : 
                        'badge-risk'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-white font-mono">{tenant.api_keys_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/tenants/${tenant.id}`}
                          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-[#22d3ee] transition-all"
                          title="Manage Tenant"
                        >
                          <Settings2 className="w-4 h-4" />
                        </Link>
                        {tenant.status !== 'suspended' && (
                          <button 
                            onClick={() => handleSuspend(tenant.id)}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-red-400 transition-all"
                            title="Suspend Tenant"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Add Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <DashboardCard className="w-full max-w-md p-6 shadow-2xl border-[#22d3ee]/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New Tenant</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Tenant Name</label>
                <input 
                  type="text" 
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">URL Slug</label>
                <input 
                  type="text" 
                  value={newTenant.slug}
                  onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="acme-corp"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Subscription Plan</label>
                <select 
                  value={newTenant.plan}
                  onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-sm focus:border-[#22d3ee] outline-none transition-colors appearance-none"
                >
                  <option value="starter">Starter - $99/mo</option>
                  <option value="professional">Professional - $299/mo</option>
                  <option value="enterprise">Enterprise - Custom</option>
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting || !newTenant.name || !newTenant.slug}
                  onClick={handleAddTenant}
                  className="flex-1 py-3 bg-[#22d3ee] text-[#0a0a0a] rounded-xl text-sm font-bold hover:bg-[#22d3ee]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Tenant'}
                </button>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
