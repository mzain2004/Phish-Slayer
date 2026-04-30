# Sprint 1: Alert Enrichment Pipeline Complete

## Summary
Built the complete L1 Alert Enrichment Pipeline for PhishSlayer, ensuring all Wazuh alerts are deeply enriched before reaching the analyst queue. This involved fixing existing org_id scoping bugs and standardizing lazy initialization for Groq clients.

## What Was Built
1. **IP Enrichment Agent** (`lib/agents/enrichment/ip-enricher.ts`): Queries AbuseIPDB, VirusTotal, Shodan, GreyNoise, and IPInfo (ASN). Detects internal RFC1918 IPs automatically.
2. **Domain/URL Enrichment Agents** (`lib/agents/enrichment/domain-enricher.ts`): Queries VirusTotal, WHOIS, and calculates a basic DGA score.
3. **Hash Enrichment Agent** (`lib/agents/enrichment/hash-enricher.ts`): Queries VirusTotal and MalwareBazaar to classify hashes and identify malware families.
4. **Email Header Enrichment Agent** (`lib/agents/enrichment/email-enricher.ts`): Extracts SPF, DKIM, DMARC outcomes and flags display name spoofing or Reply-To mismatches.
5. **User Enrichment Agent** (`lib/agents/enrichment/user-enricher.ts`): Looks up mock AD/Okta directory info, role, department, and calculates account risk scores based on alert history.
6. **Asset Enrichment Agent** (`lib/agents/enrichment/asset-enricher.ts`): Looks up CMDB criticality, data classification, and network zones. Automatically detects and flags Shadow IT assets.
7. **Cache Layer** (`lib/agents/enrichment/cache.ts`): A unified caching module using Supabase to respect TTL limits and prevent repetitive API calls.
8. **Enrichment Orchestrator** (`lib/agents/enrichment/enrichment-orchestrator.ts`): Parses payload IOCs via regex and fans out all enrichment tasks in parallel (`Promise.allSettled`).
9. **Severity Scorer** (`lib/agents/l1/severity-scorer.ts`): Modifies base Wazuh scores by applying architectural modifiers (e.g. Crown Jewel +40, Threat Intel Match +25).
10. **Watchlist Matcher** (`lib/agents/l1/watchlist-matcher.ts`): Checks indicators against a customer-defined watchlist (supports fuzzy Levenshtein and Regex).
11. **Alert Correlator** (`lib/agents/l1/correlator.ts`): Performs SHA-256 fingerprinting for sliding window deduplication.
12. **Wazuh Webhook** (`app/api/webhooks/wazuh/route.ts`): Async entrypoint that intercepts the alert, runs enrichment, triggers severity scoring/watchlist matching, and deduplicates before inserting into the `alerts` table.
13. **Enrichment UI** (`app/dashboard/alerts/[id]/page.tsx`): A beautifully styled Next.js 15 page leveraging `#7c6af7`, IBM Plex Mono, and glassmorphism cards to present the final enriched data to analysts.

## Database Migrations
- Executed `20260430100000_layer_1_enrichment.sql` creating:
  - `assets` table (CMDB inventory)
  - `enrichment_cache` table (High performance IOC caching)
  - `watchlists` table (Org specific indicator watchlists)
- All tables strictly enforce `ROW LEVEL SECURITY` mapped to `organization_id`.

## Cache TTLs Configured
- **IPs**: 24 hours
- **Domains / URLs**: 6 hours
- **Hashes**: 7 days
- **Users**: 1 hour
- **Emails**: 1 hour
- **Assets**: 15 minutes

## Known Limitations
- DGA score calculation is currently naive (length-based) and will require an advanced entropy/bigram module in the future.
- Email header parsing uses basic regex extraction for the `Authentication-Results` header and could be expanded to support proper MIME parsing.
- Missing live PhishTank & URLhaus APIs due to credential limitations (currently stubbed).

## Validation
- Build compiled perfectly with 0 TypeScript and formatting errors.
- All Env Vars added to `.env.example`.
