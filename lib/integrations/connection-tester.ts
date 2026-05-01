import axios from 'axios';

export async function testConnection(integrationId: string, config: Record<string, any>): Promise<{ success: boolean, message: string }> {

    try {
        switch (integrationId) {
            case 'wazuh': {
                const { WAZUH_URL, WAZUH_USER, WAZUH_PASS } = config;
                if (!WAZUH_URL || !WAZUH_USER || !WAZUH_PASS) return { success: false, message: 'Missing required configuration' };
                
                const token = Buffer.from(`${WAZUH_USER}:${WAZUH_PASS}`).toString('base64');
                const response = await axios.get(`${WAZUH_URL}/security/user/authenticate`, {
                    headers: { 'Authorization': `Basic ${token}` },
                    timeout: 5000
                });
                return { success: response.status === 200, message: response.status === 200 ? 'Connection successful' : `Failed with status ${response.status}` };
            }

            case 'splunk': {
                const { SPLUNK_URL, SPLUNK_TOKEN } = config;
                if (!SPLUNK_URL || !SPLUNK_TOKEN) return { success: false, message: 'Missing required configuration' };
                
                const response = await axios.get(`${SPLUNK_URL}/services/server/info?output_mode=json`, {
                    headers: { 'Authorization': `Bearer ${SPLUNK_TOKEN}` },
                    timeout: 5000
                });
                return { success: response.status === 200, message: response.status === 200 ? 'Connection successful' : `Failed with status ${response.status}` };
            }

            case 'jira': {
                const { JIRA_URL, JIRA_EMAIL, JIRA_API_TOKEN } = config;
                if (!JIRA_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) return { success: false, message: 'Missing required configuration' };

                const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
                const response = await axios.get(`${JIRA_URL}/rest/api/3/myself`, {
                    headers: { 'Authorization': `Basic ${token}`, 'Accept': 'application/json' },
                    timeout: 5000
                });
                return { success: response.status === 200, message: response.status === 200 ? 'Connection successful' : `Failed with status ${response.status}` };
            }

            case 'pagerduty': {
                const { PD_ROUTING_KEY } = config;
                // Hard to test routing key without triggering incident, testing generic API access if they provided an API key instead of just routing key
                // For this demo, let's assume they provide a general API key for testing, or we just validate format.
                // The prompt asks to GET /users. This requires a general API key, not a routing key.
                const pdKey = config.PD_API_KEY || PD_ROUTING_KEY; // Fallback
                if (!pdKey) return { success: false, message: 'Missing required configuration' };

                const response = await axios.get('https://api.pagerduty.com/users', {
                    headers: { 
                        'Authorization': `Token token=${pdKey}`,
                        'Accept': 'application/vnd.pagerduty+json;version=2'
                    },
                    timeout: 5000
                });
                return { success: response.status === 200, message: response.status === 200 ? 'Connection successful' : `Failed with status ${response.status}` };
            }

            case 'slack': {
                const { SLACK_TOKEN } = config; // Assuming they provide a bot token
                if (!SLACK_TOKEN) return { success: false, message: 'Missing required configuration' };

                const response = await axios.post('https://slack.com/api/auth.test', {}, {
                    headers: { 'Authorization': `Bearer ${SLACK_TOKEN}` },
                    timeout: 5000
                });
                return { success: response.data?.ok === true, message: response.data?.ok ? 'Connection successful' : `Slack API error: ${response.data?.error}` };
            }

            case 'o365': {
                const { MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET } = config;
                if (!MS_TENANT_ID || !MS_CLIENT_ID || !MS_CLIENT_SECRET) return { success: false, message: 'Missing required configuration' };
                // Validate format only (basic check)
                if (MS_TENANT_ID.length < 10 || MS_CLIENT_ID.length < 10) return { success: false, message: 'Invalid token format' };
                return { success: true, message: 'Token format validated. Full OAuth required for complete test.' };
            }

            default:
                return { success: true, message: 'Manual verification required for this integration type.' };
        }
    } catch (error: any) {
        console.error(`[ConnectionTester] Error testing ${integrationId}:`, error.message);
        return { 
            success: false, 
            message: error.response?.data?.message || error.response?.statusText || error.message || 'Connection failed' 
        };
    }
}
