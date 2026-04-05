"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Shield, Play, Network, Star, Twitter, Linkedin, Github, X, Search, Bell, LayoutDashboard, Terminal, ShieldAlert, CreditCard, LifeBuoy, ChevronDown, Activity, Server, Lightbulb, ArrowRight, CheckSquare, PlayCircle, PhoneCall, ListTodo, MessageSquare, Bookmark, Link2, AlertTriangle, Download, Settings, User, Key, Cpu, Lock, Eye, EyeOff, Trash2, ExternalLink, RefreshCw, MessageCircle, Monitor, FlaskConical, Upload, Camera, Apple, Laptop, Bug, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import GlobalSupportWidget from '@/components/GlobalSupportWidget';

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

const AuthModal = ({ initialView, onClose, onLogin }: { initialView: string, onClose: () => void, onLogin: () => void }) => {
  const [view, setView] = useState(initialView);

  return (
    <div className={`relative w-full max-w-md p-8 ${glassCard} flex flex-col`} onClick={(e) => e.stopPropagation()}>
      <motion.button {...tactileProps} onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
        <X className="w-5 h-5" />
      </motion.button>
      
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF] flex items-center justify-center">
          <Shield className="w-4 h-4 text-black" />
        </div>
        <span className="font-space-grotesk font-bold text-xl tracking-tight text-white">Phish-Slayer</span>
      </div>

      {view === 'login' && (
        <>
          <h2 className="font-space-grotesk text-2xl font-bold text-white mb-2 text-center">Welcome back</h2>
          <p className="text-white/50 text-center mb-6 text-sm">Log in to your account to continue</p>
          
          <div className="flex flex-col gap-4 mb-6">
            <motion.button {...tactileProps} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </motion.button>
            <motion.button {...tactileProps} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#24292F] text-white font-medium hover:bg-[#24292F]/90 transition-colors">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </motion.button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative bg-[#050505] px-4 text-xs text-white/50 uppercase">Or continue with email</span>
          </div>

          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <input type="email" placeholder="Email address" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors" />
            <input type="password" placeholder="Password" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors" />
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" className="rounded border-white/10 bg-black/50 text-[#2DD4BF] focus:ring-[#2DD4BF]/50" />
                Remember me
              </label>
              <motion.button {...tactileProps} type="button" onClick={() => setView('forgot')} className="text-xs text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors">Forgot password?</motion.button>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#14B8A6", boxShadow: "0 0 15px rgba(45,212,191,0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.preventDefault(); onLogin(); }}
              className="w-full bg-[#2DD4BF] text-black font-semibold py-2.5 rounded-lg transition-colors duration-300 mt-2"
            >
              Log In
            </motion.button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            Don&apos;t have an account? <motion.button {...tactileProps} onClick={() => setView('signup')} className="text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors font-medium">Sign up</motion.button>
          </p>
        </>
      )}

      {view === 'signup' && (
        <>
          <h2 className="font-space-grotesk text-2xl font-bold text-white mb-2 text-center">Create an account</h2>
          <p className="text-white/50 text-center mb-6 text-sm">Join Phish-Slayer today</p>
          
          <div className="flex flex-col gap-4 mb-6">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-black font-medium hover:bg-white/90 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign up with Google
            </button>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#24292F] text-white font-medium hover:bg-[#24292F]/90 transition-colors">
              <Github className="w-5 h-5" />
              Sign up with GitHub
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <span className="relative bg-[#050505] px-4 text-xs text-white/50 uppercase">Or continue with email</span>
          </div>

          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <input type="text" placeholder="Full name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors" />
            <input type="email" placeholder="Email address" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors" />
            <input type="password" placeholder="Password" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors" />
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#14B8A6", boxShadow: "0 0 15px rgba(45,212,191,0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.preventDefault(); onLogin(); }}
              className="w-full bg-[#2DD4BF] text-black font-semibold py-2.5 rounded-lg transition-colors duration-300 mt-2"
            >
              Create Account
            </motion.button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            Already have an account? <button onClick={() => setView('login')} className="text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors font-medium">Log in</button>
          </p>
        </>
      )}

      {view === 'forgot' && (
        <>
          <h2 className="font-space-grotesk text-2xl font-bold text-white mb-2 text-center">Reset password</h2>
          <p className="text-white/50 text-center mb-6 text-sm">Enter your email to receive a reset link</p>
          
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); setView('reset'); }}>
            <input type="email" placeholder="Email address" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors" />
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#14B8A6", boxShadow: "0 0 15px rgba(45,212,191,0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-[#2DD4BF] text-black font-semibold py-2.5 rounded-lg transition-colors duration-300 mt-2"
            >
              Send Reset Link
            </motion.button>
          </form>

          <p className="text-center text-sm text-white/50 mt-6">
            Remember your password? <button onClick={() => setView('login')} className="text-[#2DD4BF] hover:text-[#2DD4BF]/80 transition-colors font-medium">Log in</button>
          </p>
        </>
      )}

      {view === 'reset' && (
        <>
          <h2 className="font-space-grotesk text-2xl font-bold text-white mb-2 text-center">Check your email</h2>
          <p className="text-white/50 text-center mb-6 text-sm">We&apos;ve sent a password reset link to your email address.</p>
          
          <button onClick={() => setView('login')} className="w-full bg-white/10 text-white font-semibold py-2.5 rounded-lg hover:bg-white/20 transition-colors mt-2">Back to Log In</button>
        </>
      )}
    </div>
  );
};

