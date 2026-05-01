"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Shield, 
  Globe, 
  Bell, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Terminal,
  Zap,
  Mail,
  Slack
} from "lucide-react";
import DashboardCard from "@/components/dashboard/DashboardCard";
import PhishButton from "@/components/ui/PhishButton";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1 state
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // Step 3 state
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  // Step 4 state
  const [slackUrl, setSlackUrl] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedStep = localStorage.getItem('ps_onboarding_step');
    if (savedStep) {
      setStep(parseInt(savedStep));
    }
  }, []);

  const updateStep = (nextStep: number) => {
    setStep(nextStep);
    localStorage.setItem('ps_onboarding_step', nextStep.toString());
  };

  const handleOrgDetails = async () => {
    if (!orgName || !industry || !teamSize) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName, industry, team_size: teamSize }),
      });
      if (res.ok) {
        updateStep(2);
      } else {
        toast.error("Failed to update organization");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSource = () => {
    updateStep(3);
  };

  const handleBrandDomains = async () => {
    if (domains.length === 0) {
      toast.error("Please add at least one domain");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_domains: domains }),
      });
      if (res.ok) {
        updateStep(4);
      } else {
        toast.error("Failed to update domains");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleNotifications = async (skip = false) => {
    if (!skip && !slackUrl && !email) {
      toast.error("Please provide at least one notification method or skip");
      return;
    }

    if (!skip) {
        setLoading(true);
        try {
          await fetch("/api/notifications/rules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slack_url: slackUrl, email: email }),
          });
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
    }
    updateStep(5);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setup_complete: true }),
      });
      if (res.ok) {
        localStorage.removeItem('ps_onboarding_step');
        router.push("/dashboard");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex justify-between mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                s <= step ? "bg-[#7c6af7] border-[#7c6af7] text-white" : "border-white/10 text-white/40"
              }`}
            >
              {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#7c6af7] transition-all duration-500" 
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Organization Details</h1>
              <p className="text-slate-400">Let's set up your secure workspace.</p>
            </div>
            <DashboardCard className="p-8 border-white/10 bg-[#0a0a0f] backdrop-blur-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Organization Name</label>
                  <input 
                    type="text" 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Corp Security"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#7c6af7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Industry</label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#7c6af7]"
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="government">Government</option>
                    <option value="education">Education</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Team Size</label>
                  <select 
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#7c6af7]"
                  >
                    <option value="">Select size</option>
                    <option value="1-5">1-5 Employees</option>
                    <option value="6-20">6-20 Employees</option>
                    <option value="21-100">21-100 Employees</option>
                    <option value="100+">100+ Employees</option>
                  </select>
                </div>
                <PhishButton 
                  onClick={handleOrgDetails}
                  disabled={loading}
                  className="w-full bg-[#7c6af7] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next Step <ArrowRight className="w-4 h-4" /></>}
                </PhishButton>
              </div>
            </DashboardCard>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Connect Data Source</h1>
              <p className="text-slate-400">Integrate your first security feed to start monitoring.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DashboardCard className="p-6 border-[#7c6af7]/30 bg-[#7c6af7]/5 cursor-pointer hover:border-[#7c6af7] transition-all group">
                <div className="h-12 w-12 rounded-xl bg-[#7c6af7]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-[#7c6af7]" />
                </div>
                <h3 className="font-bold text-white mb-1">Wazuh</h3>
                <p className="text-xs text-slate-400 mb-4">Recommended for EDR and log analysis.</p>
                <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-emerald-400 overflow-hidden mb-4">
                  POST https://phishslayer.tech/api/webhooks/wazuh
                </div>
                <PhishButton onClick={handleConnectSource} className="w-full text-xs py-2">Select</PhishButton>
              </DashboardCard>
              <DashboardCard className="p-6 border-white/10 bg-white/5 cursor-pointer hover:border-[#00d4aa] transition-all group">
                <div className="h-12 w-12 rounded-xl bg-[#00d4aa]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-[#00d4aa]" />
                </div>
                <h3 className="font-bold text-white mb-1">Generic Webhook</h3>
                <p className="text-xs text-slate-400 mb-4">Connect any tool via HTTP POST events.</p>
                <PhishButton onClick={handleConnectSource} className="w-full text-xs py-2 bg-[#00d4aa] text-black">Select</PhishButton>
              </DashboardCard>
              <DashboardCard className="p-6 border-white/10 bg-white/5 cursor-pointer hover:border-slate-400 transition-all group">
                <div className="h-12 w-12 rounded-xl bg-slate-400/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Terminal className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="font-bold text-white mb-1">Manual Upload</h3>
                <p className="text-xs text-slate-400 mb-4">Upload raw log files for deep analysis.</p>
                <PhishButton onClick={handleConnectSource} className="w-full text-xs py-2 bg-slate-500 text-white">Select</PhishButton>
              </DashboardCard>
            </div>
            <div className="flex justify-center">
              <button onClick={() => updateStep(1)} className="text-sm text-slate-500 hover:text-white flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Set Brand Domains</h1>
              <p className="text-slate-400">Add domains you want to monitor for typosquatting and impersonation.</p>
            </div>
            <DashboardCard className="p-8 border-white/10 bg-[#0a0a0f]">
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="company.com"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newDomain) {
                            if (!domains.includes(newDomain)) {
                                setDomains([...domains, newDomain]);
                            }
                            setNewDomain("");
                        }
                    }}
                  />
                  <PhishButton 
                    onClick={() => {
                      if (newDomain && !domains.includes(newDomain)) {
                        setDomains([...domains, newDomain]);
                        setNewDomain("");
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 rounded-lg"
                  >
                    Add
                  </PhishButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {domains.map((d) => (
                    <div key={d} className="bg-[#7c6af7]/20 border border-[#7c6af7]/40 text-[#7c6af7] px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                      {d}
                      <button onClick={() => setDomains(domains.filter(i => i !== d))} className="hover:text-white">&times;</button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 italic">Used by L3 Agent for automated OSINT brand monitoring.</p>
                <PhishButton 
                  onClick={handleBrandDomains}
                  disabled={loading || domains.length === 0}
                  className="w-full bg-[#7c6af7] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next Step <ArrowRight className="w-4 h-4" /></>}
                </PhishButton>
              </div>
            </DashboardCard>
            <div className="flex justify-center">
              <button onClick={() => updateStep(2)} className="text-sm text-slate-500 hover:text-white flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Configure Notifications</h1>
              <p className="text-slate-400">Receive alerts via your preferred channels.</p>
            </div>
            <DashboardCard className="p-8 border-white/10 bg-[#0a0a0f]">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Slack className="w-4 h-4 text-[#7c6af7]" /> Slack Webhook URL
                  </label>
                  <input 
                    type="text" 
                    value={slackUrl}
                    onChange={(e) => setSlackUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#7c6af7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#00d4aa]" /> Alert Email
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="soc@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#7c6af7]"
                  />
                </div>
                <div className="flex gap-4">
                  <PhishButton 
                    onClick={() => handleNotifications(true)}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-lg"
                  >
                    Skip for now
                  </PhishButton>
                  <PhishButton 
                    onClick={() => handleNotifications()}
                    disabled={loading}
                    className="flex-1 bg-[#7c6af7] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finish Setup <ArrowRight className="w-4 h-4" /></>}
                  </PhishButton>
                </div>
              </div>
            </DashboardCard>
            <div className="flex justify-center">
              <button onClick={() => updateStep(3)} className="text-sm text-slate-500 hover:text-white flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in zoom-in duration-700 text-center py-10">
            <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 bg-[#7c6af7]/20 blur-[100px] rounded-full animate-pulse" />
                </div>
                <div className="h-24 w-24 rounded-2xl bg-[#00d4aa]/20 border border-[#00d4aa]/40 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-[#00d4aa]" />
                </div>
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-4">Platform is ready.</h1>
              <p className="text-xl text-slate-400 max-w-lg mx-auto">
                Your autonomous SOC is initialized. Agents are starting up and baseline scans are scheduled.
              </p>
            </div>
            <PhishButton 
              onClick={handleFinish}
              disabled={loading}
              className="px-12 py-4 bg-[#7c6af7] text-white rounded-lg font-black text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(124,106,247,0.3)]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Go to Dashboard"}
            </PhishButton>
          </div>
        )}
      </div>
    </div>
  );
}
