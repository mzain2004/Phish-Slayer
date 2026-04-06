"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Shield, Play, Network, Star, Twitter, Linkedin, Github, X, Search, Bell, LayoutDashboard, Terminal, ShieldAlert, CreditCard, Activity, Server, ArrowRight, CheckSquare, MessageSquare, Download, Settings, User, Key, Cpu, Lock, Camera, Apple, Laptop, Bug, MessageCircle, RefreshCw, AlertTriangle, FlaskConical, Monitor, Upload } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';

const glassCard = "bg-white/5 backdrop-blur-3xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-2xl";

const BlurText = ({ text, className }: { text: string, className?: string }) => {
  const words = text.split(" ");
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({ opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.04 * i } }),
  };
  const child = {
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, damping: 12, stiffness: 100 } },
    hidden: { opacity: 0, y: 50, filter: "blur(10px)", transition: { type: "spring" as const, damping: 12, stiffness: 100 } },
  };
  return (
    <motion.div style={{ display: "inline-flex", flexWrap: "wrap" }} variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }} className={className}>
      {words.map((word, index) => (
        <motion.span variants={child} style={{ marginRight: "0.25em" }} key={index}>{word}</motion.span>
      ))}
    </motion.div>
  );
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const ScrollRevealText = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "center center"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);
  return <motion.div ref={ref} style={{ opacity }} className={className}>{children}</motion.div>;
};

