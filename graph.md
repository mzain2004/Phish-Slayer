# PHISHSLAYER — ARCHITECTURE GRAPH
# Agents: view this file at session start for full platform reasoning context.
# Command: @graph.md

## PLATFORM DEPENDENCY GRAPH
```
ALERT INGEST
    │
    ▼
[Layer 1: Data Ingestion]
    │  Syslog/Webhook/Kafka/S3/EventHub/PubSub/SFTP/REST/SMTP/TAXII/OTel/PCAP
    │  UDM Normalization → Data Quality → TI Feed Ingestion → Dark Web Scraper
    ▼
[Layer 2: SOC L1 Triage]
    │  Asset Enrichment → IP/Domain/Hash/Email/User Enrichment
    │  FP Elimination (rules + XGBoost) → Severity Scoring (0-100)
    │  MITRE Auto-Tagger → Watchlist Match → SLA Countdown
    │  Alert Correlation + Grouping → Evidence Auto-Collect
    │  Data Source Health Monitor (blind spot detection)
    ▼ confidence >= 0.85
[Layer 3: SOC L2 Investigation]
    │  Investigation Orchestrator → Log Correlation (temporal/entity/cross-source)
    │  Root Cause Analysis → Scope/Blast Radius → UEBA Behavioral Analysis
    │  Network Forensics + PCAP → Malware Static + Sandbox → Memory Forensics
    │  Lateral Movement → Ransomware Pre-Detonation → Credential Analysis
    │  Privilege Escalation Mapper → C2 Detection → DNS Forensics
    ▼ confidence >= 0.70 for L3, or new hunt triggers
[Layer 4: SOC L3 Hunting + Intel]
    │  Proactive Hunt Scheduler → MITRE Coverage Engine + Heatmap
    │  Threat Actor Profiling (150+ APTs) → Campaign Tracker
    │  Detection Engineering (Sigma lifecycle) → Hunt→Detection Pipeline
    │  Threat Briefing Generator → Regulatory CVE Mapping
    ▼
[Layer 6: Response Engine]           [Layer 5: OSINT Agents]
    │  Playbook Builder                   │  Domain/Brand Intel
    │  Containment Decision Engine        │  Network Footprint (Shodan/Censys)
    │  Action Library:                    │  Credential/Leak Monitor (HIBP)
    │    Network: block IP/domain/URL     │  Code Repo Monitor (GitHub/GitLab)
    │    Endpoint: isolate/kill/quarantine│  Paste Site Monitor
    │    Identity: disable/revoke/rotate  │  Dark Web Intelligence
    │    Cloud: revoke IAM/snapshot/NSG   │  Social Media OSINT
    │  Multi-model consensus (>=0.90)     │  Supply Chain Intel
    │  Human approval gate (>=0.95)       │  Vuln Intelligence (CVE/EPSS/KEV)
    │  Containment Verification           │  Infrastructure Footprint
    │  Rollback Agent
    ▼
[Layer 7: Case Management]
    │  Lifecycle: Open→InProgress→Contained→Remediated→Closed→Archived
    │  Case Merging → Timeline View → Evidence Management
    │  Stakeholder Notification → PIR Generator
    ▼
[Layer 8: Compliance + Legal]         [Layer 9: Notifications]
    │  GDPR 72hr countdown agent          │  Email/Slack/Teams/PagerDuty/SMS
    │  CCPA/HIPAA/PCI/DORA/NIS2/SEC       │  On-call rotation engine
    │  ISO27001/SOC2/NIST CSF mapping     │  Escalation chains
    │  Immutable cryptographic audit trail│  Alert fatigue prevention
    │  Audit-ready evidence packaging     │  Delivery confirmation + retry
    ▼
[Layer 10: Reporting + Analytics]
    │  MTTD/MTTA/MTTR/MTTC metrics
    │  Executive dashboard (board-level)
    │  All report types: Technical/Executive/Regulatory/PIR/Board
    │  Agent calibration scoring
    │  ROI per detection rule
    ▼
[Layer 11: Integrations]              [Layer 12: Platform Infra]
    EDR: CrowdStrike/SentinelOne/        Multi-tenant isolation
         Carbon Black/Defender/XDR       Resource quotas per tenant
    SIEM: Splunk/QRadar/Sentinel/        API key management
          Elastic/LogRhythm              Feature flags per plan
    FW: PaloAlto/Fortinet/Cisco/         Platform self-healing agent
        pfSense/AWS-SG/AzureNSG          Disaster recovery
    IdP: AD/AzureAD/Okta/Ping/CyberArk
    Email: O365/Google Workspace
    Cloud: GuardDuty/AzureDefender/GCP-SCC
    Vuln: Nessus/Qualys/Rapid7
    Tickets: Jira/ServiceNow/PagerDuty
```

