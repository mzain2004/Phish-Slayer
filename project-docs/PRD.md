# PRD.md — Product Requirements Document
# Phish-Slayer V3

---

## 1. Product Vision

Phish-Slayer is an enterprise-grade, Blue Team AI SaaS cybersecurity platform. It provides Security Operations Center (SOC) analysts and security teams with a real-time command center to monitor endpoints, scan threat indicators, manage incidents, and neutralize cyber threats autonomously.

The platform combines proprietary threat intelligence, external scanning engines (VirusTotal), and AI-powered analysis (Google Gemini) into a single, data-dense dashboard — wrapped in a premium cyber-themed UI.

---

## 2. Target Users

- **Primary:** SOC analysts at small-to-mid-sized enterprises
- **Secondary:** Security engineers and IT administrators
- **Tertiary:** CISOs and executives consuming threat reports

---

## 3. Core Problem Statement

Security teams are overwhelmed by alert fatigue, fragmented tooling, and slow manual triage. Phish-Slayer consolidates threat detection, endpoint monitoring, and incident response into one platform — reducing time-to-verdict from hours to seconds.

---

## 4. Product Pillars

1. **Threat Intelligence** — Automated scanning against whitelist, proprietary intel vault, and VirusTotal
2. **AI Analysis** — Gemini AI scores threats, categorizes them, and generates remediation steps
3. **Endpoint Defense (EDR)** — Lightweight agents monitor endpoints for suspicious processes, file changes, and network connections
4. **Incident Management** — Full CRUD lifecycle for security incidents with block/resolve actions
5. **Real-time Alerting** — Discord webhooks fire on malicious findings; WebSocket streams agent telemetry live

---

## 5. Business Model

Three-tier SaaS subscription:

| Tier | Key | Price |
|------|-----|-------|
| Recon | `free` | $0/month |
| SOC Pro | `pro` | $99/month ($79 annual) |
| Command & Control | `enterprise` | $299/month ($239 annual) |

Payments processed via Stripe. Subscription tier stored in Supabase `profiles.subscription_tier`.

---

## 6. Success Metrics

- Time from IOC submission to verdict: < 5 seconds
- Agent WebSocket reconnection time: < 3 seconds
- Dashboard load time: < 2 seconds
- Zero false-positive whitelist bypasses
- 99.9% uptime on Azure VM

---

## 7. Out of Scope (V3)

- Mobile native app
- Multi-tenant organization management
- Custom threat feed integrations beyond URLhaus
- SOAR playbook automation
