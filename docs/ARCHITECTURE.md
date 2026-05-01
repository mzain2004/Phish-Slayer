# PhishSlayer Architecture

## Platform Overview
PhishSlayer is an autonomous Security Operations Center (SOC) and OSINT platform designed for a "zero human analyst" future. It leverages multi-agent AI swarms to ingest, analyze, and respond to security threats in real-time.

## Tech Stack
- **Frontend/Backend**: Next.js 15 (App Router), TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Clerk
- **AI Engine**: Groq / Gemini (via LLM Swarm)
- **Infrastructure**: Azure VM (Ubuntu 24.04), Docker
- **Monitoring**: Sentry, Wazuh EDR
- **Billing**: Polar.sh

## Data Flow
1. **Ingest**: Security events arrive via webhooks (Wazuh, generic), email, or manual upload.
2. **UDM**: Events are normalized into the Universal Data Model (UDM) schema.
3. **L1 Triage**: L1 Agent performs initial enrichment, MITRE ATT&CK tagging, and severity scoring.
4. **L2 Investigate**: L2 Agent correlates alerts into cases and performs automated digital forensics.
5. **L3 Hunt**: L3 Agent proactively hunts for stealthy threats and manages detection engineering (Sigma rules).
6. **Response**: Containment actions (IP block, host isolation) are executed via automated playbooks.

## Agent Tiers
- **L1 (Triage)**: Focused on volume. Handles enrichment, MITRE mapping, and basic classification.
- **L2 (Investigation)**: Focused on context. Correlates events across the organization, builds timelines, and suggests containment.
- **L3 (Hunting)**: Focused on stealth. Performs OSINT brand monitoring, dark web scans, and proactively generates hunt hypotheses.

## Layer Map (The 12-Layer Ceiling)
PhishSlayer is architected across 12 logical layers to achieve full SOC autonomy:
1. Agent Runtime (V8/Node)
2. Data Ingestion (Pipelines)
3. Normalization (UDM)
4. Enrichment (External APIs)
5. Classification (MITRE/Severity)
6. Correlation (Graph-based)
7. Investigation (Forensics)
8. Hunting (L3/OSINT)
9. Reasoning (LLM Chain)
10. Containment (Response)
11. Compliance (Audit/SLA)
12. Platform (Auth/Billing/UX)
