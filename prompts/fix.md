@GEMINI.md @graph.md
New session. Read both. Build MUST pass.
Sprint 23: Documentation + Knowledge Base + Developer Portal.

═══ PART 1 — KNOWLEDGE BASE CONTENT ═══

Read app/dashboard/knowledge-base/page.tsx and
app/api/knowledge-base/ routes (already exist per build).

If knowledge base is empty/stub — seed via Supabase connector:

INSERT INTO knowledge_base (title, category, content, org_id) VALUES
(NULL for platform-wide articles — shared across orgs):

Seed 10 articles:
1. "Getting Started with PhishSlayer" — onboarding overview
2. "Connecting Wazuh to PhishSlayer" — Wazuh integration guide
3. "Understanding Alert Severity Scores" — how scores are calculated
4. "MITRE ATT&CK Coverage Explained" — heatmap guide
5. "How L1/L2/L3 Agents Work" — agent tier explanation
6. "Setting Up Playbooks" — playbook builder guide
7. "OSINT Brand Monitoring Setup" — domain monitoring guide
8. "Reading the Post-Incident Review" — PIR guide
9. "API Key Setup and Scopes" — developer guide
10. "Compliance Module Overview" — GDPR/SOC2 features

Write each as 200-word markdown content.
Insert with org_id = NULL (platform-wide visibility).

═══ PART 2 — DEVELOPER PORTAL PAGE ═══

/app/developer/page.tsx (public, no auth):

Sections:
1. Hero: "PhishSlayer API — Build on the Autonomous SOC"
2. Quickstart (3 steps):
   Step 1: Generate API key (Settings → API Keys)
   Step 2: Send first alert via curl example
   Step 3: View alert in dashboard
3. Code examples (tabbed): curl | Python | JavaScript
   Show: ingest alert, query alerts, receive webhook
4. Endpoints table: method, path, description, auth required
   List 10 most useful routes
5. Rate limits table: by plan
6. Link to /api-docs for full Swagger UI

Design: public landing page style, stars background (auth page only rule
applies to /auth — developer page is public so stars OK here).

═══ PART 3 — README UPDATE ═══

/README.md (root — UPDATE not rewrite):
Add sections:
  ## Quick Deploy (Azure VM)
  ## Architecture Overview (link to /docs/ARCHITECTURE.md)
  ## API Documentation (link to phishslayer.tech/api-docs)
  ## Sprint Status (table: sprint name, status ✅/🔄/⬜)
  ## License + Contributing

═══ FINAL ═══
npm run build. Zero errors.
git commit -m "feat(docs): Sprint 23 knowledge base content, developer portal, README"
git push origin main