"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

const springConfig = { type: "spring" as const, stiffness: 60, damping: 25, bounce: 0.1 };

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const router = useRouter();

  const handleAction = async (planName: string) => {
    if (planName === "Enterprise Edge") {
      router.push("/contact");
    } else {
      router.push(`/auth/signup?plan=${planName.toLowerCase()}`);
    }
  };

  const tiers = [
    {
      name: "Community",
      price: isAnnual ? "0" : "0",
      description: "For individuals and small labs.",
      features: ["10 AI Scans / Day", "Community Threat Feed", "Public Sandbox Matches", "Standard Speed Detection"],
      cta: "Join Free",
      popular: false
    },
    {
      name: "Fleet Command",
      price: isAnnual ? "39" : "49",
      description: "For proactive security teams.",
      features: ["Unlimited AI Scans", "Real-Time EDR Agent (up to 50 nodes)", "Zero-Day Threat Signatures", "Discord/Slack Webhooks", "API Access (100 req/min)"],
      cta: "Start 14-Day Trial",
      popular: true
    },
    {
      name: "Enterprise Edge",
      price: "Custom",
      description: "For critical infrastructure.",
      features: ["Unlimited EDR Nodes", "Dedicated Account Intel", "Custom YARA Rulesets", "Auto-Remediation Actions", "24/7 Priority Support"],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="bg-[#0D1117] py-24 border-b border-[#1C2128] relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={springConfig}
          className="text-center mb-16"
        >
          <span className="font-mono text-[11px] tracking-[0.15em] text-[#2DD4BF] uppercase block mb-4">Pricing</span>
          <h2 className="text-3xl md:text-5xl font-bold text-[#E6EDF3] tracking-[-0.01em] mb-6">
            Priced for Security. Not Extortion.
          </h2>
          <p className="text-[#8B949E] text-[16px] max-w-2xl mx-auto mb-10 leading-[1.7]">
            Enterprise-grade endpoint security shouldn&apos;t require a VC funding round.
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-[#E6EDF3]' : 'text-[#8B949E]'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-6 w-12 items-center rounded-full bg-[#161B22] border border-[#30363D] transition-colors focus:outline-none"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full transition-transform duration-200 ${isAnnual ? 'translate-x-7 bg-[#2DD4BF]' : 'translate-x-1 bg-[#8B949E]'}`} />
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${isAnnual ? 'text-[#E6EDF3]' : 'text-[#8B949E]'}`}>
              Annually <span className="font-mono text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-2 py-0.5 rounded-[4px] border border-[#2DD4BF]/20 tracking-[0.05em]">SAVE 20%</span>
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.25 } } }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              variants={{ hidden: { opacity: 0, y: 80 }, visible: { opacity: 1, y: 0, transition: springConfig } }}
              className={`relative p-8 rounded-[8px] flex flex-col transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_0_30px_rgba(45,212,191,0.12)] ${
                tier.popular 
                  ? 'bg-gradient-to-b from-[#2DD4BF]/[0.08] to-[#161B22] border border-[#2DD4BF]/40' 
                  : 'bg-[#161B22] border border-[#30363D] hover:border-[#2DD4BF]'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2DD4BF] text-[#0D1117] font-mono text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-[4px]">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#E6EDF3] mb-2 tracking-tight">{tier.name}</h3>
                <p className="text-[#8B949E] text-sm">{tier.description}</p>
              </div>

              <div className="mb-8">
                {tier.price === 'Custom' ? (
                  <span className="text-[56px] font-extrabold text-[#E6EDF3] tracking-[-0.03em] leading-none">Custom</span>
                ) : (
                  <>
                    <span className="text-[56px] font-extrabold text-[#E6EDF3] tracking-[-0.03em] leading-none">${tier.price}</span>
                    <span className="text-[16px] text-[#8B949E] font-normal">/mo</span>
                  </>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feat, idx) => (
                  <li key={idx} className="flex flex-start gap-3">
                    <Check className="w-5 h-5 text-[#2DD4BF] shrink-0" strokeWidth={1.5} />
                    <span className="text-[#8B949E] text-sm leading-tight">{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleAction(tier.name)}
                className={`w-full py-3.5 rounded-[6px] font-bold text-[15px] transition-all duration-200 focus:outline-none tracking-[0.01em] ${
                  tier.popular 
                    ? 'bg-[#2DD4BF] text-[#0D1117] hover:bg-[#14B8A6] hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(45,212,191,0.3)]' 
                    : 'bg-transparent text-[#E6EDF3] border border-[#30363D] hover:border-[#2DD4BF] hover:text-[#2DD4BF]'
                }`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
