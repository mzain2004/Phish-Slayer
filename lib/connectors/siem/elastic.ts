import { BaseConnector, NormalizedEvent, ConnectorAction, ActionResult, ConnectorType } from '../base';

export class ElasticConnector extends BaseConnector {
  id: string;
  name: string;
  vendor: string = 'elastic';
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
      const { baseUrl, apiKey } = this.config;
      const response = await fetch(`${baseUrl}/_cluster/health`, {
        headers: { Authorization: `ApiKey ${apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async pullEvents(since: Date): Promise<NormalizedEvent[]> {
    return await this.withRetry(async () => {
      const { baseUrl, apiKey, indexPattern = '.alerts-security*' } = this.config;
      const response = await fetch(`${baseUrl}/${indexPattern}/_search`, {
        method: 'POST',
        headers: { 
          Authorization: `ApiKey ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: {
            range: { '@timestamp': { gte: since.toISOString() } }
          },
          sort: [{ '@timestamp': { order: 'desc' } }]
        })
      });

      if (!response.ok) throw new Error(`Elastic Search Failed: ${response.statusText}`);
      const data = await response.json();
      return (data.hits?.hits || []).map((h: any) => this.normalize(h._source));
    });
  }

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    throw new Error('Elastic SIEM is currently read-only');
  }

  private normalize(raw: any): NormalizedEvent {
    return {
      id: raw.event?.id || Math.random().toString(),
      source: 'Elastic Security',
      sourceType: 'siem',
      organizationId: this.organizationId,
      timestamp: new Date(raw['@timestamp']),
      severity: this.mapSeverity(raw.event?.severity),
      rawPayload: raw,
      normalizedFields: {
        title: raw.signal?.rule?.name || 'Elastic Alert',
        sourceIp: raw.source?.ip,
        destIp: raw.destination?.ip,
        hostname: raw.host?.name,
        user: raw.user?.name,
        filePath: raw.file?.path,
        hash: raw.file?.hash?.sha256
      }
    };
  }

  private mapSeverity(score: number | undefined): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (!score) return 'info';
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'info';
  }
}
