import crypto from 'crypto';
import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function deliverWebhook(orgId: string, eventType: string, payload: any): Promise<void> {

  // 1. Query active webhook_endpoints
  const { data: endpoints, error } = await supabaseAdmin
    .from('webhook_endpoints')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .contains('event_types', [eventType]);

  if (error || !endpoints || endpoints.length === 0) {
    if (error) console.error('[WebhookDelivery] Error fetching endpoints:', error);
    return;
  }

  // 2. Deliver to each endpoint
  for (const endpoint of endpoints) {
    await attemptDelivery(endpoint, eventType, payload);
  }
}

async function attemptDelivery(endpoint: any, eventType: string, payload: any, attempt = 1): Promise<void> {
  const startTime = Date.now();
  const payloadStr = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', endpoint.secret).update(payloadStr).digest('hex');

  let responseStatus = 0;
  let success = false;
  let errorMsg = '';

  try {
    const response = await axios.post(endpoint.url, payload, {
      headers: {
        'X-PhishSlayer-Signature': `sha256=${hmac}`,
        'X-PhishSlayer-Event': eventType,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds
    });
    responseStatus = response.status;
    success = response.status >= 200 && response.status < 300;
  } catch (error: any) {
    responseStatus = error.response?.status || 0;
    errorMsg = error.message;
    success = false;
  }

  const durationMs = Date.now() - startTime;

  // Log delivery
  await supabaseAdmin.from('webhook_deliveries').insert({
    org_id: endpoint.org_id,
    endpoint_id: endpoint.id,
    event_type: eventType,
    payload: payload,
    response_status: responseStatus,
    duration_ms: durationMs,
    attempt_count: attempt,
    status: success ? 'delivered' : 'failed',
    next_retry_at: !success && attempt < 4 ? calculateNextRetry(attempt) : null
  });

  // Update endpoint stats
  if (success) {
    await supabaseAdmin.from('webhook_endpoints').update({
      failure_count: 0,
      last_delivery_at: new Date().toISOString()
    }).eq('id', endpoint.id);
  } else {
    const newFailureCount = (endpoint.failure_count || 0) + 1;
    await supabaseAdmin.from('webhook_endpoints').update({
      failure_count: newFailureCount,
      is_active: newFailureCount <= 5
    }).eq('id', endpoint.id);

    if (newFailureCount > 5) {
      console.warn(`[WebhookDelivery] Endpoint ${endpoint.id} deactivated due to excessive failures.`);
      // TODO: Notify org owners
    }
  }
}

function calculateNextRetry(attempt: number): string {
  const delays = [5, 30, 120]; // minutes
  const delay = delays[attempt - 1] || 120;
  return new Date(Date.now() + delay * 60000).toISOString();
}
