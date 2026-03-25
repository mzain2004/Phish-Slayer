"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const springConfig = { type: "spring" as const, stiffness: 60, damping: 25, bounce: 0.1 };

export function ComparisonTable() {
  const rows = [
    { feature: "AI Analysis", ps: "Gemini AI" },
    { feature: "EDR Agent", ps: "Full WebSocket" },
    { feature: "Fleet Management", ps: "Live Dashboard" },
    { feature: "Free Tier", ps: "10 scans/day" },
    { feature: "Adaptive AI", ps: "In Dev" },
  ];

  return (
    <section className="bg-[#0A0E13] py-24 border-b border-[#1C2128] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={springConfig}
          className="text-center mb-16"
        >
          <span className="font-mono text-[11px] tracking-[0.15em] text-[#2DD4BF] uppercase block mb-4">Comparison</span>
          <h2 className="text-3xl md:text-5xl font-bold text-[#E6EDF3] tracking-[-0.01em]">
            No Competitor Offers This at This Price
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={springConfig}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="hidden md:flex flex-col justify-end gap-6 pb-6 pr-4">
            {rows.map((row, i) => (
              <div key={i} className="h-10 text-[#8B949E] font-bold uppercase tracking-wider text-sm flex items-center font-mono text-[12px] tracking-[0.12em]">
                {row.feature}
              </div>
            ))}
            <div className="h-16 text-[#E6EDF3] font-extrabold text-lg pt-4 flex items-center tracking-tight">
              Starting Price
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-[#161B22] border border-[#2DD4BF]/40 rounded-[8px] p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2DD4BF] text-[#0D1117] font-mono text-[10px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-[4px]">
              Phish-Slayer
            </div>
            {rows.map((row, i) => (
              <div key={i} className="h-10 flex items-center justify-between md:justify-center border-b border-[#30363D]/50 md:border-none pb-2 md:pb-0">
                <span className="md:hidden text-[#8B949E] font-bold uppercase text-xs font-mono">{row.feature}</span>
                <span className="text-[#2DD4BF] font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" strokeWidth={1.5} /> {row.ps}
                </span>
              </div>
            ))}
            <div className="h-16 flex items-center justify-between md:justify-center pt-4 md:border-t border-[#30363D]">
              <span className="md:hidden text-[#E6EDF3] font-bold">Price</span>
              <div className="text-center">
                <span className="text-[#E6EDF3] text-3xl font-extrabold tracking-tight">$49</span>
                <span className="text-[#8B949E] text-sm">/mo</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-[#161B22] border border-[#30363D] rounded-[8px] p-6 opacity-50 hover:opacity-100 transition-opacity duration-300">
            <div className="text-center text-[#8B949E] font-bold mb-2">Recorded Future</div>
            {rows.map((_, i) => (
              <div key={i} className="h-10 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500/50" strokeWidth={1.5} />
              </div>
            ))}
            <div className="h-16 flex items-center justify-center pt-4 border-t border-[#30363D]">
              <span className="text-[#8B949E] font-bold">$25,000<span className="text-xs">/yr</span></span>
            </div>
          </div>

          <div className="flex flex-col gap-6 bg-[#161B22] border border-[#30363D] rounded-[8px] p-6 opacity-50 hover:opacity-100 transition-opacity duration-300">
            <div className="text-center text-[#8B949E] font-bold mb-2">ThreatConnect</div>
            {rows.map((_, i) => (
              <div key={i} className="h-10 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500/50" strokeWidth={1.5} />
              </div>
            ))}
            <div className="h-16 flex items-center justify-center pt-4 border-t border-[#30363D]">
              <span className="text-[#8B949E] font-bold">$50,000<span className="text-xs">/yr</span></span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
