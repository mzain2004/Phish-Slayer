"use client";

import { motion } from "framer-motion";

export function AdaptiveAIVision() {
  return (
    <section className="bg-gradient-to-b from-[#0D1117] to-[#1e1433] py-32 border-b border-[#A78BFA]/20 overflow-hidden text-[#E6EDF3]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block bg-[#A78BFA]/20 border border-[#A78BFA]/40 text-[#A78BFA] text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-6"
          >
            In Development — Q3 2026
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black tracking-tight"
          >
            The Next Phase — AI That Fights Back
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center relative mb-20">
          {/* VS Badge */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#0D1117] border-4 border-[#30363D] rounded-full items-center justify-center font-black text-xl text-[#8B949E] z-10 shadow-2xl">
            VS
          </div>

          {/* Left: Attack */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#161B22] border-2 border-[#F85149]/50 rounded-[12px] p-8 relative overflow-hidden shadow-[0_0_30px_rgba(248,81,73,0.1)]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F85149]/10 blur-3xl rounded-full" />
            <div className="text-[#F85149] text-[10px] font-black uppercase tracking-widest mb-4">The Problem</div>
            <h3 className="text-2xl font-bold mb-4">Adaptive Malware</h3>
            <p className="text-[#8B949E] leading-relaxed mb-6">
              Modern malware uses LLMs to rewrite its own source code on the fly. 
              Signatures change every 3 seconds. Static detection rules are obsolete before they&apos;re even deployed.
            </p>
            <div className="font-mono text-xs bg-[#0D1117] p-3 rounded-[8px] border border-[#30363D] text-[#F85149] opacity-80">
              <span className="font-bold">&gt; Mutation cycle 284:</span> payload obfuscated.<br/>
              <span className="font-bold">&gt; Hash:</span> e3b0c44298fc1c14...<br/>
              <span className="font-bold">&gt; Status:</span> Undetected by 94/95 vendors.
            </div>
          </motion.div>

          {/* Right: Defense */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#161B22] border-2 border-[#2DD4BF] rounded-[12px] p-8 relative overflow-hidden shadow-[0_0_40px_rgba(45,212,191,0.15)]"
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#2DD4BF]/10 blur-3xl rounded-full" />
            <div className="text-[#2DD4BF] text-[10px] font-black uppercase tracking-widest mb-4">The Solution</div>
            <h3 className="text-2xl font-bold mb-4">Continuous EDR Synthesis</h3>
            <p className="text-[#8B949E] leading-relaxed mb-6">
              Our upcoming engine observes live behavioral drift. 
              As malware mutates, Phish-Slayer AI synthesizes and deploys counter-heuristics to your entire agent fleet in milliseconds.
            </p>
            <div className="font-mono text-xs bg-[#0D1117] p-3 rounded-[8px] border border-[#2DD4BF]/30 text-[#2DD4BF]">
              <span className="font-bold">&gt; Pattern observed:</span> Process injection variant detected.<br/>
              <span className="font-bold">&gt; Synthesizing rule...</span><br/>
              <span className="font-bold">&gt; Deployed to 4,000 agents.</span> Latency: 42ms.
            </div>
          </motion.div>
        </div>

        {/* Email Capture */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <h3 className="text-lg font-bold mb-4">Be the first to know when Adaptive Defense drops.</h3>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="security@acme.com" 
              className="flex-1 bg-[#161B22] border border-[#30363D] rounded-[8px] px-4 py-3 text-sm focus:outline-none focus:border-[#A78BFA] transition-colors"
              required
            />
            <button className="bg-[#A78BFA] text-[#0D1117] font-bold px-6 py-3 rounded-[8px] text-sm hover:bg-[#A78BFA]/90 transition-colors shadow-[0_0_15px_rgba(167,139,250,0.2)]">
              Get Early Access
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
