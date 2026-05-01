# PhishSlayer v2

PhishSlayer v2 is an enterprise AI security platform for Blue Team operations focused on one core outcome: restoring identity continuity across fragmented telemetry.

## Executive Summary

Most SOC stacks optimize for alert volume and alert speed. That approach still leaves analysts with disconnected evidence and slow incident resolution.

PhishSlayer v2 shifts the operating model from "more alerts" to "coherent incident lineage." Every high-signal incident must resolve into a strict session sequence:

Who -> Device -> Auth Context -> Privilege -> Action -> Impact

If that chain is incomplete, the incident is incomplete.

## v2 Philosophy: Identity Continuity Over Alert Volume

1. We prioritize sequence integrity over raw event count.
2. We stitch endpoint telemetry and cloud identity telemetry into a single investigative graph.
3. We normalize all timestamps to UTC to prevent timeline drift and broken correlations.
4. We reduce MTTR by giving responders one timeline, one actor trail, and one blast-radius view.
5. We design for reliability and cost discipline under continuous scanning workloads.

## Target Audience

- Primary: Incident Response analysts and SOC engineers handling live containment and triage.
- Secondary: Detection engineers and SREs responsible for telemetry reliability and response tooling.
- Tertiary: Security leadership monitoring exposure, containment speed, and operational risk.

## What v2 Delivers

- Identity-Stitching Engine that correlates Microsoft Graph, Entra ID, Defender, and endpoint events.
- Deterministic sequence validation for each threat path.
- Unified timeline with strict UTC normalization.
- Incident context cards that show actor lineage, privilege transitions, and impact surface.
- Cost-aware ingestion and query architecture to avoid runaway API and cloud compute spend.

## Documentation Index (Single Source of Truth)

- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Platform internals, agent tiers, and the 12-layer SOC autonomy model.
- [DEPLOYMENT.md](docs/DEPLOYMENT.md): Step-by-step Azure VM and Docker guide.
- [API_QUICK_START.md](docs/API_QUICK_START.md): 3-minute guide for developers.

## Quick Deploy (Azure VM)

```bash
ssh mzain2004@40.123.224.93
cd ~/Phish-Slayer && git pull origin main
docker-compose up -d --build
```

## API Documentation

Full interactive Swagger UI is available at [phishslayer.tech/api-docs](https://phishslayer.tech/api-docs).  
Developer portal: [phishslayer.tech/developer](https://phishslayer.tech/developer).

## Sprint Status

| Sprint | Goal | Status |
|--------|------|--------|
| 15 | Marketplace & API Keys | ✅ |
| 16 | Webhooks & OpenAPI | ✅ |
| 17 | Onboarding & UI Polish | ✅ |
| 18 | Polar Billing & Gating | ✅ |
| 19 | Vitest & Critical Path | ✅ |
| 20 | DB Indexes & Performance | ✅ |
| 21 | Security Hardening | ✅ |
| 22 | Accessibility & UX | ✅ |
| 23 | Knowledge Base & Portal | ✅ |

## Product Boundaries
...
- Detached static pages that are not integrated into the investigation flow.

## License + Contributing

Proprietary License. All rights reserved. 
Contributions must follow the **Agent Rules** defined in `GEMINI.md`.
