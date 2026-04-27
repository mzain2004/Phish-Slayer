import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class CarbonBlackConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'carbonblack';
  type: ConnectorType = 'edr';
  organizationId: string;

  constructor(config: any, organizationId: string, id: string, name: string) {
    super(config, organizationId);
    this.id = id;
    this.name = name;
    this.organizationId = organizationId;
  }

  async testConnection(): Promise<boolean> {
    try {
      const { apiKey, cbcUrl, orgKey } = this.config;
      const response = await fetch(`${cbcUrl}/appcheck/v1/orgs/${orgKey}/status`, {
        headers: { 'X-Auth-Token': apiKey }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const { apiKey, cbcUrl, orgKey } = this.config;
      const response = await fetch(`${cbcUrl}/api/alerts/v1/orgs/${orgKey}/alerts/_search`, {
        method: 'POST',
        headers: { 
          'X-Auth-Token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          criteria: { create_time: { start: since.toISOString() } },
          sort: [{ field: 'create_time', order: 'DESC' }]
        })
      });

      if (!response.ok) throw new Error(`Carbon Black Pull Failed: ${response.statusText}`);
      const data = await response.json();
      return (data.results || []).map((a: any) => this.normalize(a));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    return await this.withRetry(async () => {
      const { apiKey, cbcUrl, orgKey } = this.config;
      let url = '';
      let body = {};

      switch (action.type) {
        case 'isolate_host':
          url = `${cbcUrl}/appcheck/v1/orgs/${orgKey}/devices/${action.target}/actions`;
          body = { action_type: 'QUARANTINE', comment: 'Isolated by PhishSlayer' };
          break;
        default:
          throw new Error(`Action ${action.type} not supported by Carbon Black`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'X-Auth-Token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return { success: response.ok, message: response.statusText, timestamp: new Date() };
    });
  }

  private normalize(raw: any): NormalizedEvent {
    return {
      id: raw.id,
      source: 'VMware Carbon Black Cloud',
      sourceType: 'edr',
      organizationId: this.organizationId,
      timestamp: new Date(raw.create_time),
      severity: this.mapSeverity(raw.severity),
      rawPayload: raw,
      normalizedFields: {
        title: raw.reason,
        hostname: raw.device_name,
        user: raw.device_username,
        filePath: raw.process_name,
        hash: raw.process_sha256
      }
    };
  }

  private mapSeverity(score: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (score >= 9) return 'critical';
    if (score >= 7) return 'high';
    if (score >= 4) return 'medium';
    if (score >= 1) return 'low';
    return 'info';
  }
}
