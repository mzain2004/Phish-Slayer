import axios from 'axios';

export async function sendPagerDuty(routingKey: string, event: any) {
    const payload = {
        payload: {
            summary: `[${event.severity.toUpperCase()}] ${event.message}`,
            timestamp: new Date().toISOString(),
            source: "PhishSlayer Platform",
            severity: event.severity === 'critical' ? 'critical' : event.severity === 'high' ? 'error' : 'warning',
            component: event.event_type,
            custom_details: {
                alert_id: event.alert_id,
                case_id: event.case_id
            }
        },
        routing_key: routingKey,
        event_action: "trigger"
    };

    try {
        await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
    } catch (error: any) {
        console.error('[PagerDutySender] Failed to trigger incident:', error.response?.data || error.message);
        throw error;
    }
}
