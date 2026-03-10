"use client";
import { motion } from "framer-motion";
import { Shield, Brain } from "lucide-react";

export function FloatingThreatCard() {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-full max-w-md mx-auto"
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-2xl" />

      {/* Card */}
      <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-mono uppercase tracking-wider">
              Live Threat Detected
            </span>
          </div>
          <span className="text-slate-500 text-xs">Just now</span>
        </div>

        {/* Target */}
        <div className="mb-4">
          <p className="text-slate-400 text-xs mb-1">Target</p>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />
            <p className="text-teal-400 font-mono text-sm">
              malware-payload.ru
            </p>
          </div>
        </div>

        {/* Risk Score Bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-slate-400 text-xs">Risk Score</span>
            <span className="text-red-400 text-xs font-bold">94/100</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "94%" }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
            />
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3 h-3 text-violet-400" />
            <p className="text-slate-400 text-xs">Gemini AI Analysis</p>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Phishing infrastructure with credential harvesting. Urgency
            manipulation detected.
          </p>
        </div>

        {/* Gates */}
        <div className="flex gap-2">
          {["Gate 1", "Gate 2", "Gate 3"].map((gate, i) => (
            <motion.div
              key={gate}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 * (i + 1) }}
              className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center"
            >
              <p className="text-red-400 text-[10px] font-medium">{gate}</p>
              <p className="text-red-300 text-[10px]">FLAGGED</p>
            </motion.div>
          ))}
        </div>

        {/* Action */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-4 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded-lg py-2 text-sm font-medium hover:bg-teal-500/20 transition-colors"
        >
          View Full Report →
        </motion.button>
      </div>
    </motion.div>
  );
}
