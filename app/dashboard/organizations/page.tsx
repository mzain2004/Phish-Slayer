'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { Users, Globe, Key, Plus, Settings2, ShieldOff, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState({ name: '', slug: '', plan: 'starter' });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, plan, status, created_at');

      if (error) throw error;
      
      setOrganizations(data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddOrganization = async () => {
    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('organizations')
        .insert([{ ...newOrganization, status: 'active' }])
        .select();

      if (error) throw error;
      
      setIsModalOpen(false);
      setNewOrganization({ name: '', slug: '', plan: 'starter' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Are you sure you want to suspend this organization?')) return;
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'suspended' })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const stats = [
    { label: 'Total Organizations', value: organizations.length, icon: Users, color: 'text-blue-400' },
    { label: 'Active Orgs', value: organizations.filter(o => o.status === 'active').length, icon: Globe, color: 'text-green-400' },
    { label: 'Premium Orgs', value: organizations.filter(o => o.plan !== 'starter').length, icon: Key, color: 'text-purple-400' },
  ];

  if (loading && organizations.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">Organization Management</h1>
          <p className="text-gray-400">SOC multi-tenant portal and API control</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#7c6af7] text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#7c6af7]/90 transition-all shadow-[0_0_20px_rgba(124,106,247,0.2)]"
        >
          <Plus className="w-4 h-4" /> Add Organization
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

      {/* Organizations Table */}
      <DashboardCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Organization Name</th>
                <th className="px-6 py-4 font-semibold">Slug</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No organizations found. Add your first organization to get started.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{org.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500">{org.slug}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs uppercase font-bold tracking-widest text-purple-400">
                        {org.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${
                        org.status === 'active' ? 'badge-clean' : 
                        'badge-risk'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/dashboard/organizations/${org.id}`}
                          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-[#7c6af7] transition-all"
                          title="Manage Organization"
                        >
                          <Settings2 className="w-4 h-4" />
                        </Link>
                        {org.status !== 'suspended' && (
                          <button 
                            onClick={() => handleSuspend(org.id)}
                            className="p-2 bg-white/5 border border-white/10 rounded-lg hover:text-red-400 transition-all"
                            title="Suspend Organization"
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

      {/* Add Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <DashboardCard className="w-full max-w-md p-6 shadow-2xl border-[#7c6af7]/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Add New Organization</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Organization Name</label>
                <input 
                  type="text" 
                  value={newOrganization.name}
                  onChange={(e) => setNewOrganization({ ...newOrganization, name: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-[#7c6af7] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">URL Slug</label>
                <input 
                  type="text" 
                  value={newOrganization.slug}
                  onChange={(e) => setNewOrganization({ ...newOrganization, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="acme-corp"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-[#7c6af7] outline-none transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Subscription Plan</label>
                <select 
                  value={newOrganization.plan}
                  onChange={(e) => setNewOrganization({ ...newOrganization, plan: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-sm focus:border-[#7c6af7] outline-none transition-colors appearance-none"
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
                  disabled={submitting || !newOrganization.name || !newOrganization.slug}
                  onClick={handleAddOrganization}
                  className="flex-1 py-3 bg-[#7c6af7] text-white rounded-xl text-sm font-bold hover:bg-[#7c6af7]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Organization'}
                </button>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  );
}
