import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class SentinelOneConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'sentinelone';
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
      const { managementUrl, apiToken } = this.config;
      const response = await fetch(`${managementUrl}/web/api/v2.1/system/status`, {
        headers: { 'X-Auth-Token': apiToken }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const { managementUrl, apiToken } = this.config;
      const response = await fetch(`${managementUrl}/web/api/v2.1/threats?createdAt__gte=${since.toISOString()}`, {
        headers: { 'X-Auth-Token': apiToken }
      });

      if (!response.ok) throw new Error(`S1 Pull Failed: ${response.statusText}`);
      const data = await response.json();
      return (data.data || []).map((t: any) => this.normalize(t));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    return await this.withRetry(async () => {
      const { managementUrl, apiToken } = this.config;
      let endpoint = '';
      let body = {};

      switch (action.type) {
        case 'isolate_host':
          endpoint = '/web/api/v2.1/agents/actions/disconnect';
          body = { filter: { ids: [action.target] } };
          break;
        case 'quarantine_file':
          endpoint = '/web/api/v2.1/threats/mitigate/quarantine';
          body = { filter: { ids: [action.target] } };
          break;
        default:
          throw new Error(`Action ${action.type} not supported by SentinelOne`);
      }

      const response = await fetch(`${managementUrl}${endpoint}`, {
        method: 'POST',
        headers: { 
          'X-Auth-Token': apiToken,
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
      source: 'SentinelOne',
      sourceType: 'edr',
      organizationId: this.organizationId,
      timestamp: new Date(raw.createdAt),
      severity: this.mapSeverity(raw.rank),
      rawPayload: raw,
      normalizedFields: {
        title: raw.threatName,
        hostname: raw.agentComputerName,
        user: raw.username,
        filePath: raw.filePath,
        hash: raw.fileContentHash
      }
    };
  }

  private mapSeverity(rank: string): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const r = rank?.toLowerCase();
    if (r === 'critical') return 'critical';
    if (r === 'high') return 'high';
    if (r === 'medium') return 'medium';
    if (r === 'low') return 'low';
    return 'info';
  }
}
