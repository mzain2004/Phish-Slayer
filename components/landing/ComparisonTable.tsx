"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export function ComparisonTable() {
  const rows = [
    { feature: "AI Analysis", ps: true, rf: true, tc: true, vt: false },
    { feature: "EDR Agent", ps: true, rf: false, tc: false, vt: false },
    { feature: "Fleet Management", ps: true, rf: false, tc: false, vt: false },
    { feature: "Free Tier", ps: true, rf: false, tc: false, vt: true },
    { feature: "Adaptive AI", ps: "Q3 '26", rf: false, tc: false, vt: false },
  ];

  return (
    <section className="bg-[#0D1117] py-32 border-b border-[#30363D] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-[#E6EDF3] tracking-tight">
            No Competitor Offers This at This Price
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="hidden md:block overflow-x-auto"
        >
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-4 text-left text-[#8B949E] font-bold uppercase tracking-wider border-b border-[#30363D]">Features</th>
                <th className="p-4 text-center bg-[#2DD4BF]/10 text-[#2DD4BF] font-black border-2 border-[#2DD4BF] rounded-t-[12px] text-lg">Phish-Slayer</th>
                <th className="p-4 text-center text-[#8B949E] font-bold uppercase tracking-wider border-b border-[#30363D] w-1/4">Recorded Future</th>
                <th className="p-4 text-center text-[#8B949E] font-bold uppercase tracking-wider border-b border-[#30363D] w-1/4">ThreatConnect</th>
                <th className="p-4 text-center text-[#8B949E] font-bold uppercase tracking-wider border-b border-[#30363D] w-1/4">VirusTotal Ent.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#30363D]">
                  <td className="p-4 text-[#E6EDF3] font-bold">{row.feature}</td>
                  
                  {/* Phish-Slayer Column */}
                  <td className="p-4 text-center bg-[#1C2128]/50 border-x-2 border-[#2DD4BF] relative">
                    {typeof row.ps === "boolean" ? (
                      <Check className="w-6 h-6 text-[#3FB950] mx-auto" />
                    ) : (
                      <span className="text-[#2DD4BF] font-bold text-sm bg-[#2DD4BF]/10 px-2 py-1 rounded">{row.ps}</span>
                    )}
                  </td>
                  
                  {/* Competitor Columns */}
                  <td className="p-4 text-center">
                    {row.rf ? <Check className="w-5 h-5 text-[#8B949E] mx-auto" /> : <X className="w-5 h-5 text-[#F85149]/50 mx-auto" />}
                  </td>
                  <td className="p-4 text-center">
                    {row.tc ? <Check className="w-5 h-5 text-[#8B949E] mx-auto" /> : <X className="w-5 h-5 text-[#F85149]/50 mx-auto" />}
                  </td>
                  <td className="p-4 text-center">
                    {row.vt ? <Check className="w-5 h-5 text-[#8B949E] mx-auto" /> : <X className="w-5 h-5 text-[#F85149]/50 mx-auto" />}
                  </td>
                </tr>
              ))}
              
              {/* Pricing Row */}
              <tr>
                <td className="p-4 text-[#E6EDF3] font-black text-lg pt-8">Starting Price</td>
                <td className="p-4 text-center bg-[#1C2128]/50 border-2 border-[#2DD4BF] border-t-0 rounded-b-[12px] pt-8">
                  <span className="text-2xl font-black text-[#2DD4BF]">$49</span><span className="text-sm text-[#8B949E]">/mo</span>
                </td>
                <td className="p-4 text-center text-lg font-bold text-[#8B949E] pt-8">$25,000<span className="text-xs">/yr</span></td>
                <td className="p-4 text-center text-lg font-bold text-[#8B949E] pt-8">$50,000<span className="text-xs">/yr</span></td>
                <td className="p-4 text-center text-lg font-bold text-[#8B949E] pt-8">$10,000<span className="text-xs">/yr</span></td>
              </tr>
            </tbody>
          </table>
        </motion.div>

        {/* Mobile View: Highlighting Phish-Slayer heavily to avoid complex tables */}
        <div className="md:hidden space-y-6">
          <div className="bg-[#1C2128]/50 border-2 border-[#2DD4BF] rounded-[12px] p-6 shadow-[0_0_20px_rgba(45,212,191,0.15)]">
            <h3 className="text-2xl font-black text-[#2DD4BF] mb-4 text-center">Phish-Slayer ($49/mo)</h3>
            <ul className="space-y-3">
              {rows.map(r => (
                <li key={r.feature} className="flex justify-between border-b border-[#30363D] pb-2 last:border-0 text-sm">
                  <span className="text-[#E6EDF3] font-bold">{r.feature}</span>
                  {typeof r.ps === "boolean" ? <Check className="w-5 h-5 text-[#3FB950]" /> : <span className="text-[#2DD4BF] font-bold">{r.ps}</span>}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-[#161B22] border border-[#30363D] rounded-[12px] p-6 text-center text-[#8B949E]">
            <p className="mb-2">Competitors charge between <span className="text-[#E6EDF3] font-bold">$10k-$50k/year</span> for fewer combined features.</p>
            <p className="text-xs uppercase tracking-wider">Switch to mobile desktop view for full comparison table.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
