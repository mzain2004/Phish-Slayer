import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class SplunkConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'splunk';
  type: ConnectorType = 'siem';
  organizationId: string;

  constructor(config: any, organizationId: string, id: string, name: string) {
    super(config, organizationId);
    this.id = id;
    this.name = name;
    this.organizationId = organizationId;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { baseUrl, token, port = 8089 } = this.config;
      const response = await fetch(`${baseUrl}:${port}/services/auth/login?output_mode=json`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const { baseUrl, token, index = 'main', port = 8089 } = this.config;
      
      const splQuery = `search index=${index} earliest=-15m | eval severity=case(urgency=="critical","critical", urgency=="high","high", urgency=="medium","medium",true(),"low")`;

      // Create search job
      const jobResponse = await fetch(`${baseUrl}:${port}/services/search/jobs?output_mode=json`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ search: splQuery })
      });

      if (!jobResponse.ok) throw new Error(`Splunk Job Creation Failed: ${jobResponse.statusText}`);
      const jobData = await jobResponse.json();
      const sid = jobData.sid;

      // Wait for job (simplified, normally we'd poll)
      await new Promise(res => setTimeout(res, 2000));

      // Get results
      const resultsResponse = await fetch(`${baseUrl}:${port}/services/search/jobs/${sid}/results?output_mode=json`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resultsResponse.ok) throw new Error(`Splunk Results Failed: ${resultsResponse.statusText}`);
      const resultsData = await resultsResponse.json();

      return (resultsData.results || []).map((r: any) => this.normalize(r));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    throw new Error('Splunk is currently read-only (pullEvents only)');
  }

  private normalize(raw: any): NormalizedEvent {
    return {
      id: raw._cd || Math.random().toString(),
      source: 'Splunk Enterprise',
      sourceType: 'siem',
      organizationId: this.organizationId,
      timestamp: new Date(raw._time || Date.now()),
      severity: raw.severity || 'info',
      rawPayload: raw,
      normalizedFields: {
        title: raw.alert_name || 'Splunk Alert',
        sourceIp: raw.src_ip || raw.src,
        destIp: raw.dest_ip || raw.dest,
        hostname: raw.host,
        user: raw.user
      }
    };
  }
}
