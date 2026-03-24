"use client";

import { motion } from "framer-motion";
import { ArrowRight, Database, Search, Bot } from "lucide-react";

export function GatePipeline() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  const gates = [
    {
      step: 1,
      title: "Intel Vault",
      desc: "Instant local lookup. Zero API calls.",
      color: "border-[#3FB950]",
      bg: "bg-[#3FB950]/10",
      icon: <Database className="w-8 h-8 text-[#3FB950]" />,
    },
    {
      step: 2,
      title: "95-Engine Scanner",
      desc: "VirusTotal consensus across 95 engines.",
      color: "border-[#E3B341]",
      bg: "bg-[#E3B341]/10",
      icon: <Search className="w-8 h-8 text-[#E3B341]" />,
    },
    {
      step: 3,
      title: "Gemini AI",
      desc: "Plain English verdict & remediation.",
      color: "border-[#2DD4BF]",
      bg: "bg-[#2DD4BF]/10",
      icon: <Bot className="w-8 h-8 text-[#2DD4BF]" />,
    },
  ];

  return (
    <section className="bg-[#0D1117] text-[#E6EDF3] py-32 border-b border-[#30363D] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            One Scan. Three Layers. Under 30 Seconds.
          </h2>
        </div>

        {/* Pipeline Visual */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 relative"
        >
          {gates.map((g, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto relative z-10">
              <motion.div
                variants={itemVariants}
                className={`bg-[#161B22] border ${g.color} p-8 rounded-[12px] w-full md:w-72 shadow-xl shrink-0 flex flex-col items-center text-center relative overflow-hidden`}
              >
                {/* Glow ring under icon */}
                <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full blur-xl ${g.bg} pointer-events-none`} />
                <div className={`mb-6 p-4 rounded-full ${g.bg} relative z-10`}>
                  {g.icon}
                </div>
                <div className="text-xs font-black uppercase tracking-wider text-[#8B949E] mb-2">
                  Gate {g.step}
                </div>
                <h3 className="text-xl font-bold text-[#E6EDF3] mb-3">{g.title}</h3>
                <p className="text-[#8B949E] text-sm leading-relaxed">{g.desc}</p>
              </motion.div>
              
              {i < gates.length - 1 && (
                <motion.div
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                  className="hidden md:flex flex-col items-center shrink-0 w-12"
                >
                  <ArrowRight className="w-8 h-8 text-[#30363D]" />
                </motion.div>
              )}
              {i < gates.length - 1 && (
                <div className="md:hidden flex h-12 items-center justify-center shrink-0 w-full">
                  <ArrowRight className="w-8 h-8 text-[#30363D] rotate-90" />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Output Example Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-20 max-w-3xl mx-auto bg-[#1C2128] border border-[#30363D] rounded-[12px] p-6 font-mono text-sm relative"
        >
          <div className="absolute -top-3 left-6 px-3 bg-[#0D1117] border border-[#30363D] text-[#8B949E] text-xs font-bold rounded-sm uppercase tracking-wider">
            Pipeline Output
          </div>
          <div className="flex items-center justify-between mb-4 border-b border-[#30363D] pb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#F85149] animate-pulse shadow-[0_0_10px_rgba(248,81,73,0.6)]" />
              <span className="text-[#F85149] font-bold">VERDICT: MALICIOUS</span>
            </div>
            <div className="text-[#E6EDF3]">
              Risk Score: <span className="text-[#F85149] font-black text-lg">94</span>/100
            </div>
          </div>
          <div className="text-[#8B949E] space-y-2">
            <p>1. Local Vault Match: None</p>
            <p className="text-[#E6EDF3]"><span className="text-[#E3B341]">2. Signatures:</span> 12/95 engines flagged as dropping malware (Trojan.Generic).</p>
            <p className="text-[#2DD4BF]"><span className="text-[#E6EDF3]">3. AI Analysis:</span> Domain mimics Microsoft login page. Form action payload exfiltrates credentials to off-shore IP. High probability credential harvester.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