const CommandCenter = () => {
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

  const handleRunDiagnostic = () => {
    setIsDiagnosticRunning(true);
    // Simulate API call
    setTimeout(() => {
      setIsDiagnosticRunning(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Row (KPIs) */}
      <motion.div 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true }} 
        variants={staggerGrid} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Metric 1 */}
        <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-2`}>
          <div className="flex justify-between items-start">
            <span className="text-white/70 font-medium">Time to Contain</span>
            <span className="px-2 py-0.5 rounded-full bg-[#2DD4BF]/10 text-[#2DD4BF] text-xs font-bold border border-[#2DD4BF]/20 shadow-[0_0_10px_rgba(45,212,191,0.2)]">-8%</span>
          </div>
          <div className="font-space-grotesk text-3xl font-bold text-white mt-2">00:12:34</div>
        </motion.div>
        
        {/* Metric 2 */}
        <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-2`}>
          <div className="flex justify-between items-start">
            <span className="text-white/70 font-medium">Active Incidents</span>
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">+2</span>
          </div>
          <div className="font-space-grotesk text-3xl font-bold text-white mt-2 shiny-text shiny-red">42</div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-2`}>
          <div className="flex justify-between items-start">
            <span className="text-white/70 font-medium">API Latency</span>
          </div>
          <div className="font-space-grotesk text-3xl font-bold text-white mt-2">14ms</div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-2`}>
          <div className="flex justify-between items-start">
            <span className="text-white/70 font-medium">Global Risk Score</span>
          </div>
          <div className="font-space-grotesk text-3xl font-bold text-[#2DD4BF] mt-2 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)] shiny-text shiny-teal">98/100</div>
        </motion.div>
      </motion.div>

      {/* Middle Row: Network Telemetry */}
      <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-6`}>
        <div className="flex justify-between items-center">
          <h2 className="font-space-grotesk text-xl font-bold text-white">Network Telemetry (Live)</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-white/50 uppercase tracking-wider">Live</span>
          </div>
        </div>
        
        {/* Dense Bar Chart / Wave Graph Placeholder */}
        <div className="w-full h-64 relative flex items-end justify-between gap-[2px] pt-6 overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-[1px] bg-white border-b border-white/5"></div>
            ))}
          </div>
          {/* Bars */}
          <div className="flex-1 flex items-end justify-between gap-[2px] h-full z-10">
            {[...Array(80)].map((_, i) => {
              const height = 20 + ((Math.sin(i * 0.2) * 40) + 40); // Pseudo-random wave
              const isPurple = i % 5 === 0;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-t-sm transition-all duration-500 ${isPurple ? 'bg-[#A78BFA]/60 shadow-[0_0_10px_rgba(167,139,250,0.3)]' : 'bg-[#2DD4BF]/40 shadow-[0_0_10px_rgba(45,212,191,0.2)]'}`}
                  style={{ height: `${height}%` }}
                ></div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Bottom Row (Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quick Actions */}
        <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-4`}>
          <h2 className="font-space-grotesk text-xl font-bold text-white mb-2">Quick Actions</h2>
          <motion.div 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true }} 
            variants={staggerGrid} 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <motion.button 
              variants={gridItem}
              {...tactileProps}
              onClick={handleRunDiagnostic}
              disabled={isDiagnosticRunning}
              className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiagnosticRunning ? (
                <RefreshCw className="w-6 h-6 text-[#2DD4BF] animate-spin" />
              ) : (
                <Activity className="w-6 h-6 text-[#2DD4BF]" />
              )}
              <span className="text-sm font-bold text-white">
                {isDiagnosticRunning ? 'Running Diagnostic...' : 'Run System Diagnostic ⚡'}
              </span>
            </motion.button>
            <motion.button 
              variants={gridItem}
              {...tactileProps}
              className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 text-center transition-colors"
            >
              <Shield className="w-6 h-6 text-white" />
              <span className="text-sm font-bold text-white">Isolate Compromised Nodes 🔒</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right: Event Feed */}
        <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-4`}>
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-space-grotesk text-xl font-bold text-white">Event Feed</h2>
            <motion.button {...tactileProps} className="text-xs text-[#2DD4BF] hover:underline">View All</motion.button>
          </div>
          <motion.div 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true }} 
            variants={staggerGrid} 
            className="flex flex-col gap-3"
          >
            <motion.div variants={gridItem} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-sm text-white/90 font-medium">Agent Nova escalated privilege</span>
                <span className="text-xs text-white/50">2 mins ago • System-level</span>
              </div>
            </motion.div>
            <motion.div variants={gridItem} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-sm text-white/90 font-medium">Failed login from unknown IP</span>
                <span className="text-xs text-white/50">15 mins ago • 192.168.1.45</span>
              </div>
            </motion.div>
            <motion.div variants={gridItem} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#2DD4BF] mt-1.5 shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-sm text-white/90 font-medium">Automated containment successful</span>
                <span className="text-xs text-white/50">1 hour ago • Node MKT-LAP-03</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

const ProtocolToggle = ({ title, defaultActive }: { title: string, defaultActive: boolean }) => {
  const [active, setActive] = useState(defaultActive);
  
  return (
    <div className={`p-6 ${glassCard} flex items-center justify-between`}>
      <span className="font-medium text-lg">{title}</span>
      <motion.button 
        {...tactileProps}
        onClick={() => setActive(!active)}
        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-[#2DD4BF] shadow-[0_0_15px_rgba(45,212,191,0.5)]' : 'bg-white/10'}`}
      >
        <motion.div 
          layout
          className={`w-6 h-6 rounded-full bg-white shadow-sm ${active ? 'ml-auto' : ''}`}
        />
      </motion.button>
    </div>
  );
};

const SystemProtocols = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card */}
      <motion.div {...tactileProps} className={`w-full p-6 ${glassCard} flex items-center gap-6`}>
        <Image src="https://picsum.photos/seed/avatar2/150/150" alt="Muhammad Zain" width={80} height={80} className="rounded-full border-2 border-white/20" referrerPolicy="no-referrer" />
        <div className="flex flex-col">
          <h2 className="font-space-grotesk text-2xl font-bold text-white">Muhammad Zain</h2>
          <p className="text-[#2DD4BF] font-medium">Lead SOC Analyst</p>
          <p className="text-white/50 text-sm">Clearance: Tier 1</p>
        </div>
      </motion.div>

      {/* Main Grid (Bento Layout) */}
      <motion.div 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true }} 
        variants={staggerGrid}
      >
        <h3 className="font-space-grotesk text-xl font-bold mb-4">Active Defense Protocols</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={gridItem}><ProtocolToggle title="Auto-Neutralize Payloads" defaultActive={true} /></motion.div>
          <motion.div variants={gridItem}><ProtocolToggle title="Strict Time Normalization" defaultActive={false} /></motion.div>
          <motion.div variants={gridItem}><ProtocolToggle title="Aggressive IP Blocking" defaultActive={true} /></motion.div>
          <motion.div variants={gridItem}><ProtocolToggle title="AI Autonomous Triaging" defaultActive={true} /></motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={!active ? { scale: 1.02, filter: "brightness(1.1)" } : {}}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 w-full text-left overflow-hidden ${
        active 
          ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20' 
          : 'text-white/70 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-5 h-5 z-10" />
      <span className="z-10">{label}</span>
      {!active && (
        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#2DD4BF]/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-t-full" />
      )}
    </motion.button>
  );
};

