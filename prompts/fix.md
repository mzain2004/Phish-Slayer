@GEMINI.md @graph.md
New session. You are a senior security engineer on PhishSlayer.
Read GEMINI.md and graph.md first. State current sprint.
AUDIT: Check existing static_analysis tables. Check existing url_scans, email_analysis tables. ALTER missing columns, do not duplicate.
BUILD: npm run build must pass.

You are building Sprint 6: Malware Analysis (Static + Dynamic Sandbox).

USE SUPABASE CONNECTOR for migrations.

PART 1 — STATIC ANALYSIS ENHANCEMENT
/lib/malware/static-analyzer.ts
Read existing static analysis code first. Enhance it:

PE Header Parsing:
- Extract: compile timestamp, sections (name, raw_size, virtual_size, entropy), imports (DLLs + functions), exports.
- Entropy > 7.0 = likely packed/encrypted flag.
- Suspicious imports: VirtualAlloc, WriteProcessMemory, CreateRemoteThread = injection flag.

String Extraction:
- Extract printable strings > 4 chars from binary buffer.
- Regex match: IPs, domains, URLs, registry keys (HKLM\\...), file paths (C:\\...).

YARA Integration:
- Define 10 critical YARA rules inline as strings (phishing, ransomware, cobalt_strike, credential_dump, keylog, rat, trojan, backdoor, miner, rootkit).
- Execute via subprocess if yara-python installed, else skip gracefully.

PART 2 — DYNAMIC SANDBOX INTEGRATION
/lib/malware/sandbox.ts
Function: submitToSandbox(fileBuffer: Buffer, fileHash: string): Promise<SandboxResult>

Support Multiple Sandbox APIs (check env for keys, skip if missing):
1. Any.run API: Upload file, poll for report.
2. Hatching Triage API: Upload file, poll for report.
3. VirusTotal API: Upload + retrieve behavioral report.

Parse sandbox report into standard format:
interface SandboxResult {
  sandbox_type: string
  score: number (0-100 malicious)
  mitre_techniques: string[] (extract from report)
  network_iocs: { ips: string[], domains: string[], urls: string[] }
  filesystem_changes: string[]
  processes_spawned: string[]
  raw_report_url: string
}

If no sandbox API key configured: return null with console.log("No sandbox API key configured").

PART 3 — MALWARE ANALYSIS ORCHESTRATOR
/lib/malware/orchestrator.ts
async function analyzeMalware(fileBuffer: Buffer, orgId: string, alertId?: string): Promise<Analysis>
1. Calculate hashes (MD5, SHA1, SHA256).
2. Check enrichment cache / threat_iocs — is this hash already known malicious?
3. Run static analysis.
4. If file is PE or script: submit to sandbox.
5. Merge results: static findings + dynamic findings.
6. Store in static_analysis table (update schema if missing columns for sandbox data).
7. Extract IOCs from sandbox result → store in threat_iocs global table.
8. Auto-tag MITRE techniques from sandbox report.
9. Return combined analysis.

PART 4 — API ROUTES
POST /api/malware/analyze
Auth + org scope. Accept multipart file upload. Call orchestrator.
GET /api/malware/{hash}
Auth + org scope. Return cached analysis for hash.

FINAL: npm run build. git commit -m "feat(malware): Sprint 6 static analysis enhancement + sandbox integration". git push.