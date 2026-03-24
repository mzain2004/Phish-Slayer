"use client";

import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
};

export function ProblemStatement() {
  return (
    <section className="bg-[#0D1117] text-[#E6EDF3] py-24 border-b border-[#30363D]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Enterprise Security Tools Are Priced to Exclude You
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerChildren}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {[
            {
              title: "Cost",
              desc: "Recorded Future $25K/year. ThreatConnect $50K/year. Most teams get nothing.",
            },
            {
              title: "AI Attacks Are Mutating",
              desc: "Malware rewrites its own code in real time. Static tools are blind to it.",
            },
            {
              title: "Fragmented Tools",
              desc: "5-8 disconnected platforms to get one answer. Hours lost per incident.",
            }
          ].map((card, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              className="bg-[#161B22] border-l-4 border-l-[#F85149] border border-[#30363D] p-8 rounded-r-[12px] shadow-sm hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-[#F85149] mb-3 uppercase tracking-wider">{card.title}</h3>
              <p className="text-[#8B949E] leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-y border-[#30363D] bg-[#1C2128]/50 rounded-[12px]"
        >
          <div className="text-center px-4">
            <p className="text-4xl font-black text-[#E6EDF3] mb-1">207</p>
            <p className="text-sm font-medium text-[#8B949E] uppercase tracking-wider">Days avg breach detection time</p>
          </div>
          <div className="text-center px-4 md:border-x md:border-[#30363D]">
            <p className="text-4xl font-black text-[#E6EDF3] mb-1">43%</p>
            <p className="text-sm font-medium text-[#8B949E] uppercase tracking-wider">Of attacks target SMBs</p>
          </div>
          <div className="text-center px-4">
            <p className="text-4xl font-black text-[#E6EDF3] mb-1">3.5M</p>
            <p className="text-sm font-medium text-[#8B949E] uppercase tracking-wider">Unfilled security jobs</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