const AIAgentView = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
      {/* Column 1: Session Lineage & Context */}
      <motion.div {...tactileProps} className={`lg:col-span-4 p-6 flex flex-col ${glassCard}`}>
        <h3 className="font-space-grotesk text-xl font-bold mb-8 text-white">Session Lineage & Context</h3>
        <div className="flex-1 relative pl-4">
          {/* Thin teal left border */}
          <div className="absolute top-2 bottom-2 left-0 w-[2px] bg-[#2DD4BF]/30"></div>
          <motion.div 
            initial="hidden" 
            whileInView="show" 
            viewport={{ once: true }} 
            variants={staggerGrid} 
            className="flex flex-col gap-8 relative z-10"
          >
            {/* Node 1 */}
            <motion.div variants={gridItem} className="relative">
              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <p className="text-sm text-white/90 font-medium">10:42 AM - User Auth (Okta: alex.hart)</p>
            </motion.div>
            {/* Node 2 */}
            <motion.div variants={gridItem} className="relative">
              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#2DD4BF] shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
              <p className="text-sm text-white/90 font-medium">10:43 AM - Device Binding (MKT-LAP-03)</p>
            </motion.div>
            {/* Node 3 */}
            <motion.div variants={gridItem} className="relative">
              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
              <p className="text-sm text-white/90 font-medium">11:15 AM - Privilege Escalation (Admin_Billing)</p>
            </motion.div>
            {/* Node 4 */}
            <motion.div variants={gridItem} className="relative">
              <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
              <p className="text-sm text-white/90 font-medium">11:18 AM - Suspicious Action (Mass Export)</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Column 2: Gemini Threat Terminal */}
      <motion.div {...tactileProps} className={`lg:col-span-8 p-6 flex flex-col ${glassCard}`}>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <Terminal className="w-5 h-5 text-[#2DD4BF]" />
          <h3 className="font-space-grotesk text-xl font-bold text-white">Agent Workspace (LLM-v3.1) — <span className="text-white/50 font-normal">Confidence: 0.87</span></h3>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 mb-6 pr-2">
          {/* User Message */}
          <motion.div {...tactileProps} className="flex justify-end">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl rounded-tr-sm p-4 max-w-[80%] text-white/90 text-sm">
              Analyze the recent privilege escalation attempt on MKT-LAP-03.
            </div>
          </motion.div>
          
          {/* AI Response */}
          <motion.div {...tactileProps} className="flex justify-start">
            <ScrollRevealText className="bg-[#2DD4BF]/10 backdrop-blur-md border border-[#2DD4BF]/30 shadow-[0_0_15px_rgba(45,212,191,0.15)] rounded-2xl rounded-tl-sm p-4 max-w-[80%] text-[#2DD4BF] text-sm leading-relaxed">
              Analysis complete. User &apos;alex.hart&apos; authenticated normally but immediately bound an unrecognized device from an external IP subnet. Recommended Action: Isolate host and revoke active sessions.
            </ScrollRevealText>
          </motion.div>
        </div>

        {/* Bottom Input Area */}
        <div className={`p-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex gap-3 mt-auto`}>
          <input 
            type="text" 
            placeholder="Type a command..." 
            className="flex-1 bg-transparent border-none px-4 py-2 text-white placeholder:text-white/30 focus:outline-none font-mono text-sm"
          />
          <motion.button 
            {...tactileProps}
            className="bg-[#2DD4BF] text-black font-bold px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-sm hover:bg-[#14B8A6] hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]"
          >
            Run Containment ⚡
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const BillingView = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Top Grid */}
      <motion.div 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true }} 
        variants={staggerGrid} 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Card 1: Current Plan */}
        <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col justify-between`}>
          <div>
            <h2 className="font-space-grotesk text-xl font-bold text-white mb-2">Current Plan: Command & Control Tier</h2>
            <p className="text-sm text-white/50 mb-6">Enterprise-grade security and unlimited telemetry.</p>
          </div>
          <div className="flex justify-start">
            <motion.button 
              {...tactileProps}
              className="bg-[#2DD4BF] text-black font-bold px-6 py-2.5 rounded-xl transition-all duration-300 text-sm"
            >
              Upgrade Plan
            </motion.button>
          </div>
        </motion.div>

        {/* Card 2: API Usage */}
        <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col justify-center`}>
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-space-grotesk text-xl font-bold text-white">API Usage</h2>
            <span className="text-sm font-mono text-[#2DD4BF]">8.4M / 10M calls used</span>
          </div>
          <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/10 relative">
            <div className="absolute top-0 left-0 bottom-0 bg-[#2DD4BF] w-[84%] shadow-[0_0_15px_rgba(45,212,191,0.8)]"></div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Middle & Bottom Sections) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Payment Methods */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard}`}>
            <h3 className="font-space-grotesk text-lg font-bold text-white mb-4">Payment Methods</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 flex-1">
                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center font-bold text-white/80 italic border border-white/20">
                  Visa
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">•••• 4242</span>
                  <span className="text-xs text-white/50">Expires 12/28</span>
                </div>
                <div className="ml-auto px-2 py-1 rounded bg-white/10 text-xs text-white/70">Default</div>
              </div>
              <motion.button {...tactileProps} className="px-6 py-4 rounded-xl bg-transparent border border-white/20 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-dashed flex-1 sm:flex-none text-center">
                + Add new card
              </motion.button>
            </div>
          </motion.div>

          {/* Billing History */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-space-grotesk text-lg font-bold text-white">Billing History</h3>
              <motion.button {...tactileProps} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" /> Download All
              </motion.button>
            </div>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider bg-white/5">
                    <th className="py-4 px-6 font-medium">Date</th>
                    <th className="py-4 px-6 font-medium">Invoice ID</th>
                    <th className="py-4 px-6 font-medium">Amount</th>
                    <th className="py-4 px-6 font-medium">Status</th>
                    <th className="py-4 px-6 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <motion.tbody 
                  initial="hidden" 
                  whileInView="show" 
                  viewport={{ once: true }} 
                  variants={staggerGrid} 
                  className="text-sm text-white/90"
                >
                  <motion.tr variants={gridItem} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">Apr 01, 2026</td>
                    <td className="py-4 px-6 font-mono text-white/70">INV-2026-04</td>
                    <td className="py-4 px-6 font-medium">$299.00</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30 shadow-[0_0_10px_rgba(45,212,191,0.2)]">Paid</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <motion.button {...tactileProps} className="text-white/50 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                  <motion.tr variants={gridItem} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">Mar 01, 2026</td>
                    <td className="py-4 px-6 font-mono text-white/70">INV-2026-03</td>
                    <td className="py-4 px-6 font-medium">$299.00</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30 shadow-[0_0_10px_rgba(45,212,191,0.2)]">Paid</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <motion.button {...tactileProps} className="text-white/50 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                  <motion.tr variants={gridItem} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">Feb 01, 2026</td>
                    <td className="py-4 px-6 font-mono text-white/70">INV-2026-02</td>
                    <td className="py-4 px-6 font-medium">$299.00</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30 shadow-[0_0_10px_rgba(45,212,191,0.2)]">Paid</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <motion.button {...tactileProps} className="text-white/50 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                </motion.tbody>
              </table>
            </div>
          </motion.div>

        </div>

        {/* Right Column (FAQ & Support) */}
        <div className="flex flex-col gap-6">
          <motion.div {...tactileProps} className={`p-6 ${glassCard}`}>
            <span className="text-xs text-white/50 mb-1 block">FAQ</span>
            <h3 className="font-space-grotesk text-lg font-bold text-white mb-4">Enterprise contracts & trial billing</h3>
            <ul className="text-sm text-white/80 space-y-3 list-disc pl-4">
              <li>Enterprise contracts can include custom SLAs, dedicated support and consolidated invoicing.</li>
              <li>Trial accounts are not charged until converted; any trial overage is credited or billed per agreement.</li>
              <li>For questions about prorations, billing cycles, or refunds contact <a href="#" className="text-[#2DD4BF] hover:underline">enterprise-sales@phishslayer.com</a>.</li>
            </ul>
            <div className="flex gap-3 mt-6">
              <motion.button {...tactileProps} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors">Contact Sales</motion.button>
              <motion.button {...tactileProps} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors">Open Ticket</motion.button>
            </div>
          </motion.div>

          <motion.div {...tactileProps} className={`p-6 ${glassCard}`}>
            <span className="text-xs text-white/50 mb-1 block">Need tailored pricing?</span>
            <h3 className="font-space-grotesk text-lg font-bold text-white mb-2">Enterprise plan</h3>
            <p className="text-sm text-white/70 mb-4">Get a dedicated account manager, custom integrations, and priority support.</p>
            <motion.button {...tactileProps} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors">Request Quote</motion.button>
          </motion.div>

          <motion.div {...tactileProps} className={`p-6 ${glassCard}`}>
            <span className="text-xs text-white/50 mb-1 block">Support</span>
            <h3 className="font-space-grotesk text-lg font-bold text-white mb-2">Billing help</h3>
            <div className="text-sm text-white/70 mb-4 space-y-1">
              <p>Email: support@phishslayer.com</p>
              <p>Phone: +1 (800) 555-0190 (Mon-Fri, 9am-6pm PT)</p>
            </div>
            <motion.button {...tactileProps} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-colors">Chat with Support</motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState('Muhammad Zain');
  const [email, setEmail] = useState('zain@phishslayer.com');
  const [errors, setErrors] = useState({ fullName: '', email: '' });
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateFullName = (name: string) => {
    if (name.length < 3) {
      return 'Full name must be at least 3 characters long.';
    }
    return '';
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);
    setErrors(prev => ({ ...prev, fullName: validateFullName(value) }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setErrors(prev => ({ ...prev, email: validateEmail(value) }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* MFA Setup Modal Overlay */}
      <AnimatePresence>
        {showMFAModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowMFAModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg ${glassCard} p-8 flex flex-col gap-6 relative`}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowMFAModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-[#2DD4BF]/10 flex items-center justify-center mb-2">
                  <Shield className="w-8 h-8 text-[#2DD4BF]" />
                </div>
                <h2 className="font-space-grotesk text-2xl font-bold text-white">Configure MFA</h2>
                <p className="text-white/50 text-sm">Secure your account with TOTP (Authenticator App)</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-3">
                  <span className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider">Step 1: Scan QR Code</span>
                  <div className="w-40 h-40 bg-white mx-auto rounded-lg p-2 flex items-center justify-center">
                    {/* Placeholder for QR Code */}
                    <div className="w-full h-full bg-black/10 flex items-center justify-center text-black/20">
                      <RefreshCw className="w-8 h-8 animate-spin-slow" />
                    </div>
                  </div>
                  <p className="text-xs text-white/40 text-center italic">Scan this code with Google Authenticator or Authy</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Step 2: Enter 6-digit verification code</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <input key={i} type="text" maxLength={1} className="w-full h-12 bg-black/30 border border-white/10 rounded-lg text-center text-xl font-bold text-white focus:border-[#2DD4BF] outline-none transition-colors" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button {...tactileProps} onClick={() => setShowMFAModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-colors">Cancel</motion.button>
                <motion.button {...tactileProps} className="flex-1 py-3 rounded-xl bg-[#2DD4BF] text-black font-bold text-sm hover:bg-[#14B8A6] transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)]">Verify & Enable</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Column: Navigation */}
      <div className="lg:col-span-3">
        <motion.div 
          initial="hidden" 
          whileInView="show" 
          viewport={{ once: true }} 
          variants={staggerGrid} 
          className={`p-4 ${glassCard} flex flex-col gap-2`}
        >
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'security', label: 'Security & MFA', icon: Shield },
            { id: 'api', label: 'API Keys', icon: Key },
            { id: 'integrations', label: 'System Integrations', icon: Cpu },
          ].map((tab) => (
            <motion.button
              variants={gridItem}
              {...tactileProps}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20 shadow-[0_0_15px_rgba(45,212,191,0.1)]'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Right Column: Content */}
      <div className="lg:col-span-9 flex flex-col gap-6">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Header Card */}
            <motion.div {...tactileProps} className={`p-6 ${glassCard} flex items-center gap-6`}>
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF] flex items-center justify-center text-black font-bold text-2xl overflow-hidden">
                  {avatar ? (
                    <Image src={avatar} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    "MZ"
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="font-space-grotesk text-2xl font-bold text-white">{fullName}</h2>
                <label className="text-sm text-[#2DD4BF] hover:underline cursor-pointer">
                  Change Photo
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>
            </motion.div>

            {/* Details Form */}
            <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-6`}>
              <h3 className="font-space-grotesk text-lg font-bold text-white">Profile Details</h3>
              <motion.div 
                initial="hidden" 
                whileInView="show" 
                viewport={{ once: true }} 
                variants={staggerGrid} 
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <motion.div variants={gridItem} className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={handleFullNameChange}
                    className={`bg-black/30 border ${
                      errors.fullName ? 'border-red-500' : 'border-white/10'
                    } rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50 transition-colors`}
                  />
                  {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
                </motion.div>
                <motion.div variants={gridItem} className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`bg-black/30 border ${
                      errors.email ? 'border-red-500' : 'border-white/10'
                    } rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50 transition-colors`}
                  />
                  {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                </motion.div>
                <motion.div variants={gridItem} className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Role</label>
                  <input
                    type="text"
                    value="Lead SOC Analyst"
                    readOnly
                    className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/50 cursor-not-allowed"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Security Section */}
            <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-4`}>
              <div className="flex justify-between items-center">
                <h3 className="font-space-grotesk text-lg font-bold text-white">Two-Factor Authentication</h3>
                <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400">
                  Disabled
                </span>
              </div>
              <p className="text-sm text-white/50">Add an extra layer of security to your account by enabling two-factor authentication.</p>
              <motion.button 
                {...tactileProps}
                onClick={() => setShowMFAModal(true)}
                className="bg-[#2DD4BF] text-black font-bold px-6 py-2.5 rounded-xl transition-all duration-300 text-sm w-fit hover:bg-[#14B8A6] hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]"
              >
                Configure TOTP Authenticator
              </motion.button>
            </motion.div>

            {/* API Section */}
            <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-4`}>
              <h3 className="font-space-grotesk text-lg font-bold text-white">Personal API Keys</h3>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <code className="text-sm text-white/70 font-mono">pk_live_********************</code>
                <motion.button {...tactileProps} className="text-xs font-bold text-[#2DD4BF] hover:underline">Revoke</motion.button>
              </div>
              <motion.button {...tactileProps} className="px-6 py-2.5 rounded-xl bg-transparent border border-white/20 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-dashed text-center w-fit">
                Generate New Key
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Password Policy */}
            <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-6`}>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#2DD4BF]" />
                <h3 className="font-space-grotesk text-lg font-bold text-white">Password Policy</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Minimum Length</label>
                  <input type="number" defaultValue={12} className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Complexity</label>
                  <select className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50 appearance-none">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/50">Session Timeout</label>
                  <input type="number" defaultValue={30} className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
              </div>
              <div className="flex justify-end">
                <motion.button {...tactileProps} className="bg-[#2DD4BF] text-black font-bold px-8 py-3 rounded-xl transition-all duration-300 text-sm hover:bg-[#14B8A6] hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                  Update Policy
                </motion.button>
              </div>
            </motion.div>

            {/* Multi-Factor Auth */}
            <div className={`p-6 ${glassCard} flex flex-col gap-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-[#2DD4BF]" />
                  <h3 className="font-space-grotesk text-lg font-bold text-white">Multi-Factor Auth</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/50">Enforce MFA globally</span>
                  <button className="w-10 h-5 rounded-full bg-[#2DD4BF] relative shadow-[0_0_10px_rgba(45,212,191,0.5)]">
                    <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-black"></div>
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowMFAModal(true)}
                  className="flex-1 px-6 py-3 rounded-xl bg-transparent border border-white/20 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-dashed text-center"
                >
                  Configure TOTP (Authenticator)
                </button>
                <button className="flex-1 px-6 py-3 rounded-xl bg-transparent border border-white/20 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-dashed text-center">
                  Register Hardware Key (YubiKey)
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'api' && (
          <motion.div
            key="api"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <div className={`p-6 ${glassCard} flex items-center justify-between`}>
              <div className="flex flex-col gap-1">
                <h3 className="font-space-grotesk text-lg font-bold text-white">API Management</h3>
                <p className="text-sm text-white/50">Manage secret keys for programmatic access.</p>
              </div>
              <button className="bg-[#2DD4BF] text-black font-bold px-6 py-2.5 rounded-xl transition-all duration-300 text-sm hover:bg-[#14B8A6] hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                Generate New Secret Key ⚡
              </button>
            </div>

            <div className={`w-full ${glassCard} overflow-hidden`}>
              <div className="p-6 border-b border-white/10">
                <h3 className="font-space-grotesk text-lg font-bold text-white">Active Keys</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider bg-white/5">
                      <th className="py-4 px-6 font-medium">Key Name</th>
                      <th className="py-4 px-6 font-medium">Prefix</th>
                      <th className="py-4 px-6 font-medium">Permissions</th>
                      <th className="py-4 px-6 font-medium">Created</th>
                      <th className="py-4 px-6 font-medium">Last Used</th>
                      <th className="py-4 px-6 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/90">
                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-medium">Production SIEM</td>
                      <td className="py-4 px-6 font-mono text-white/50">pk_live_8f92...</td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold uppercase">Read-Only</span>
                      </td>
                      <td className="py-4 px-6">Oct 12, 2025</td>
                      <td className="py-4 px-6">2 mins ago</td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-red-400 hover:text-red-300 transition-colors">Revoke</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div
            key="integrations"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Discord */}
            <motion.div variants={fadeUpVariants} className={`p-6 ${glassCard} flex flex-col gap-6`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#5865F2]/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-[#5865F2]" />
                </div>
                <h3 className="font-space-grotesk text-lg font-bold text-white">Discord Webhooks</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Webhook URL</label>
                  <input type="text" placeholder="https://discord.com/api/webhooks/..." className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Alert on Critical Threats</span>
                  <button className="w-10 h-5 rounded-full bg-[#2DD4BF] relative">
                    <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-black"></div>
                  </button>
                </div>
                <button className="w-full py-2.5 rounded-xl bg-transparent border border-white/20 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-dashed">
                  Test Payload
                </button>
              </div>
            </motion.div>

            {/* CrowdStrike */}
            <motion.div variants={fadeUpVariants} className={`p-6 ${glassCard} flex flex-col gap-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-space-grotesk text-lg font-bold text-white">EDR - CrowdStrike</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#2DD4BF]/10 text-[#2DD4BF] text-[10px] font-bold uppercase">Connected</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">API Endpoint</label>
                  <input type="text" defaultValue="https://api.crowdstrike.com" className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 rounded-xl bg-[#2DD4BF] text-black font-bold text-sm hover:bg-[#14B8A6] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync Telemetry'
                  )}
                </button>
              </div>
            </motion.div>

            {/* Splunk */}
            <motion.div variants={fadeUpVariants} className={`p-6 ${glassCard} flex flex-col gap-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-space-grotesk text-lg font-bold text-white">SIEM - Splunk</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">Disconnected</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">HEC URI</label>
                  <input type="text" placeholder="https://splunk-hec.company.com:8088" className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Token</label>
                  <input type="password" placeholder="••••••••••••••••" className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
                <motion.button {...tactileProps} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm font-bold text-white hover:bg-white/20 transition-colors">
                  Connect Splunk
                </motion.button>
              </div>
            </motion.div>

            {/* Slack */}
            <motion.div variants={fadeUpVariants} className={`p-6 ${glassCard} flex flex-col gap-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4A154B]/20 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-[#4A154B]" />
                  </div>
                  <h3 className="font-space-grotesk text-lg font-bold text-white">Slack Notifications</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase">Disconnected</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Slack Token</label>
                  <input type="password" placeholder="xoxb-..." className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-wider">Default Channel</label>
                  <input type="text" placeholder="#security-alerts" className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#2DD4BF]/50" />
                </div>
                <motion.button {...tactileProps} className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm font-bold text-white hover:bg-white/20 transition-colors">
                  Authorize Slack
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const EndpointFleetView = () => {
  const metrics = [
    { label: "Total Agents", value: "1,204", color: "text-white" },
    { label: "Online", value: "1,180", color: "text-green-400" },
    { label: "Isolated", value: "4", color: "text-red-400" },
    { label: "Outdated", value: "20", color: "text-yellow-400" },
  ];

  const agents = [
    { hostname: "WKSTN-0821", os: "Windows", ip: "10.0.4.12", version: "2.4.1", status: "Healthy" },
    { hostname: "SRV-PROD-DB", os: "Linux", ip: "10.0.1.55", version: "2.4.0", status: "Healthy" },
    { hostname: "MAC-DEV-03", os: "macOS", ip: "10.0.4.89", version: "2.4.1", status: "Healthy" },
    { hostname: "WKSTN-9912", os: "Windows", ip: "10.0.4.15", version: "2.3.9", status: "Compromised" },
    { hostname: "SRV-MAIL-01", os: "Linux", ip: "10.0.1.12", version: "2.4.1", status: "Healthy" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Metrics Row */}
      <motion.div 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true }} 
        variants={staggerGrid} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metrics.map((m, i) => (
          <motion.div variants={gridItem} {...tactileProps} key={i} className={`p-4 ${glassCard} flex flex-col gap-1`}>
            <span className="text-xs text-white/50 uppercase tracking-wider">{m.label}</span>
            <span className={`text-2xl font-bold ${m.color} ${m.label === 'Isolated' ? 'shiny-text shiny-red' : m.label === 'Online' ? 'shiny-text shiny-teal' : ''}`}>{m.value}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Table */}
      <motion.div {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-6`}>
        <div className="flex items-center justify-between">
          <h3 className="font-space-grotesk text-xl font-bold text-white">Deployed Agents</h3>
          <motion.button {...tactileProps} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
            Export Fleet Data
          </motion.button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider bg-white/5">
                <th className="py-4 px-6 font-medium">Hostname</th>
                <th className="py-4 px-6 font-medium">OS</th>
                <th className="py-4 px-6 font-medium">Internal IP</th>
                <th className="py-4 px-6 font-medium">Agent Version</th>
                <th className="py-4 px-6 font-medium">Health Status</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <motion.tbody 
              initial="hidden" 
              whileInView="show" 
              viewport={{ once: true }} 
              variants={staggerGrid} 
              className="text-sm text-white/90"
            >
              {agents.map((agent, i) => (
                <motion.tr variants={gridItem} key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-medium">{agent.hostname}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {agent.os === 'Windows' && <Monitor className="w-4 h-4 text-blue-400" />}
                      {agent.os === 'macOS' && <Apple className="w-4 h-4 text-white/70" />}
                      {agent.os === 'Linux' && <Terminal className="w-4 h-4 text-yellow-400" />}
                      <span>{agent.os}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-white/50">{agent.ip}</td>
                  <td className="py-4 px-6">{agent.version}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      agent.status === 'Healthy' ? 'bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <motion.button {...tactileProps} className="px-3 py-1 rounded-lg bg-transparent border border-white/20 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors border-dashed">
                      Isolate Host 🔒
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

const SandboxAnalysisView = () => {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <motion.div {...tactileProps} className={`p-8 ${glassCard} flex flex-col md:flex-row items-center justify-between gap-8`}>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-white/50 uppercase tracking-wider">Target URL</span>
          <h2 className="text-xl md:text-2xl font-mono font-bold text-white break-all">http://secure-login-update.baddomain.com</h2>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-2 text-sm text-red-400">
              <Bug className="w-4 h-4" />
              Malicious Intent Detected
            </span>
            <span className="text-sm text-white/30">Detonated on: Apr 03, 2026 22:30 UTC</span>
          </div>
        </div>
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-red-500/30 flex flex-col items-center justify-center bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <span className="text-3xl font-bold text-red-500 shiny-text shiny-red">98</span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Critical</span>
          </div>
          <div className="absolute -inset-2 rounded-full border border-red-500/20 animate-pulse"></div>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <motion.div 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true }} 
        variants={staggerGrid} 
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left Panel: The Tree */}
        <motion.div variants={gridItem} {...tactileProps} className={`lg:col-span-7 p-6 ${glassCard} flex flex-col gap-6`}>
          <h3 className="font-space-grotesk text-lg font-bold text-white">Execution & DOM Tree</h3>
          <ScrollRevealText className="flex flex-col gap-4 font-mono text-sm">
            <div className="flex items-start gap-3">
              <span className="text-[#2DD4BF]">[+]</span>
              <span className="text-white/90">Document Load</span>
            </div>
            <div className="flex items-start gap-3 ml-6">
              <span className="text-white/30">|</span>
              <span className="text-yellow-400">[-]</span>
              <span className="text-white/80">Suspicious IFrame Injected (Hidden)</span>
            </div>
            <div className="flex items-start gap-3 ml-12">
              <span className="text-white/30">|</span>
              <span className="text-white/30">|</span>
              <span className="text-red-500">[-]</span>
              <span className="text-red-400 font-bold">eval(atob(...))</span>
            </div>
            <div className="flex items-start gap-3 ml-18 ml-[72px]">
              <span className="text-white/30">|</span>
              <span className="text-white/30">|</span>
              <span className="text-white/30">|</span>
              <span className="text-red-500">[-]</span>
              <span className="text-white/70">Credential Exfiltration Attempt</span>
            </div>
            <div className="flex items-start gap-3 ml-6">
              <span className="text-white/30">|</span>
              <span className="text-[#2DD4BF]">[+]</span>
              <span className="text-white/80">WebSocket Connection Established</span>
            </div>
          </ScrollRevealText>
        </motion.div>

        {/* Right Panels */}
        <motion.div 
          variants={staggerGrid} 
          className="lg:col-span-5 flex flex-col gap-6"
        >
          {/* Extracted Features */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-4`}>
            <h3 className="font-space-grotesk text-lg font-bold text-white">Malicious Signatures</h3>
            <div className="flex flex-wrap gap-2">
              {["Credential Harvesting", "Obfuscated JS", "Zero-Day Heuristics", "Anti-Sandbox Detection", "Phishing Template"].map((sig, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  {sig}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Network IoCs */}
          <motion.div variants={gridItem} {...tactileProps} className={`p-6 ${glassCard} flex flex-col gap-4`}>
            <h3 className="font-space-grotesk text-lg font-bold text-white">Network Activity</h3>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-white/50 uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-4 font-medium">Domain</th>
                    <th className="py-2 px-4 font-medium">Type</th>
                    <th className="py-2 px-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <motion.tbody 
                  initial="hidden" 
                  whileInView="show" 
                  viewport={{ once: true }} 
                  variants={staggerGrid} 
                  className="text-white/80"
                >
                  <motion.tr variants={gridItem} className="border-t border-white/5">
                    <td className="py-2 px-4 font-mono">api.evil-c2.net</td>
                    <td className="py-2 px-4">C2 Server</td>
                    <td className="py-2 px-4 text-right text-red-400">Blocked</td>
                  </motion.tr>
                  <motion.tr variants={gridItem} className="border-t border-white/5">
                    <td className="py-2 px-4 font-mono">cdn.google-analytics.com.evil.ru</td>
                    <td className="py-2 px-4">Exfil</td>
                    <td className="py-2 px-4 text-right text-red-400">Blocked</td>
                  </motion.tr>
                  <motion.tr variants={gridItem} className="border-t border-white/5">
                    <td className="py-2 px-4 font-mono">static-assets-cdn.xyz</td>
                    <td className="py-2 px-4">Payload</td>
                    <td className="py-2 px-4 text-right text-yellow-400">Flagged</td>
                  </motion.tr>
                </motion.tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const DashboardLayout = () => {
  const [currentView, setCurrentView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Mock data for fuzzy search
  const searchData = [
    { id: 'TRT-8921-A', type: 'Threat ID', icon: ShieldAlert, color: 'text-red-400' },
    { id: 'TRT-1042-B', type: 'Threat ID', icon: ShieldAlert, color: 'text-red-400' },
    { id: 'Containment', type: 'Playbook', icon: Terminal, color: 'text-[#2DD4BF]' },
    { id: 'Isolation', type: 'Playbook', icon: Terminal, color: 'text-[#2DD4BF]' },
    { id: 'web-server-01', type: 'Endpoint', icon: Server, color: 'text-white/80' },
    { id: 'db-cluster-main', type: 'Endpoint', icon: Server, color: 'text-white/80' },
    { id: 'cdn.google-analytics.com.evil.ru', type: 'Hostname', icon: Network, color: 'text-yellow-400' },
  ];

  const filteredSuggestions = searchData.filter(item => 
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex text-white font-inter">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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

      {/* Sidebar */}
      <aside className={`fixed top-4 bottom-4 left-4 w-[280px] ${glassCard} flex flex-col z-20`}>
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF] flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className="font-space-grotesk font-bold text-xl tracking-tight">Phish-Slayer</span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
          <SidebarItem icon={Laptop} label="Endpoint Fleet" active={currentView === 'fleet'} onClick={() => setCurrentView('fleet')} />
          <SidebarItem icon={FlaskConical} label="Sandbox Analysis" active={currentView === 'sandbox'} onClick={() => setCurrentView('sandbox')} />
          <SidebarItem icon={Terminal} label="AI Terminal" active={currentView === 'ai-terminal'} onClick={() => setCurrentView('ai-terminal')} />
          <SidebarItem icon={ShieldAlert} label="Protocols" active={currentView === 'protocols'} onClick={() => setCurrentView('protocols')} />
          <SidebarItem icon={CreditCard} label="Billing" active={currentView === 'billing'} onClick={() => setCurrentView('billing')} />
          <SidebarItem icon={Settings} label="Settings" active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <Image src="https://picsum.photos/seed/avatar1/100/100" alt="User" width={32} height={32} className="rounded-full" referrerPolicy="no-referrer" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Tomas Faster</span>
              <span className="text-xs text-white/50">Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 ml-[300px] flex flex-col min-h-screen z-10 p-4">
        {/* Top Header */}
        <header className={`w-full h-16 ${glassCard} flex items-center justify-between px-6 mb-6 relative z-50`}>
          <div className="text-sm font-medium text-white/70">
            Overview <span className="text-white/30 mx-2">/</span> <span className="text-white">Live Threat Intelligence</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="bg-black/50 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#2DD4BF]/50 transition-colors w-64" 
              />
              
              {/* Search Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`absolute top-full mt-2 w-full ${glassCard} p-2 z-50 flex flex-col gap-1`}
                  >
                    <div className="px-3 py-2 text-xs text-white/50 font-medium">Suggestions</div>
                    
                    {filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((suggestion, idx) => (
                        <motion.button key={idx} {...tactileProps} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left w-full">
                          <suggestion.icon className={`w-4 h-4 ${suggestion.color}`} />
                          <div className="flex flex-col">
                            <span className="text-sm text-white/80">{suggestion.id}</span>
                            <span className="text-xs text-white/40">{suggestion.type}</span>
                          </div>
                        </motion.button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-white/50 text-center">No results found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative group">
              <motion.button {...tactileProps} className="relative text-white/70 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#2DD4BF] rounded-full"></span>
              </motion.button>
              
              {/* Notification Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-[#050505]/95 backdrop-blur-3xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-[100] p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-white text-sm">Notifications</h4>
                  <motion.span {...tactileProps} className="text-xs text-[#2DD4BF] cursor-pointer hover:text-[#2DD4BF]/80">Mark all read</motion.span>
                </div>
                
                {[
                  { title: "High Risk Login", time: "2m ago", icon: AlertTriangle, color: "text-red-400" },
                  { title: "Playbook Executed", time: "15m ago", icon: CheckSquare, color: "text-[#2DD4BF]" },
                  { title: "New Device Detected", time: "1h ago", icon: Server, color: "text-white/70" }
                ].map((notif, i) => (
                  <motion.div {...tactileProps} key={i} className="flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                    <notif.icon className={`w-4 h-4 mt-0.5 ${notif.color}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-white">{notif.title}</span>
                      <span className="text-xs text-white/50">{notif.time}</span>
                    </div>
                  </motion.div>
                ))}
                
                <motion.button {...tactileProps} className="w-full text-center text-xs text-white/50 hover:text-white mt-2 pt-2 border-t border-white/10">View all notifications</motion.button>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-medium text-green-400">System Status: Optimal</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {currentView === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CommandCenter />
              </motion.div>
            )}
            {currentView === 'fleet' && (
              <motion.div 
                key="fleet"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <EndpointFleetView />
              </motion.div>
            )}
            {currentView === 'sandbox' && (
              <motion.div 
                key="sandbox"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SandboxAnalysisView />
              </motion.div>
            )}
            {currentView === 'protocols' && (
              <motion.div 
                key="protocols"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SystemProtocols />
              </motion.div>
            )}
            {currentView === 'ai-terminal' && (
              <motion.div 
                key="ai-terminal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AIAgentView />
              </motion.div>
            )}
            {currentView === 'billing' && (
              <motion.div 
                key="billing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <BillingView />
              </motion.div>
            )}
            {currentView === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (isAuthenticated) {
    return <DashboardLayout />;
  }

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

      {/* Navbar */}
      <nav className={`w-full max-w-7xl mx-auto px-6 py-4 mt-6 flex items-center justify-between ${glassCard} rounded-full`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#2DD4BF] flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className="font-space-grotesk font-bold text-xl tracking-tight">Phish-Slayer</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-white/70 transition-all duration-300 ease-out hover:text-white hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] inline-block">Features</a>
          <a href="#pricing" className="text-sm font-medium text-white/70 transition-all duration-300 ease-out hover:text-white hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] inline-block">Pricing</a>
          <a href="#company" className="text-sm font-medium text-white/70 transition-all duration-300 ease-out hover:text-white hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] inline-block">Company</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => { setAuthIntent('login'); setIsAuthOpen(true); }} 
            className="text-sm font-medium border border-white/20 text-white bg-transparent rounded-full px-5 py-2 transition-all duration-300 ease-out hover:bg-[#2DD4BF] hover:text-black hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] hidden md:block"
          >
            Log In
          </button>
          <motion.button 
            whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setAuthIntent('signup'); setIsAuthOpen(true); }} 
            className="text-sm font-medium bg-[#2DD4BF] text-black px-5 py-2 rounded-full transition-all duration-300"
          >
            Sign Up
          </motion.button>
        </div>
      </nav>

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
          <motion.button 
            {...tactileProps}
            className="bg-[#2DD4BF] text-black font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center gap-2 group"
          >
            ACTIVATE FREE TRIAL NOW
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
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
      <section className="w-full max-w-6xl mx-auto px-6 py-24">
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
            <motion.button {...tactileProps} className="w-full py-3 rounded-full border border-white/20 text-white hover:bg-white/5 transition-colors font-medium">
              Get Started
            </motion.button>
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
            <motion.button 
              {...tactileProps}
              className="w-full py-3 rounded-full bg-[#2DD4BF] text-black transition-all duration-300 font-bold"
            >
              Start Free Trial
            </motion.button>
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
            <motion.button 
              {...tactileProps}
              className="bg-[#2DD4BF] text-black font-semibold px-8 py-3 rounded-full transition-all duration-300 whitespace-nowrap hover:bg-[#14B8A6] hover:shadow-[0_0_15px_rgba(45,212,191,0.5)]"
            >
              Sign Up Free
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer (From Image 1) */}
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
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Pricing</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Blog</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Support</motion.a></li>
            </ul>
          </motion.div>

          {/* Legal & Contact */}
          <motion.div variants={gridItem}>
            <h4 className="font-bold text-white mb-6">Legal & Contact</h4>
            <ul className="space-y-4 mb-8">
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Privacy</motion.a></li>
              <li><motion.a {...tactileProps} href="#" className="text-white/60 hover:text-[#2DD4BF] transition-colors inline-block">Terms</motion.a></li>
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
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isAuthOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setIsAuthOpen(false)}
          >
            <AuthModal initialView={authIntent} onClose={() => setIsAuthOpen(false)} onLogin={() => { setIsAuthenticated(true); setIsAuthOpen(false); }} />
          </motion.div>
        )}
      </AnimatePresence>
      <GlobalSupportWidget />
    </main>
  );
}
