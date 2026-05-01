# Performance Targets

The PhishSlayer platform maintains strict performance targets to ensure high availability and responsiveness in production environments.

## API Latency (95th Percentile)
- `/api/health`: < 100ms
- `/api/alerts`: < 500ms
- `/api/ingest/webhook`: < 200ms

## Agent Processing (Target)
- **Agent L1 (Triage)**: < 30 seconds per alert from ingestion to classification.
- **Agent L2 (Investigation)**: < 2 minutes from escalation to containment proposal.
- **Agent L3 (Hunting)**: < 5 minutes for organization-wide OSINT scans.

## Scalability
- **Ingestion**: Handle up to 10,000 alerts per minute on baseline hardware (Standard_B2s).
- **Storage**: Maintain sub-second query performance on indexes up to 100M events per organization.

## Load Testing
Regular load tests are executed via `npm run test:perf` to verify these targets are met. Failure to meet average latency targets (< 2000ms) or an error rate > 10% will trigger automated build failures.
