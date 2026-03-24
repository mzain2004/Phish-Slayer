"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

export function Testimonials() {
  const testimonials = [
    {
      quote: "Phish-Slayer's API integrated into our Sentinel workflow in under 20 minutes. The plain-English AI verdicts have cut our junior analysts' triage time by 75%.",
      name: "Marcus T.",
      role: "Lead Security Engineer",
      initial: "M",
    },
    {
      quote: "Every other EDR platform we demoed required a $30,000 upfront commitment and a 3-month deployment cycle. We deployed 40 Phish-Slayer agents in one afternoon for $49.",
      name: "Sarah C.",
      role: "vCISO at MSP Group",
      initial: "S",
    },
    {
      quote: "The 3-gate pipeline caught a zero-day credential harvesting campaign targeting our CFO via SMS links. Tools costing 50x more missed it completely.",
      name: "David K.",
      role: "Director of IT",
      initial: "D",
    }
  ];

  return (
    <section className="bg-[#0D1117] py-32 border-b border-[#30363D]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-[#E6EDF3] tracking-tight">
            What Security Professionals Are Saying
          </h2>
          <p className="text-[#8B949E] mt-4">(Early Feedback Cohort)</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="bg-[#161B22] border border-[#30363D] rounded-[12px] p-8 flex flex-col"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 text-[#E3B341] fill-[#E3B341]" />
                ))}
              </div>
              
              <p className="text-[#E6EDF3] leading-relaxed mb-8 flex-1">
                &quot;{t.quote}&quot;
              </p>
              
              <div className="flex items-center gap-4 pt-6 border-t border-[#30363D]">
                <div className="w-12 h-12 bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 rounded-full flex items-center justify-center text-[#2DD4BF] font-black text-lg shadow-[0_0_15px_rgba(45,212,191,0.1)]">
                  {t.initial}
                </div>
                <div>
                  <h4 className="text-[#E6EDF3] font-bold">{t.name}</h4>
                  <p className="text-[#8B949E] text-xs uppercase tracking-wider">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
