# API Quick Start

PhishSlayer provides a robust REST API for programmatic ingestion and management.

## 1. Generate API Key
Go to **Settings → API Keys** in your dashboard. Generate a new key and copy it immediately.

## 2. Send Test Alert
Use your API key to send a security event to the PhishSlayer webhook ingest point.

```bash
curl -X POST https://phishslayer.tech/api/ingest/webhook \
  -H "X-API-Key: ps_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "Manual",
    "event_type": "test_alert",
    "severity": "HIGH",
    "data": {
      "src_ip": "1.2.3.4",
      "message": "Simulated brute force attack"
    }
  }'
```

## 3. View in Dashboard
Log in to PhishSlayer and navigate to the **Alerts** or **Mission Control** tab. Your alert should appear in the feed within seconds, tagged with MITRE techniques by the L1 Agent.

## API Documentation
Full interactive docs are available at:
`https://phishslayer.tech/api-docs`
