"use client";

import { useReducedMotion } from "framer-motion";

const SAMPLE_VERDICTS = [
  "THREAT DETECTED · malicious-phishing.xyz · Risk Score 94 · BLOCKED",
  "SCAN COMPLETED · secure-gateway.app · Risk Score 12 · PASSED",
  "AI ALERT · credential-harvest.net · Risk Score 98 · BLOCKED",
  "MALWARE DROP · payload-delivery.ru · Risk Score 100 · BLOCKED",
  "WHOIS MISMATCH · banking-update-portal.com · Risk Score 85 · FLAGGED",
  "DOM CLONE · linkedin-login-secure.net · Risk Score 96 · BLOCKED"
];

// Duplicate to ensure seamless scrolling
const items = [...SAMPLE_VERDICTS, ...SAMPLE_VERDICTS, ...SAMPLE_VERDICTS];

export function ThreatTicker() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full bg-[#161B22] border-y border-[#30363D] py-3 overflow-hidden flex whitespace-nowrap relative isolate">
      {/* Gradient masks for smooth fade on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#161B22] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#161B22] to-transparent z-10 pointer-events-none" />
      
      <div
        className={`flex items-center gap-8 ${
          prefersReducedMotion ? "" : "animate-[marquee_40s_linear_infinite]"
        }`}
      >
        {items.map((verdict, i) => {
          const isThreat = verdict.includes("BLOCKED") || verdict.includes("FLAGGED");
          return (
            <span
              key={i}
              className={`font-mono text-sm tracking-wide flex items-center gap-3 ${
                isThreat ? "text-[#F85149]" : "text-[#2DD4BF]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isThreat ? "bg-[#F85149] animate-pulse" : "bg-[#2DD4BF]"}`} />
              {verdict}
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
