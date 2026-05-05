#!/bin/bash
# PhishSlayer Wazuh Custom Webhook
# Deploy to: /var/ossec/active-response/bin/phishslayer_webhook.sh on Wazuh VM
# chmod +x and set in ossec.conf

PHISHSLAYER_URL="https://phishslayer.yourdomain.com/api/v1/wazuh/alert"
SECRET="your-webhook-secret-here"  # replace with actual WAZUH_WEBHOOK_SECRET

curl -s -X POST "$PHISHSLAYER_URL" \
  -H "Content-Type: application/json" \
  -H "X-PhishSlayer-Key: $SECRET" \
  -d "{
    \"id\": \"$1\",
    \"rule\": {\"description\": \"$2\", \"level\": $3},
    \"agent\": {\"ip\": \"$4\"},
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }"
