# Sprint 0.5: Universal Data Ingestion Pipeline + UDM Complete

## Summary
Built the Universal Data Ingestion Pipeline and Unified Data Model (UDM) normalization layer. This ensures that every event entering PhishSlayer (via webhooks, generic JSON batches, STIX taxii inputs, CEF, syslog, or CloudTrail) maps securely to a uniform schema with standardized types, guaranteed timestamp structures, and centralized routing through data-quality validations.

## 1. Unified Data Model (UDM)
- Defined the complete `UDMEvent` and `UDMBatch` interfaces inside `lib/ingestion/udm.ts` handling network payloads, file hashes, timestamps, MITRE alignments, and Wazuh-specific overrides.
- Performed a Supabase migration (`20260430200000_layer_0_5_udm.sql`) deploying the `udm_events`, `udm_events_archive`, and `connector_health` tables using Row Level Security (RLS) tied to `org_id`.
- Added critical lookup indexes on IPs, hashes, timestamps, and usernames allowing highly performant DB access.

## 2. Format Parsers
Built 8 distinct data parsers inside `lib/ingestion/parsers/` all resolving to `Partial<UDMEvent>`:
- **Wazuh**: Decodes rule levels to a 0-100 severity score, maps endpoints to networks.
- **CEF**: Maps standardized pipe-delimited fields, extracts custom variable extensions.
- **LEEF**: Parses QRadar generic events separating parameters via generic tabs.
- **Syslog**: Identifies RFC 3164 outputs matching sshd accepted/failed events and severity tagging.
- **CloudTrail**: Links `eventName` into outcome results and scopes AWS resource ARNs.
- **O365**: Extracts SharePoint/Teams logs mapping users to `user_upn`.
- **Suricata**: Maps IP endpoints and dynamically adjusts port numbers into severity logic.
- **Zeek**: Handles dynamic connection logs using the `#path` separator logic.
- **JSON-Generic**: Autodetects IP variants (`source_ip`, `src_ip`, `client_ip`) as a catch-all fallback.

## 3. Data Quality Agent
Implemented `runQualityChecks` inside `lib/ingestion/data-quality.ts`:
- **Clock Skew**: Marks any logs off by 1 hour as `is_stale`.
- **Duplicate Detection**: Uses sliding window SHA-256 fingerprinting avoiding ingest loops.
- **IP Validation**: Catches bad IPs via regex, correctly tags `RFC1918` ranges (10.x, 172.16.x, 192.168.x).
- **Hash Checks**: Verifies proper hex formatting and bounds checking for MD5, SHA1, and SHA256 length variations.

## 4. Ingestion Orchestrator & Connectors
- **Pipeline Setup**: `lib/ingestion/pipeline.ts` runs events through format detection -> UDM mapping -> Data Quality -> Database Insert -> Connector Health reporting before triggering the L1 agent chain (`triggerL1Pipeline`).
- Fixed historical CrowdStrike and Elastic agents manually accessing `ingestLog` directly.

## 5. Endpoints & API Receivers
- **Wazuh Webhook** (`app/api/webhooks/wazuh/route.ts`): Fully rebuilt to accept the payload asynchronously, feed it to `pipeline.ingestEvent` and reply immediately via HTTP 200.
- **CEF Receiver** (`app/api/ingest/cef/route.ts`): Processes multiline CEF imports natively.
- **STIX TAXII Receiver** (`app/api/ingest/stix/route.ts`): Imports `.stix` bundles, directly translating known indicators into the `watchlists` tables for fast matching.
- **Generic Batch Receiver** (`app/api/ingest/batch/route.ts`): Receives batches and routes mapped entries into `pipeline.ingestBatch`.
- **Syslog Standalone Server** (`lib/ingestion/syslog-server.ts`): Standalone Node.js script supporting direct UDP (514) and TCP (601) stream ingestion natively skipping Next.js limits.

## 6. Log Retention & Search
- **Retention Cron Policy** (`lib/ingestion/retention.ts`): Purges `udm_events` logs older than 30 days and smoothly transitions them to the compressed JSONB `udm_events_archive` table structure.
- **Log Search Endpoint** (`app/api/search/logs/route.ts`): Implemented a full-text global DB look-around searching specifically targeting IP/Hash lookups using `.or()` conditionals for the dashboard UI.

## Validation
- Recompiled and corrected legacy codebase Supabase `catch` query mismatches and regex incompatibilities. 
- Build executes and compiles successfully with **0 errors**.