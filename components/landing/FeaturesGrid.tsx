"use client";

import { motion } from "framer-motion";
import { Shield, Cpu, Monitor, Bell, FileText, Code } from "lucide-react";

const features = [
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "AI Threat Analysis",
    desc: "Gemini-powered plain English verdicts breaking down complex malware behavior.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "95-Engine Scanner",
    desc: "VirusTotal cross-reference on every scan to ensure maximum detection rates.",
  },
  {
    icon: <Monitor className="w-6 h-6" />,
    title: "EDR Fleet Monitor",
    desc: "Real-time endpoint telemetry dashboard for your entire organization's fleet.",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Discord Alerts",
    desc: "Instant webhooks hitting your team's channels on every malicious finding.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Executive PDF Reports",
    desc: "One-click branded export tailored for leadership and compliance auditing.",
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: "Public REST API",
    desc: "Integrate directly into your existing SIEM or SOAR via /api/v1/scan endpoint.",
  }
];

export function FeaturesGrid() {
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section id="features" className="bg-[#0D1117] py-32 border-b border-[#30363D]">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={itemVariants}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-[#E6EDF3] tracking-tight">
            Everything Your SOC Team Needs.<br />Nothing It Doesn&apos;t.
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ 
                y: -4, 
                boxShadow: "0 0 20px rgba(45,212,191,0.15)",
                borderColor: "rgba(45,212,191,0.5)"
              }}
              className="bg-[#161B22] border border-[#30363D] p-8 rounded-[12px] transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-[#0D1117] border border-[#30363D] rounded-[8px] flex items-center justify-center text-[#2DD4BF] mb-6 group-hover:bg-[#2DD4BF]/10 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#E6EDF3] mb-3">{feature.title}</h3>
              <p className="text-[#8B949E] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
