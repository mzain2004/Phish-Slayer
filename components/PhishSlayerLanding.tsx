"use client";

import { Header } from "./landing/Header";
import { HeroSection } from "./landing/HeroSection";
import { ThreatTicker } from "./landing/ThreatTicker";
import { ProblemStatement } from "./landing/ProblemStatement";
import { GatePipeline } from "./landing/GatePipeline";
import { ProductDemo } from "./landing/ProductDemo";
import { EDRSection } from "./landing/EDRSection";
import { FeaturesGrid } from "./landing/FeaturesGrid";
import { ComparisonTable } from "./landing/ComparisonTable";
import { PricingSection } from "./landing/PricingSection";
import { AdaptiveAIVision } from "./landing/AdaptiveAIVision";
import { Testimonials } from "./landing/Testimonials";
import { FAQ } from "./landing/FAQ";
import { BottomCTA } from "./landing/BottomCTA";
import { Footer } from "./landing/Footer";

export default function PhishSlayerLanding({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <div className="bg-[#0D1117] text-[#E6EDF3] font-sans overflow-x-hidden selection:bg-[#2DD4BF]/30">
      <Header isAuthenticated={isAuthenticated} />
      
      <main>
        <HeroSection />
        <ThreatTicker />
        <ProblemStatement />
        <GatePipeline />
        <ProductDemo />
        <EDRSection />
        <FeaturesGrid />
        <ComparisonTable />
        <PricingSection />
        <AdaptiveAIVision />
        <Testimonials />
        <FAQ />
        <BottomCTA />
      </main>

      <Footer />
    </div>
  );
}
