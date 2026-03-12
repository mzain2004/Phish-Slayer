"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Check, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createStripePortalSession } from "@/lib/supabase/actions";

const tiers = [
  {
    name: "Recon",
    id: "free",
    monthlyPrice: 0,
    annualPrice: 0,
    desc: "For security researchers and individuals",
    popular: false,
    features: [
      { text: "Web-based domain scanner", ok: true },
      { text: "WHOIS & DNS extraction", ok: true },
      { text: "DOM parsing", ok: true },
      { text: "Gemini AI Threat Narrator", ok: false },
      { text: "Downloadable local agent (25 endpoints)", ok: false },
      { text: "Real-time WebSocket alerts", ok: false },
      { text: "Unlimited EDR agents", ok: false },
      { text: "Bring Your Own Key (LLMs)", ok: false },
      { text: "Offline fallback rules", ok: false },
      { text: "Priority support", ok: false },
    ],
  },
  {
    name: "SOC Pro",
    id: "pro", // Maps to Stripe under the hood
    monthlyPrice: 99,
    annualPrice: 79,
    desc: "For SOC analysts and security professionals",
    popular: true,
    stripePriceIdMonth: process.env.NEXT_PUBLIC_STRIPE_PRICE_FLEET || "mock_fleet_monthly",
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_FLEET_ANNUAL || "mock_fleet_annual",
    features: [
      { text: "Web-based domain scanner", ok: true },
      { text: "WHOIS & DNS extraction", ok: true },
      { text: "DOM parsing", ok: true },
      { text: "Gemini AI Threat Narrator", ok: true },
      { text: "Downloadable local agent (25 endpoints)", ok: true },
      { text: "Real-time WebSocket alerts", ok: true },
      { text: "Unlimited EDR agents", ok: false },
      { text: "Bring Your Own Key (LLMs)", ok: false },
      { text: "Offline fallback rules", ok: false },
      { text: "Priority support", ok: false },
    ],
  },
  {
    name: "Command & Control",
    id: "enterprise",
    monthlyPrice: 299,
    annualPrice: 239,
    desc: "For SOC teams and security operations centers",
    popular: false,
    stripePriceIdMonth: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || "mock_enterprise_monthly",
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL || "mock_enterprise_annual",
    features: [
      { text: "Web-based domain scanner", ok: true },
      { text: "WHOIS & DNS extraction", ok: true },
      { text: "DOM parsing", ok: true },
      { text: "Gemini AI Threat Narrator", ok: true },
      { text: "Downloadable local agent (Unlimited)", ok: true },
      { text: "Real-time WebSocket alerts", ok: true },
      { text: "Unlimited EDR agents", ok: true },
      { text: "Bring Your Own Key (LLMs)", ok: true },
      { text: "Offline fallback rules", ok: true },
      { text: "Priority support", ok: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I change plans anytime?",
    a: "Yes! Upgrades take effect instantly. Downgrades apply at your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — SOC Pro and Command & Control both include a 14-day free trial. No credit card required to start.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards via Stripe. Invoicing is available for Command & Control teams.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes — we offer a 30-day money-back guarantee on all paid plans. No questions asked.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. SOC2 ready, Row Level Security enforced on all data, encrypted at rest and in transit. Your threat data is yours alone.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [userTier, setUserTier] = useState<string>("free");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
      if (data.user) {
        supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (profile?.subscription_tier) {
              setUserTier(profile.subscription_tier);
            }
            setLoadingConfig(false);
          });
      } else {
        setLoadingConfig(false);
      }
    });
  }, []);

  const handleCheckout = async (plan: string) => {
    // Determine the environment variables based on the currently selected plan and billing period
    const targetTier = tiers.find(t => t.id === plan);
    const mockPriceId = billing === "monthly" ? targetTier?.stripePriceIdMonth : targetTier?.stripePriceIdAnnual;
    console.log(`[Stripe Intent] Triggering checkout for ${plan} with price mapping: ${mockPriceId}`);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          billingPeriod: billing,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503 || data.error === 'Payments are not yet configured.' || data.error === 'stripe_not_configured') {
          toast.info("Payments coming soon! Sign up for the waitlist.");
          if (!isLoggedIn) {
            window.location.href = `/auth/signup?plan=${plan}`;
          }
          return;
        }
        throw new Error(data.error || "Checkout failed");
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    }
  };

  const handleManagePlan = async () => {
    const res = await createStripePortalSession();
    if (res?.url) {
      window.location.href = res.url;
    } else if (res?.error) {
      toast.error(res.error === "stripe_not_configured" ? "Payments coming soon!" : res.error);
    }
  };

  const getButtonConfig = (t: typeof tiers[0]) => {
    if (!isLoggedIn) {
      return {
        text: "Get Started",
        action: () => { window.location.href = t.id === "free" ? "/auth/signup" : `/auth/signup?plan=${t.id}`; },
        disabled: false,
      };
    }
    
    if (userTier === t.id) {
      return {
        text: "Current Plan",
        action: () => {},
        disabled: true,
      };
    }

    const planValues = { free: 0, pro: 1, enterprise: 2 };
    const currentVal = planValues[userTier as keyof typeof planValues] ?? 0;
    const targetVal = planValues[t.id as keyof typeof planValues] ?? 0;

    if (targetVal < currentVal) {
      return {
        text: "Downgrade",
        action: handleManagePlan,
        disabled: false,
      };
    }

    return {
      text: "Upgrade",
      action: () => {
        if (currentVal === 0) {
          handleCheckout(t.id);
        } else {
          handleManagePlan();
        }
      },
      disabled: false,
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white font-black text-xl tracking-tight"
          >
            <Shield className="w-6 h-6 text-teal-500" />
            Phish-Slayer
          </Link>
          {loadingConfig ? (
            <div className="w-32 h-9 bg-slate-800 animate-pulse rounded-lg"></div>
          ) : isLoggedIn ? (
            <a
              href="/dashboard"
              className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Go to Dashboard →
            </a>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
              >
                Login
              </a>
              <a
                href="/auth/signup"
                className="bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                Start Free
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="text-center py-20 px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-teal-500 hover:text-teal-400 font-semibold mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter text-center">
          Pricing that scales with your fleet
        </h1>
        <p className="text-slate-400 mt-4 text-lg max-w-lg mx-auto text-center">
          Start free. Upgrade when you&apos;re ready.
        </p>

        {/* Toggle */}
        <div className="flex justify-center mt-8">
          <div className="inline-flex bg-slate-900 border border-slate-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={
                billing === "monthly"
                  ? "bg-teal-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all"
                  : "text-slate-400 px-6 py-2 rounded-lg text-sm font-medium hover:text-white transition-all"
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={
                billing === "annual"
                  ? "bg-teal-500 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all"
                  : "text-slate-400 px-6 py-2 rounded-lg text-sm font-medium hover:text-white transition-all"
              }
            >
              Annual
              <span className="ml-2 bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Pricing cards */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex flex-col lg:flex-row gap-6 justify-center items-stretch max-w-5xl mx-auto">
          {tiers.map((t, i) => {
            const price = billing === "annual" ? t.annualPrice : t.monthlyPrice;
            const isFree = t.id === "free";
            const btnConfig = getButtonConfig(t);

            // Conditional rendering logic for styling rules
            // Applied bg-slate-900/80 backdrop-blur-sm as per user constraints (glassmorphism safe value)
            let baseStyles = "bg-slate-900/80 backdrop-blur-sm rounded-2xl flex flex-col relative w-full lg:w-1/3 p-8 border border-slate-700 transition-all duration-300 transform";
            
            // Pop the popular tier
            if (t.popular) {
              baseStyles += " md:scale-105 border-teal-500 z-10 bg-slate-900/90";
            }

            // Neon glowing top border logic using box shadow
            const glowStyles = t.popular ? { boxShadow: "0 -2px 20px rgba(13,148,136,0.4)" } : undefined;

            return (
              <div
                key={i}
                className={baseStyles}
                style={glowStyles}
              >
                {t.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap z-20 shadow-md">
                    MOST POPULAR
                  </span>
                )}
                
                <h3 className="text-xl font-black text-white tracking-tighter uppercase">
                  {t.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 min-h-[32px] leading-relaxed">
                  {t.desc}
                </p>
                
                <div className="mt-6 mb-8 border-b border-slate-800 pb-8 flex items-end">
                  <>
                    <span className="text-5xl font-black text-white tracking-tighter">
                      ${price}
                    </span>
                    <span className="text-lg text-slate-400 ml-1 mb-1">/month</span>
                    
                    {billing === "annual" && t.monthlyPrice > 0 && (
                      <div className="absolute top-[138px] left-8 mt-1">
                        <span className="text-sm text-slate-500 line-through">
                          ${t.monthlyPrice}/month
                        </span>
                      </div>
                    )}
                  </>
                </div>

                <ul className="space-y-4 flex-1 mb-8">
                  {t.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-sm leading-tight"
                    >
                      {f.ok ? (
                        <Check className="w-5 h-5 text-teal-400 shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      
                      <span className={f.ok ? "text-slate-200 mt-0.5" : "text-slate-600 mt-0.5"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {loadingConfig ? (
                  <div className="w-full h-[50px] bg-slate-800 animate-pulse rounded-xl"></div>
                ) : (
                  <button
                    onClick={btnConfig.action}
                    disabled={btnConfig.disabled}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      btnConfig.disabled 
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800"
                        : t.popular 
                          ? "bg-teal-500 text-white hover:bg-teal-400 shadow-[0_0_15px_rgba(13,148,136,0.5)] border-transparent"
                          : "border border-slate-600 text-slate-200 hover:border-teal-500 hover:text-teal-400 bg-transparent"
                    }`}
                  >
                    {btnConfig.text}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black tracking-tighter text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-[#0f1629] border border-slate-800 rounded-2xl overflow-hidden p-6"
              >
                <h3 className="text-white font-bold mb-2 tracking-tight">{faq.q}</h3>
                <div className="h-px w-full bg-slate-800 mb-3" />
                <p className="text-sm text-slate-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080d1a] border-t border-slate-800 py-8 text-center text-xs text-slate-600">
        <p>© 2026 Phish-Slayer. Built by MinionCore.</p>
      </footer>
    </div>
  );
}
