import axios from 'axios';

export async function sendSlackMessage(webhookUrl: string, event: any) {
    const payload = {
        text: `*${event.severity.toUpperCase()} Alert:* ${event.message}`,
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*${event.severity.toUpperCase()} Alert:* ${event.message}`
                }
            },
            {
                type: "context",
                elements: [
                    { type: "mrkdwn", text: `*Type:* ${event.event_type}` },
                    { type: "mrkdwn", text: `*Alert ID:* ${event.alert_id || 'N/A'}` },
                    { type: "mrkdwn", text: `*Case ID:* ${event.case_id || 'N/A'}` }
                ]
            }
        ]
    };

    try {
        await axios.post(webhookUrl, payload);
    } catch (error: any) {
        console.error('[SlackSender] Failed to send message:', error.response?.data || error.message);
        throw error;
    }
}
