import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'pagerduty';
export type NotificationEventType = 'critical_alert' | 'incident_created' | 'case_sla_breach' | 'connector_failure' | 'enrichment_complete' | 'new_evidence';

export interface NotificationEvent {
  type: NotificationEventType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  url?: string;
  metadata?: any;
}

export async function dispatchNotification(orgId: string, event: NotificationEvent) {
  const supabase = await createClient();

  // Fetch active configs for this org
  const { data: configs } = await supabase
    .from('notification_configs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (!configs) return;

  const severityWeights: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  const eventWeight = severityWeights[event.severity] || 0;

  for (const config of configs) {
    const thresholdWeight = severityWeights[config.severity_threshold] || 0;
    
    // Check threshold and event type
    if (eventWeight >= thresholdWeight && config.event_types.includes(event.type)) {
      try {
        switch (config.channel_type as NotificationChannel) {
          case 'slack':
            await sendSlackNotification(config.config.webhookUrl, event);
            break;
          case 'email':
            await sendEmailNotification(config.config.email, event);
            break;
          case 'webhook':
            await sendWebhookNotification(config.config.url, config.config.secret, event);
            break;
          case 'pagerduty':
            if (eventWeight >= 3) { // High/Critical only
              await sendPagerDutyAlert(config.config.integrationKey, event, orgId);
            }
            break;
        }
        
        await logNotification(orgId, config.channel_type, event.type, 'sent');
      } catch (err: any) {
        console.error(`Failed to send ${config.channel_type} notification:`, err.message);
        await logNotification(orgId, config.channel_type, event.type, 'failed', err.message);
      }
    }
  }
}

async function sendSlackNotification(webhookUrl: string, event: NotificationEvent) {
  const colors: Record<string, string> = { critical: '#ff4d4f', high: '#f5a623', medium: '#ffec3d', low: '#1890ff', info: '#d9d9d9' };
  
  const payload = {
    attachments: [{
      color: colors[event.severity],
      title: event.title,
      text: event.description,
      fields: [
        { title: 'Severity', value: event.severity.toUpperCase(), short: true },
        { title: 'Event Type', value: event.type, short: true }
      ],
      footer: 'PhishSlayer Alerts',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`Slack API error: ${res.statusText}`);
}

async function sendEmailNotification(to: string, event: NotificationEvent) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[EMAIL MOCK] To: ${to}, Subject: ${event.title}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'PhishSlayer <alerts@phishslayer.tech>',
      to: [to],
      subject: `[${event.severity.toUpperCase()}] ${event.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background: ${event.severity === 'critical' ? '#ff4d4f' : '#7c6af7'}; padding: 20px; color: white;">
            <h2>${event.title}</h2>
          </div>
          <div style="padding: 20px;">
            <p>${event.description}</p>
            ${event.url ? `<a href="${event.url}" style="display: inline-block; padding: 10px 20px; background: #7c6af7; color: white; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
          </div>
        </div>
      `
    })
  });

  if (!res.ok) throw new Error(`Resend API error: ${res.statusText}`);
}

async function sendWebhookNotification(url: string, secret: string, event: NotificationEvent) {
  const body = JSON.stringify(event);
  const signature = crypto.createHmac('sha256', secret || 'default_secret').update(body).digest('hex');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-PhishSlayer-Signature': signature
    },
    body,
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) throw new Error(`Webhook error: ${res.statusText}`);
}

async function sendPagerDutyAlert(integrationKey: string, event: NotificationEvent, orgId: string) {
  const payload = {
    payload: {
      summary: event.title,
      severity: event.severity === 'critical' ? 'critical' : 'error',
      source: 'PhishSlayer',
      custom_details: { ...event.metadata, description: event.description }
    },
    routing_key: integrationKey,
    event_action: 'trigger',
    dedup_key: `${event.type}-${orgId}`
  };

  const res = await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error(`PagerDuty error: ${res.statusText}`);
}

async function logNotification(orgId: string, channel: string, eventType: string, status: 'sent' | 'failed', error?: string) {
  const supabase = await createClient();
  await supabase.from('notification_log').insert({
    organization_id: orgId,
    channel_type: channel,
    event_type: eventType,
    status,
    error
  });
}
