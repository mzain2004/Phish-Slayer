"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ParticleNetwork } from "@/components/ui/particle-network";

export function BottomCTA() {
  return (
    <section className="relative overflow-hidden py-32 border-b border-[#30363D]">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D1117] via-[#022B29] to-[#1C1236] z-0" />
      
      {/* Particle Canvas Overlay */}
      <div className="absolute inset-0 z-0 opacity-30">
        <ParticleNetwork disabled={false} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#E6EDF3] tracking-tight mb-6">
          Your Next Threat Is Already Moving.<br />Are You Ready?
        </h2>
        
        <p className="text-lg md:text-xl text-[#8B949E] mb-12">
          Start scanning in under 60 seconds. Free tier. No credit card. No sales call.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#0D1117] font-bold px-10 py-4 rounded-[8px] transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] text-lg"
          >
            Start Free Now <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-transparent border border-[#30363D] hover:bg-[#1C2128] text-[#E6EDF3] font-bold px-10 py-4 rounded-[8px] transition-all text-lg"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
