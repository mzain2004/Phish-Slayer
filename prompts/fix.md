@GEMINI.md @graph.md
New session. You are a senior security engineer on PhishSlayer.
Read GEMINI.md and graph.md first. State current sprint.
AUDIT: Read supabase/migrations/20260429700000_osint_schema.sql FIRST. Do NOT recreate existing tables. ALTER only if missing columns.
BUILD: npm run build must pass. Fix errors before commit.

You are building Sprint 3: OSINT Brand Monitoring + GitHub Leak Scanner.

USE SUPABASE CONNECTOR for migrations.

PART 1 — TYPOSQUATTING PERMUTATION ENGINE
/lib/osint/typosquat.ts
Function: generatePermutations(domain: string): string[]
Generate 10,000+ variations:
- Homoglyph swaps (a→@, o→0, i→1, l→1)
- TLD swaps (.com, .net, .org, .co, .io, .xyz)
- Hyphen insertion (phish-slayer, phishsl-ayer)
- Character omission (phishslayer, phihslayer)
- Character duplication (phishslayyer)
- Adjacent keyboard swaps (n→m, i→o)
Return unique array. Deduplicate.

PART 2 — CT LOG MONITOR
/lib/osint/ct-monitor.ts
Function: checkNewCerts(orgDomain: string): Promise<CertFinding[]>
Use certstream.io WebSocket or HTTP endpoint.
Filter certificates where SAN/CN contains orgDomain or permutations.
Return: { domain, issuer, not_before, not_after, matched_permutation }

PART 3 — DOMAIN REGISTRATION MONITOR
/lib/osint/domain-monitor.ts
Function: checkDomainRegistration(permutations: string[]): Promise<DomainFinding[]>
Use WHOIS API (whoisjson.com or similar free tier).
For each permutation: check if registered.
If newly registered (<30 days) = HIGH severity finding.

PART 4 — GITHUB LEAK SCANNER
/lib/osint/github-scanner.ts
Function: scanGitHub(orgName: string, domains: string[]): Promise<LeakFinding[]>
Use GitHub Code Search API (if token) or GitHub Dorking via REST.
Search patterns:
- "{orgName}" + "password"
- "{domain}" + "AWS_ACCESS_KEY"
- "{domain}" + "mongodb+srv"
- "{domain}" + "api_key"
- "{domain}" + "secret_key"
- "{domain}" + "private_key"
Extract: repo URL, file path, matched pattern, snippet (redact actual secrets).
Severity: AWS key = CRITICAL, password = HIGH, generic key = MEDIUM.

PART 5 — WHOIS CHANGE MONITOR
/lib/osint/whois-monitor.ts
Function: checkWhoisChanges(domain: string, lastCheck: Date): Promise<WhoisChange[]>
Compare current WHOIS vs stored previous WHOIS.
Flag: registrar change, nameserver change, registrant org change.
Store previous state in osint_findings extra JSONB.

PART 6 — OSINT SCHEDULER
/app/api/cron/osint-brand/route.ts
CRON_SECRET auth.
Run all Sprint 3 agents for all orgs:
1. Generate permutations for org domains (from brand_assets or organizations table)
2. Check CT logs
3. Check domain registrations
4. Scan GitHub
5. Store findings in osint_findings table (type: 'brand_impersonation', 'credential_leak', etc)
6. Create platform alert for CRITICAL findings
Schedule: every 6 hours.

PART 7 — API ROUTES
GET /api/osint/brand/status — last scan time, findings count
GET /api/osint/brand/findings — paginated findings list
POST /api/osint/brand/scan — trigger manual scan (auth + org scoped)

FINAL: npm run build. git commit -m "feat(osint): Sprint 3 brand monitor + github scanner". git push.