const staggerGrid = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const gridItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const tactileProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
};

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6], x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#A78BFA] opacity-20 blur-[150px]"
        ></motion.div>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6], x: [0, -20, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#2DD4BF] opacity-20 blur-[150px]"
        ></motion.div>
        <div className="absolute top-[30%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-[#A78BFA] opacity-10 blur-[150px]"></div>
      </div>

      {/* Hero Section */}
      <motion.section
        whileHover={{ filter: "drop-shadow(0 0 60px rgba(167, 139, 250, 0.15))" }}
        className="w-full max-w-5xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center transition-all duration-700"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 ${glassCard}`}>
          <span className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse"></span>
          <span className="text-sm font-medium text-white/80">AI Threat Detection Active</span>
        </div>

        <motion.h1
          initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-space-grotesk text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight uppercase"
        >
          Neutralize threats instantly.
          <br />
          Eliminate dwell time forever.
        </motion.h1>

        <p className="text-lg md:text-xl text-white/70 max-w-3xl mb-10 leading-relaxed">
          Experience immediate, automated defense with real-time visibility, eliminating risks before impact.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/auth/signup">
            <motion.button
              {...tactileProps}
              className="bg-[#2DD4BF] text-black font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center gap-2 group"
            >
              ACTIVATE FREE TRIAL NOW
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </Link>
          <motion.button
            {...tactileProps}
            className={`px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all flex items-center gap-2 ${glassCard}`}
          >
            <Play className="w-4 h-4" />
            WATCH DEMO
          </motion.button>
        </div>
      </motion.section>

      {/* Our Process */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24">
        <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold text-center mb-16 uppercase tracking-widest">Our Process</h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerGrid}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { num: "01", title: "Detection", desc: "Scan & Spot early threats with AI-powered speed." },
            { num: "02", title: "Isolation", desc: "Contain suspicious activity automatically to prevent spread." },
            { num: "03", title: "Analysis", desc: "Deep dive into threat behavior for actionable intel." },
            { num: "04", title: "Neutralization", desc: "Eliminate risks and fortify your defenses." }
          ].map((step, i) => (
            <motion.div variants={gridItem} {...tactileProps} key={i} className={`p-8 flex flex-col ${glassCard} hover:bg-white/10 transition-colors`}>
              <span className="font-space-grotesk text-5xl font-light text-white/20 mb-6">{step.num}</span>
              <h3 className="font-space-grotesk text-2xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-white/70 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Our Purpose */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center">
        <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold mb-6 uppercase tracking-widest">Our Purpose</h2>
        <p className="text-white/70 max-w-2xl mb-16">
          To secure your digital future by eliminating threats at the source, creating a world where cyber safety is seamless and proactive for everyone.
        </p>

        <div className="relative w-full max-w-3xl aspect-[2/1] mb-12 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
          <Image
            src="https://picsum.photos/seed/team/1200/600"
            alt="Team"
            fill
            className="object-cover opacity-60 grayscale"
            referrerPolicy="no-referrer"
          />
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerGrid}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-20 -mt-24"
        >
          <motion.div variants={gridItem} {...tactileProps} className={`p-8 text-left ${glassCard}`}>
            <div className="w-10 h-10 rounded-full bg-[#A78BFA]/20 flex items-center justify-center mb-6">
              <Shield className="w-5 h-5 text-[#A78BFA]" />
            </div>
            <h3 className="font-space-grotesk text-2xl font-bold text-white mb-3">Our Mission</h3>
            <p className="text-white/70">To secure your digital future by eliminating threats at the source.</p>
          </motion.div>
          <motion.div variants={gridItem} {...tactileProps} className={`p-8 text-left ${glassCard}`}>
            <div className="w-10 h-10 rounded-full bg-[#2DD4BF]/20 flex items-center justify-center mb-6">
              <Network className="w-5 h-5 text-[#2DD4BF]" />
            </div>
            <h3 className="font-space-grotesk text-2xl font-bold text-white mb-3">Our Vision</h3>
            <p className="text-white/70">A world where cyber safety is seamless and proactive for everyone.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* What Our Users Say */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24">
        <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold text-center mb-16 uppercase tracking-widest">What Our Users Say</h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerGrid}
          className="flex flex-col md:flex-row items-center justify-center gap-6"
        >
          {/* Left Card (Faded) */}
          <motion.div variants={gridItem} className={`p-6 w-full md:w-1/3 opacity-50 scale-95 ${glassCard}`}>
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#2DD4BF] text-[#2DD4BF]" />)}
            </div>
            <p className="text-white/70 mb-6 line-clamp-3">&quot;Incredible visibility into our network. We spotted anomalies we never would have seen otherwise.&quot;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20"></div>
              <div>
                <div className="font-medium text-white">Sarah Jenkins</div>
                <div className="text-xs text-white/50">CISO, TechCorp</div>
              </div>
            </div>
          </motion.div>

          {/* Center Card (Active) */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-8 w-full md:w-1/3 z-10 border-[#2DD4BF]/30 ${glassCard}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-[#2DD4BF] text-[#2DD4BF]" />)}
              </div>
              <span className="text-xs font-bold bg-[#A78BFA]/20 text-[#A78BFA] px-2 py-1 rounded">G2</span>
            </div>
            <p className="text-xl font-medium text-white mb-8 leading-relaxed">&quot;Phish-Slayer instantly found and stopped a major attack. Our team is finally secure!&quot;</p>
            <div className="flex items-center gap-4">
              <Image src="https://picsum.photos/seed/avatar1/100/100" alt="Tomas Faster" width={48} height={48} className="rounded-full" referrerPolicy="no-referrer" />
              <div>
                <div className="font-bold text-white">Tomas Faster</div>
                <div className="text-sm text-white/50">Director of IT</div>
              </div>
            </div>
          </motion.div>

          {/* Right Card (Faded) */}
          <motion.div variants={gridItem} className={`p-6 w-full md:w-1/3 opacity-50 scale-95 ${glassCard}`}>
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-[#2DD4BF] text-[#2DD4BF]" />)}
            </div>
            <p className="text-white/70 mb-6 line-clamp-3">&quot;The automated playbooks have reduced our MTTR by 80%. It&apos;s like having another analyst on the team.&quot;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20"></div>
              <div>
                <div className="font-medium text-white">Michael Chen</div>
                <div className="text-xs text-white/50">SecOps Lead</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="flex justify-center gap-2 mt-8">
          <div className="w-2 h-2 rounded-full bg-white/20"></div>
          <div className="w-6 h-2 rounded-full bg-[#2DD4BF]"></div>
          <div className="w-2 h-2 rounded-full bg-white/20"></div>
          <div className="w-2 h-2 rounded-full bg-white/20"></div>
        </div>
      </section>

      {/* Live Threat Monitoring */}
      <section className="w-full max-w-5xl mx-auto px-6 py-24 flex flex-col items-center">
        <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold text-center mb-4 uppercase tracking-widest">Live Threat Monitoring</h2>
        <p className="text-white/70 text-center mb-12">Monitor your entire security posture in real-time with our interactive dashboard.</p>

        <motion.div {...tactileProps} className={`w-full p-2 ${glassCard}`}>
          <div className="w-full aspect-[16/9] rounded-xl bg-black/50 border border-white/5 relative overflow-hidden flex items-center justify-center">
            {/* Mock Dashboard UI */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="bg-white/10 px-4 py-1 rounded-full text-xs text-white/50 border border-white/5">Threat Landscape View</div>
            </div>

            {/* Abstract Network Graph Mock */}
            <div className="relative w-full h-full flex items-center justify-center opacity-80">
              <div className="absolute w-64 h-64 rounded-full border border-[#A78BFA]/30 animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute w-96 h-96 rounded-full border border-[#2DD4BF]/20 animate-[spin_40s_linear_infinite_reverse]"></div>
              <div className="absolute w-32 h-32 rounded-full bg-[#A78BFA]/10 blur-xl"></div>
              <Network className="w-16 h-16 text-[#2DD4BF] relative z-10" />

              {/* Nodes */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                  style={{
                    top: `${(50 + 35 * Math.sin(i * 30 * Math.PI / 180)).toFixed(4)}%`,
                    left: `${(50 + 35 * Math.cos(i * 30 * Math.PI / 180)).toFixed(4)}%`,
                  }}
                >
                  {i % 3 === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#A78BFA]/40 animate-ping"></div>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Choose Your Plan */}
      <section id="pricing" className="w-full max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-space-grotesk text-3xl md:text-4xl font-bold text-center mb-16 uppercase tracking-widest">Choose Your Plan</h2>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerGrid}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
        >
          {/* Starter */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-8 ${glassCard}`}>
            <h3 className="font-space-grotesk text-2xl font-bold text-white mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-white/50">/month</span>
            </div>
            <p className="text-white/70 mb-8 h-12">Get started with essential protection.</p>
            <Link href="/auth/signup">
              <motion.button {...tactileProps} className="w-full py-3 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors font-medium">
                Get Started
              </motion.button>
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-8 relative transform md:-translate-y-4 border-[#2DD4BF]/50 shadow-[0_0_30px_rgba(45,212,191,0.15)] ${glassCard}`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2DD4BF] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="font-space-grotesk text-2xl font-bold text-white mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold text-white">$20</span>
              <span className="text-white/50">/month</span>
            </div>
            <p className="text-white/70 mb-8 h-12">Advanced features for growing teams.</p>
            <Link href="/auth/signup">
              <motion.button
                {...tactileProps}
                className="w-full py-3 rounded-full bg-[#2DD4BF] text-black transition-all duration-300 font-bold"
              >
                Start Free Trial
              </motion.button>
            </Link>
          </motion.div>

          {/* Enterprise */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-8 ${glassCard}`}>
            <h3 className="font-space-grotesk text-2xl font-bold text-white mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">$250</span>
              <span className="text-white/50">/month</span>
            </div>
            <p className="text-white/70 mb-8 h-12">Full scale protection and support.</p>
            <motion.button {...tactileProps} className="w-full py-3 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors font-medium">
              Contact Sales
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12 mb-24">
        <motion.div {...tactileProps} className={`p-12 md:p-16 flex flex-col items-center text-center ${glassCard} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-b from-[#A78BFA]/10 to-transparent pointer-events-none"></div>
          <h2 className="font-space-grotesk text-3xl md:text-5xl font-bold text-white mb-4 relative z-10 uppercase tracking-tight">Secure Your Future Today</h2>
          <p className="text-white/70 mb-10 relative z-10 text-lg">Secure your organization today. Join thousands of protected users.</p>

          <div className="flex flex-col sm:flex-row w-full max-w-md gap-3 relative z-10">
            <input
              type="email"
              placeholder="Enter email"
              className="flex-1 bg-black/50 border border-white/10 rounded-full px-6 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors"
            />
            <Link href="/auth/signup">
              <motion.button
                {...tactileProps}
                className="bg-[#2DD4BF] text-black font-semibold px-8 py-3 rounded-full transition-all duration-300 whitespace-nowrap hover:bg-[#14B8A6] hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]"
              >
                Sign Up Free
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#050505] border-t border-white/5 pt-20 pb-10 px-6 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={staggerGrid}
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16"
        >
          {/* Brand & Desc */}
          <motion.div variants={gridItem} className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-white" />
              <span className="font-space-grotesk font-bold text-2xl tracking-tight text-white">Phish-Slayer</span>
            </div>
            <p className="text-white/60 max-w-sm leading-relaxed">
              Cut MTTR and secure your enterprise with identity-first incident response and automation.
            </p>
          </motion.div>

          {/* Product Links */}
          <motion.div variants={gridItem}>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4">
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Features</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">AI Agent</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Protocols</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Dashboard</motion.a></li>
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div variants={gridItem}>
            <h4 className="font-bold text-white mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Docs</motion.a></li>
              <li><motion.a {...tactileProps} href="#pricing" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Pricing</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Blog</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Support</motion.a></li>
            </ul>
          </motion.div>

          {/* Legal & Contact */}
          <motion.div variants={gridItem}>
            <h4 className="font-bold text-white mb-6">Legal & Contact</h4>
            <ul className="space-y-4 mb-8">
              <li><motion.a {...tactileProps} href="/privacy" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Privacy</motion.a></li>
              <li><motion.a {...tactileProps} href="/terms" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Terms</motion.a></li>
            </ul>
            <div className="flex gap-4 mb-8">
              <motion.a {...tactileProps} href="#" className="text-white/60 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></motion.a>
              <motion.a {...tactileProps} href="#" className="text-white/60 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></motion.a>
              <motion.a {...tactileProps} href="#" className="text-white/60 hover:text-white transition-colors"><Github className="w-5 h-5" /></motion.a>
            </div>

            <h4 className="font-bold text-white mb-4 text-sm">Subscribe</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 w-full"
              />
              <motion.button
                {...tactileProps}
                className="bg-[#2DD4BF] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all duration-300 hover:bg-[#14B8A6] hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]"
              >
                Subscribe
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10 text-sm text-white/40">
          <p>© 2026 Phish-Slayer, Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