## FOUNDATIONAL: LAYER 0 MUST EXIST FIRST
```
Layer 0: Agent Runtime (everything above runs ON this)
    Agent Supervisor (spawn/monitor/restart/kill)
    State Machine: IDLE→QUEUED→RUNNING→BLOCKED→ESCALATED→COMPLETED→FAILED→RETRYING→ARCHIVED
    Communication Bus (Redis Streams / Kafka)
    Handoff Envelope: {alert_id, org_id, agent_id, tier, confidence, findings, actions_taken, handoff_context, timestamp}
    Confidence Gates: L2=0.85, L3=0.70, Destructive=0.90, HumanGate=0.95
    Multi-model consensus: 2+ LLMs agree before any destructive action
    Prompt injection firewall: sanitize all log data before LLM
    Token budget per investigation (per plan tier)
    Context window manager: >80% context → summarize + continue
    Fallback chain: Groq→OpenAI→Anthropic→Ollama (auto-failover)
    Dead letter queue: failed runs persisted + replayable
    Warm pool: pre-initialized agent instances <500ms cold start
    Checkpoint/resume: crash → resume from last save, never restart
```

## SPRINT SEQUENCE
```
Layer 0 → Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4 → Sprint 5
  ↓          ↓          ↓          ↓          ↓          ↓
Runtime    Enrich    MITRE      Brand      Notify    Sandbox
Infra      Pipeline  Coverage   Monitor    Engine    Malware

Sprint 6 → Sprint 7 → Sprint 8 → Sprint 9 → Sprint 10
  ↓          ↓          ↓          ↓           ↓
Case       Comply    ThreatAct  Detection   Metrics
Mgmt      +Audit    +Campaign   Sigma       Dashboard
```

## ENTITY RELATIONSHIPS
```
Organization
    ├── Members (role: owner/admin/analyst/viewer)
    ├── Connectors (Wazuh/CrowdStrike/O365/etc)
    ├── Alerts ──→ agent_runs ──→ agent_actions
    │              (L1→L2→L3)
    ├── Incidents (grouped alerts)
    ├── Cases (formal investigation record)
    ├── Detection Rules
    ├── Suppression Rules
    ├── Watchlists
    ├── Hunt Hypotheses
    ├── OSINT Investigations
    ├── Threat Intel (IOCs, actors, campaigns)
    └── Compliance Records
```

## DATA FLOW: ALERT LIFECYCLE
```
Wazuh/EDR/Email/SIEM
    → Webhook/API ingest
    → UDM normalization
    → Data quality check
    → Watchlist match (instant HIGH if hit)
    → FP elimination (rule-based + ML)
    → Asset context enrichment
    → IP/Domain/Hash enrichment
    → Severity scoring (0-100)
    → MITRE auto-tagging
    → SLA countdown starts
    → Alert correlation (dedup + group)
    → Evidence auto-collect
    → L1 agent run (confidence scored)
        → confidence >= 0.85: escalate to L2
        → confidence < 0.85: auto-close or watch
    → L2 investigation agent
        → timeline reconstruction
        → scope assessment
        → root cause
        → confidence >= 0.70: pass to L3
    → L3 hunting/intel agent
        → actor attribution
        → campaign linking
        → hunt queries generated
    → Response engine
        → containment decision
        → action execution (with verification)
        → case update
    → Case management
        → notifications sent
        → compliance check
        → PIR generated on close
```
