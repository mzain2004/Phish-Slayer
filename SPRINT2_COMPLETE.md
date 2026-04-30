# Sprint 2: MITRE ATT&CK Coverage Engine + Auto-Tagger Complete

## Summary
Successfully implemented the MITRE ATT&CK engine including static catalog embedding, rule-based and LLM-assisted auto-tagging, and organization coverage calculation. Designed and deployed adversary profiles mapped to specific detection strategies.

## 1. Database Migrations
- Ran `20260430300000_layer_2_mitre_coverage.sql` ensuring that `mitre_coverage` exists alongside tracking columns across the `alerts` and `organizations` tables. 

## 2. MITRE Data Layer
- **`lib/mitre/attack-data.ts`**: Contains over 45 hardcoded high-fidelity MITRE techniques sorted across all 14 Tactics. 

## 3. Auto-Tagger System
- **`lib/mitre/auto-tagger.ts`**: Pattern matching resolving to `TXXXX` strings based on static dictionaries spanning common rule triggers (e.g. `Mimikatz` -> `T1003`). 
- **`lib/mitre/llm-tagger.ts`**: LLM driven Groq parsing routing events to T-codes using a custom prompt catalog matching logic. 
- **`lib/mitre/orchestrator.ts`**: Intercepts enriched data from `enrichment-orchestrator.ts` running through `ruleBasedTag` first then `llmTagger`, caching occurrences sequentially into the database via `mitre_coverage` counts. 

## 4. Coverage Engine
- **`lib/mitre/coverage-engine.ts`**: Scans the org's cached detection results against the total `attack-data.ts` matrix to return overall score percentages. Evaluates existing coverage gaps and prioritizes techniques natively depending on complexity to execute and frequency seen in the wild. 

## 5. Adversary Simulation Scorer
- **`lib/mitre/adversary-profiles.ts`**: Catalog definitions capturing the behaviors of APT28, Lazarus, FIN7, LockBit, and mass Phishing operations. 
- **`lib/mitre/simulation-scorer.ts`**: Identifies specific threat techniques overlapping the org coverage matrix.

## 6. API and Endpoints
All protected with Next.js App Router context handlers and multi-tenant scoping logic.
- `GET /api/mitre/coverage`
- `GET /api/mitre/heatmap`
- `GET /api/mitre/gaps`
- `GET /api/mitre/techniques`
- `POST /api/mitre/simulate`
- **Cron Job Endpoint:** `/api/cron/mitre-coverage/route.ts` - Iterates across all organizations updating their flattened `mitre_coverage_score` JSONB properties on a daily schedule.

## Validation
- `npm run build` returned perfectly with 0 TypeScript / Linter / Server Component errors.
