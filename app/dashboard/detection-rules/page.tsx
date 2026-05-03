"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, Loader2, Plus, ShieldCheck } from "lucide-react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import DashboardCard from "@/components/dashboard/DashboardCard";
import StatusBadge from "@/components/dashboard/StatusBadge";

// Helper to get client-side cookie
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}


type DetectionRule = {
  id: string;
  name: string;
  type: "sigma" | "yara" | "custom";
  rule_content: string;
  severity: string;
  hit_count: number;
  is_active: boolean;
  mitre_technique?: string | null;
  created_at?: string | null;
};

type TestResult = {
  matched: boolean;
  details?: unknown;
  error?: string;
};

export default function DetectionRulesPage() {
  const { userId } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const searchParams = useSearchParams();
  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;

  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [testRule, setTestRule] = useState<DetectionRule | null>(null);
  const [sampleJson, setSampleJson] = useState("{\n  \"event\": \"example\"\n}");
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "sigma" as "sigma" | "yara" | "custom",
    severity: "medium",
    ruleContent: "",
    mitre: "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!userId || !orgId) {
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      const response = await fetch("/api/detection-rules", { cache: "no-store" });
      const payload = (await response.json()) as DetectionRule[] | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Failed to load rules");
      }

      const filtered = Array.isArray(payload)
        ? payload.filter((rule) => rule)
        : [];
      setRules(filtered);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Unable to load rules");
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => {
    if (!orgLoaded) return;
    void fetchRules();
  }, [fetchRules, orgLoaded]);

  const handleToggle = async (rule: DetectionRule) => {
    setErrorText(null);
    const nextValue = !rule.is_active;
    setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, is_active: nextValue } : item)));
    try {
      const response = await fetch(`/api/detection-rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextValue }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to update rule");
      }
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Failed to update rule");
      setRules((prev) => prev.map((item) => (item.id === rule.id ? { ...item, is_active: rule.is_active } : item)));
    }
  };

  const handleCreate = async () => {
    if (!orgId) return;
    setSaving(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/detection-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          rule_content: form.ruleContent,
          organization_id: orgId,
          severity: form.severity,
          mitre_technique: form.mitre || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create rule");
      }

      setNewRuleOpen(false);
      setForm({ name: "", type: "sigma", severity: "medium", ruleContent: "", mitre: "" });
      await fetchRules();
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Failed to create rule");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testRule) return;
    setTesting(true);
    setTestResult(null);

    try {
      const parsed = JSON.parse(sampleJson);
      const response = await fetch(`/api/detection-rules/${testRule.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleAlert: parsed }),
      });
      const payload = (await response.json()) as TestResult | { error?: string };

      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Test failed");
      }

      setTestResult(payload as TestResult);
    } catch (error) {
      setTestResult({ matched: false, error: error instanceof Error ? error.message : "Invalid JSON" });
    } finally {
      setTesting(false);
    }
  };

  const activeCount = useMemo(() => rules.filter((rule) => rule.is_active).length, [rules]);

  return (
    <div className="flex flex-col gap-6 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="dashboard-page-title text-white">Detection Rules</h1>
          <p className="text-sm text-slate-300">Manage Sigma and YARA rules powering detections.</p>
        </div>
        <button
          type="button"
          onClick={() => setNewRuleOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#7c6af7] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white"
        >
          <Plus className="h-4 w-4" />
          New Rule
        </button>
      </div>

      <DashboardCard className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Active Rules</p>
          <p className="text-lg font-semibold text-white">{activeCount}</p>
        </div>
        <ShieldCheck className="h-6 w-6 text-emerald-300" />
      </DashboardCard>

      {!orgLoaded ? (
        <DashboardCard className="text-white/70">Loading organization...</DashboardCard>
      ) : !orgId ? (
        <DashboardCard className="text-white/70">Initializing organization context...</DashboardCard>
      ) : loading ? (
        <DashboardCard className="text-white/70 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading detection rules...
        </DashboardCard>
      ) : rules.length === 0 ? (
        <DashboardCard className="text-white/70">No detection rules found.</DashboardCard>
      ) : (
        <DashboardCard className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="px-3 py-2">Rule</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Hits</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-white">{rule.name}</p>
                    {rule.mitre_technique ? (
                      <p className="text-[10px] text-slate-400">MITRE {rule.mitre_technique}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status="pending" label={rule.type} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={rule.severity} label={rule.severity} />
                  </td>
                  <td className="px-3 py-3 text-white/80">{rule.hit_count || 0}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(rule)}
                      className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${
                        rule.is_active
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {rule.is_active ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setTestRule(rule);
                        setTestResult(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-widest text-white"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                      Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      )}

      {errorText ? (
        <DashboardCard className="border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {errorText}
          </div>
        </DashboardCard>
      ) : null}

      {newRuleOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <DashboardCard className="w-full max-w-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">New Detection Rule</h2>
              <button type="button" onClick={() => setNewRuleOpen(false)} className="text-xs text-white/60">
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Rule name"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={form.mitre}
                onChange={(event) => setForm((prev) => ({ ...prev, mitre: event.target.value }))}
                placeholder="MITRE technique (optional)"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, type: event.target.value as "sigma" | "yara" | "custom" }))
                }
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                <option value="sigma">Sigma</option>
                <option value="yara">YARA</option>
                <option value="custom">Custom</option>
              </select>
              <select
                value={form.severity}
                onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <textarea
              value={form.ruleContent}
              onChange={(event) => setForm((prev) => ({ ...prev, ruleContent: event.target.value }))}
              placeholder="Paste Sigma YAML or YARA rule"
              className="mt-3 min-h-[200px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewRuleOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!form.name || !form.ruleContent || saving}
                onClick={handleCreate}
                className="rounded-xl bg-[#7c6af7] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create Rule"}
              </button>
            </div>
          </DashboardCard>
        </div>
      ) : null}

      {testRule ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <DashboardCard className="w-full max-w-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Test {testRule.name}</h2>
              <button type="button" onClick={() => setTestRule(null)} className="text-xs text-white/60">
                Close
              </button>
            </div>

            <textarea
              value={sampleJson}
              onChange={(event) => setSampleJson(event.target.value)}
              className="mt-3 min-h-[180px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm"
            />

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="rounded-xl bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-200"
              >
                {testing ? "Testing..." : "Run Test"}
              </button>

              {testResult ? (
                <StatusBadge
                  status={testResult.matched ? "healthy" : "pending"}
                  label={testResult.matched ? "Matched" : "No Match"}
                />
              ) : null}
            </div>

            {testResult?.error ? (
              <p className="mt-2 text-xs text-red-200">{testResult.error}</p>
            ) : null}

            {testResult?.details ? (
              <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-slate-200">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            ) : null}
          </DashboardCard>
        </div>
      ) : null}
    </div>
  );
}
