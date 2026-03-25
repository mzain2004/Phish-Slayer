"use client";

import { motion } from "framer-motion";

const springConfig = { type: "spring" as const, stiffness: 60, damping: 25, bounce: 0.1 };

const fadeInUp = {
  hidden: { opacity: 0, y: 80 },
  visible: { opacity: 1, y: 0, transition: springConfig }
};

export function ProblemStatement() {
  return (
    <section className="bg-[#0D1117] py-24 border-b border-[#1C2128]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <span className="font-mono text-[11px] tracking-[0.15em] text-[#2DD4BF] uppercase block mb-4">The Problem</span>
          <h2 className="text-3xl md:text-5xl font-bold text-[#E6EDF3] tracking-[-0.01em]">
            Enterprise Security Tools Are Priced to Exclude You
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.25 } } }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {[
            { title: "Cost", desc: "Recorded Future $25K/year. ThreatConnect $50K/year. Most teams get nothing." },
            { title: "AI Attacks Are Mutating", desc: "Malware rewrites its own code in real time. Static tools are blind to it." },
            { title: "Fragmented Tools", desc: "5-8 disconnected platforms to get one answer. Hours lost per incident." }
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="bg-[#161B22] border-l-4 border-l-[#F85149] border border-[#30363D] p-6 rounded-r-[8px] hover:border-[#2DD4BF] hover:shadow-[0_0_0_1px_rgba(45,212,191,0.1),0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-[2px] transition-all duration-200"
            >
              <h3 className="text-xl font-bold text-[#F85149] mb-3 uppercase tracking-wider">{card.title}</h3>
              <p className="text-[#8B949E] leading-[1.7] text-[16px]">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-[#30363D] bg-[#161B22] rounded-[8px]"
        >
          <div className="text-center px-4">
            <p className="text-4xl font-extrabold text-[#E6EDF3] mb-1 tracking-tight">207</p>
            <p className="text-[12px] font-mono text-[#8B949E] uppercase tracking-[0.12em]">Days avg breach detection time</p>
          </div>
          <div className="text-center px-4 md:border-x md:border-[#30363D]">
            <p className="text-4xl font-extrabold text-[#E6EDF3] mb-1 tracking-tight">43%</p>
            <p className="text-[12px] font-mono text-[#8B949E] uppercase tracking-[0.12em]">Of attacks target SMBs</p>
          </div>
          <div className="text-center px-4">
            <p className="text-4xl font-extrabold text-[#E6EDF3] mb-1 tracking-tight">3.5M</p>
            <p className="text-[12px] font-mono text-[#8B949E] uppercase tracking-[0.12em]">Unfilled security jobs</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
