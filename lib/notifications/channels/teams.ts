import axios from 'axios';

export async function sendTeamsMessage(webhookUrl: string, event: any) {
    const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": event.severity === 'critical' ? "FF0000" : "FFA500",
        "summary": "PhishSlayer Security Alert",
        "sections": [{
            "activityTitle": `**${event.severity.toUpperCase()} Alert:** ${event.message}`,
            "activitySubtitle": `Type: ${event.event_type}`,
            "facts": [
                { "name": "Alert ID", "value": event.alert_id || 'N/A' },
                { "name": "Case ID", "value": event.case_id || 'N/A' }
            ],
            "markdown": true
        }]
    };

    try {
        await axios.post(webhookUrl, payload);
    } catch (error: any) {
        console.error('[TeamsSender] Failed to send message:', error.response?.data || error.message);
        throw error;
    }
}
