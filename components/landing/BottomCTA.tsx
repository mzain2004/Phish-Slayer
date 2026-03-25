"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BottomCTA() {
  return (
    <section className="relative overflow-hidden py-24 border-b border-[#1C2128] bg-[#0A0E13]">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" 
        style={{ background: "radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)" }} 
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.02em] mb-6 leading-[1.1]">
          <span className="text-[#E6EDF3]">Your Next Threat Is Already Moving.</span><br />
          <span className="text-[#2DD4BF]">Are You Ready?</span>
        </h2>
        
        <p className="text-[16px] md:text-lg text-[#8B949E] mb-12 leading-[1.7]">
          Start scanning in under 60 seconds. Free tier. No credit card. No sales call.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#0D1117] font-bold px-10 py-4 rounded-[6px] transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_25px_rgba(45,212,191,0.3)] text-lg tracking-[0.01em]"
          >
            Start Free Now <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-transparent border border-[#30363D] hover:border-[#2DD4BF] hover:text-[#2DD4BF] text-[#E6EDF3] font-bold px-10 py-4 rounded-[6px] transition-all text-lg"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
