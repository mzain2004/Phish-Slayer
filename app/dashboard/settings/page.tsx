"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Copy,
  Plus,
  Loader2,
  Trash2,
  ListPlus
} from "lucide-react";
import { getUser, updateSettings } from "@/lib/supabase/auth-actions";
import { getWhitelist, removeFromWhitelist } from "@/lib/supabase/actions";

export default function PlatformSettingsPage() {
  const [orgName, setOrgName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [ipWhitelisting, setIpWhitelisting] = useState(false);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Promise.all([
      getUser().then((user) => {
        if (user) {
          setOrgName(user.orgName);
          setSupportEmail(user.supportEmail || user.email);
          setTwoFactor(user.twoFactor);
          setSessionTimeout(user.sessionTimeout);
          setIpWhitelisting(user.ipWhitelisting);
        }
      }),
      getWhitelist().then((data: any[]) => setWhitelist(data))
    ]).finally(() => {
      setLoaded(true);
    });
  }, []);

  const handleRemoveFromWhitelist = (id: string) => {
    startTransition(async () => {
      try {
        await removeFromWhitelist(id);
        const data = await getWhitelist();
        setWhitelist(data);
        toast.success("Target removed from whitelist.");
      } catch (err: any) {
        toast.error(err.message || "Failed to remove target.");
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSettings({
        orgName,
        supportEmail,
        twoFactor,
        sessionTimeout,
        ipWhitelisting,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-transparent text-slate-900 font-sans min-h-screen flex flex-col w-full overflow-x-hidden">

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Manage your organization&apos;s preferences, security policies, and team access.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Main Panel */}
          <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Section: Organization Profile */}
            <div className="p-6 md:p-8 border-b border-slate-100">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Organization Profile</h3>
                    <p className="text-sm text-slate-500 mt-1">Update your company details and public profile.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Organization Name</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 sm:text-sm py-2.5 px-3"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Support Email</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 sm:text-sm py-2.5 px-3"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Logo</label>
                    <div className="mt-1 flex items-center gap-4">
                      <span className="inline-block h-12 w-12 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        <svg className="h-full w-full text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                      </span>
                      <button 
                        onClick={() => toast.info("Feature coming in v2.0")}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50" 
                        type="button"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Security Preferences */}
            <div className="p-6 md:p-8 border-b border-slate-100">
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Security Preferences</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage login requirements and session timeouts.</p>
                </div>
                <div className="space-y-4">
                  {/* Toggle Item 1 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">Two-Factor Authentication (2FA)</span>
                      <span className="text-sm text-slate-500">Enforce 2FA for all team members.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={twoFactor}
                        onChange={(e) => setTwoFactor(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  {/* Toggle Item 2 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">Session Timeout</span>
                      <span className="text-sm text-slate-500">Automatically log out inactive users after 30 minutes.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <div className="border-t border-slate-100"></div>

                  {/* Toggle Item 3 */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">IP Whitelisting</span>
                      <span className="text-sm text-slate-500">Only allow access from specific IP addresses.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={ipWhitelisting}
                        onChange={(e) => setIpWhitelisting(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-600/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: API Configuration */}
            <div className="p-6 md:p-8 border-b border-slate-100">
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">API Configuration</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage API keys for external integrations.</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Production Key</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 truncate flex-1">
                        pk_live_51Msz...234xS92
                      </code>
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400">Last used: 2 hours ago</span>
                  </div>
                  <button 
                    onClick={() => toast.info("Feature coming in v2.0")}
                    className="text-sm font-medium text-red-600 hover:text-red-700 whitespace-nowrap"
                  >
                    Revoke
                  </button>
                </div>

                <button 
                  onClick={() => toast.info("Feature coming in v2.0")}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:text-teal-600 hover:border-teal-600 hover:bg-teal-600/5 transition-all text-sm font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Generate New API Key
                </button>
              </div>
            </div>

            {/* Section: Target Whitelist */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-teal-900 flex items-center gap-2">
                      <ListPlus className="w-5 h-5 text-teal-600" />
                      Target Whitelist
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Manage domains and IPs bypassing threat scans.</p>
                  </div>
                </div>
                
                {whitelist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    <ListPlus className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-medium text-slate-600">No targets whitelisted yet.</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Targets added to the whitelist from the Threat Intelligence dashboard will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target</span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Added</span>
                    </div>
                    <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                      {whitelist.map((item) => (
                        <li key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{item.target}</span>
                            <span className="text-xs text-slate-500 mt-0.5">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveFromWhitelist(item.id)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Save Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-teal-400 to-blue-500 rounded-lg shadow-sm hover:shadow-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all border-none"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
