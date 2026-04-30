@GEMINI.md @graph.md
New session. You are a senior security engineer on PhishSlayer.
Read GEMINI.md and graph.md first. State current sprint.
AUDIT: Read existing osint_findings schema. Check for credential_exposures, email_posture_results, attack_surface tables. Create ONLY if missing.
BUILD: npm run build must pass.

You are building Sprint 5: Full OSINT Agent Suite.

USE SUPABASE CONNECTOR for migrations.

AGENT 1 — PASTE SITE MONITOR (/lib/osint/paste-monitor.ts)
Scrape: Pastebin, Ghostbin, Rentry (via public APIs/scrapers).
Match against: org domains, executive names, internal hostnames.
On match: ARCHIVE CONTENT IMMEDIATELY to paste_archives table (id, org_id, paste_url, paste_content, content_hash).
Severity: credentials found = CRITICAL, domain mention = HIGH.
Schedule: every 4 hours.

AGENT 2 — CREDENTIAL LEAK MONITOR (/lib/osint/credential-monitor.ts)
Use HaveIBeenPwned domain search API (requires key in env).
Check org email domain. Store breaches in credential_exposures table.
Fields: email, breach_name, breach_date, data_classes[], remediation_status.
Schedule: daily.

AGENT 3 — EMAIL SECURITY POSTURE (/lib/osint/email-posture.ts)
DNS checks for org domains:
- SPF: parse v=spf1 record. Flag +all (CRITICAL). Score 0-100.
- DKIM: check common selectors. Flag key < 2048bit.
- DMARC: check _dmarc record. Flag p=none (HIGH), missing (CRITICAL).
- Open relay: attempt SMTP relay test.
Store in email_posture_results table.
Schedule: weekly.

AGENT 4 — INFRASTRUCTURE FOOTPRINT (/lib/osint/infra-footprint.ts)
Use Shodan API (requires key).
Search by org name + known IP ranges.
Capture: open ports, services, banners, vulns, TLS cert details.
Diff against previous scan: new host = MEDIUM, new port = MEDIUM, new vuln = HIGH.
Store in attack_surface table.
Schedule: weekly.

AGENT 5 — VULNERABILITY INTELLIGENCE (/lib/osint/vuln-intelligence.ts)
Daily NVD pull (new CVEs from last 24h).
Match CVEs against org assets (check assets table for software names).
Check CISA KEV match.
Calculate priority_score = (CVSS*10) + (EPSS*20) + (KEV*30) + (has_PoC*15).
Store in vuln_tracking table.
Schedule: daily.

CRON: /app/api/cron/osint-full/route.ts
CRON_SECRET auth. Run all 5 agents sequentially.
Create alerts for CRITICAL findings.

FINAL: npm run build. git commit -m "feat(osint): Sprint 5 full OSINT suite (paste, creds, email, infra, vuln)". git push.