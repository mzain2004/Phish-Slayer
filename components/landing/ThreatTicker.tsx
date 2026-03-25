"use client";

import { useReducedMotion } from "framer-motion";

const SAMPLE_VERDICTS = [
  { type: "threat", text: "THREAT · malicious-phishing[.]xyz · 94/100 · BLOCKED" },
  { type: "clean", text: "CLEAN · github[.]com · 1/100 · SAFE" },
  { type: "threat", text: "AI ALERT · credential-harvest[.]net · 98/100 · BLOCKED" },
  { type: "clean", text: "CLEAN · supabase[.]com · 0/100 · SAFE" },
  { type: "threat", text: "MALWARE · payload-delivery[.]ru · 100/100 · BLOCKED" },
  { type: "suspicious", text: "SUSPICIOUS · banking-update-portal[.]com · 85/100 · FLAGGED" },
  { type: "threat", text: "DOM CLONE · linkedin-login-secure[.]net · 96/100 · BLOCKED" },
  { type: "clean", text: "CLEAN · stripe[.]com · 0/100 · SAFE" },
];

const items = [...SAMPLE_VERDICTS, ...SAMPLE_VERDICTS, ...SAMPLE_VERDICTS];

export function ThreatTicker() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full bg-[#0A0E13] border-t border-[#1C2128] border-b border-b-[#1C2128] py-2.5 overflow-hidden flex whitespace-nowrap relative isolate">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0A0E13] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0A0E13] to-transparent z-10 pointer-events-none" />
      
      <div
        className={`flex items-center gap-8 ${
          prefersReducedMotion ? "" : "animate-[marquee_40s_linear_infinite]"
        }`}
      >
        {items.map((item, i) => {
          const color = item.type === "threat" ? "#F85149" : item.type === "suspicious" ? "#E3B341" : "#3FB950";
          return (
            <span
              key={i}
              className="font-mono text-[12px] tracking-wide flex items-center gap-2.5"
              style={{ color }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              {item.text}
            </span>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
