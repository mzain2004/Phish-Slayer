"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Terminal,
  Loader2,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { useOrganization } from "@clerk/nextjs";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import PhishButton from "@/components/ui/PhishButton";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export default function ApiKeysPage() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const orgId = organization?.id;
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const [keyName, setKeyName] = useState("");

  const fetchKeys = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      if (Array.isArray(data)) {
        setKeys(data);
      }
    } catch (err) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgLoaded && orgId) {
      fetchKeys();
    }
  }, [orgLoaded, orgId]);

  const handleGenerate = async () => {
    if (!keyName.trim()) {
      toast.error("Please provide a name for the key");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/settings/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: keyName, scopes: ["all"] }),
        });
        const data = await res.json();
        if (data.key) {
          setNewKey(data.key);
          setKeyName("");
          toast.success("API key generated successfully");
          fetchKeys();
        } else {
          toast.error(data.error || "Failed to generate key");
        }
      } catch (err) {
        toast.error("An error occurred");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this key?")) return;

    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Key revoked");
        setKeys(keys.filter((k) => k.id !== id));
      } else {
        toast.error("Failed to revoke key");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!orgLoaded || (orgId && loading)) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#7c6af7]" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="text-center py-20 text-slate-400">
        Please select an organization to manage API keys.
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full flex flex-col space-y-6">
      <div>
        <h1 className="dashboard-page-title text-white flex items-center gap-3">
          <Key className="w-8 h-8 text-[#7c6af7]" />
          API Keys
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Manage programmatic access to PhishSlayer for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {newKey && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#00d4aa] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  New Key Generated
                </h3>
                <PhishButton 
                  onClick={() => setNewKey(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Dismiss
                </PhishButton>
              </div>
              <p className="text-xs text-slate-300">
                Copy this key now. For security, it will not be shown again.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={newKey}
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-[#00d4aa]"
                />
                <PhishButton
                  onClick={() => handleCopy(newKey)}
                  className="bg-[#00d4aa] text-black px-3 rounded-lg hover:bg-[#00b38f]"
                >
                  <Copy className="w-4 h-4" />
                </PhishButton>
              </div>
            </motion.div>
          )}

          <DashboardCard className="border-white/10 bg-[#0a0a0f]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Active Keys</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key name (e.g. CI/CD)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#7c6af7]"
                />
                <PhishButton
                  onClick={handleGenerate}
                  disabled={isGenerating || !keyName.trim()}
                  className="bg-[#7c6af7] text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#6b5ae6] disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Key
                </PhishButton>
              </div>
            </div>

            <div className="space-y-3">
              {keys.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm italic">
                  No active API keys found.
                </div>
              ) : (
                keys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{key.name}</span>
                        <StatusBadge status={key.is_active ? "healthy" : "pending"} label={key.is_active ? "active" : "inactive"} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <code className="bg-black/30 px-1.5 py-0.5 rounded text-[#7c6af7]">{key.key_prefix}...</code>
                        <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                        {key.last_used_at && (
                          <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <PhishButton
                        onClick={() => handleDelete(key.id)}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </PhishButton>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>
        </div>

        <div className="space-y-6">
          <DashboardCard className="border-white/10 bg-[#0a0a0f]">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#7c6af7]" />
              Quick Start
            </h3>
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Use your API key in the <code className="text-[#7c6af7]">Authorization</code> header as a Bearer token.
              </p>
              <div className="bg-black/50 rounded-lg p-3 border border-white/5">
                <p className="text-[10px] text-slate-500 font-mono mb-2">bash</p>
                <pre className="text-[10px] text-emerald-400 overflow-x-auto">
                  {`curl -H "Authorization: Bearer ps_..." \\
  https://api.phishslayer.com/v1/alerts`}
                </pre>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard className="border-[#7c6af7]/20 bg-[#7c6af7]/5">
            <h3 className="text-sm font-bold text-white mb-2">Security Note</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              API keys provide full access to your organization's data. 
              Never commit them to version control or share them in client-side code.
              Revoke compromised keys immediately.
            </p>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
