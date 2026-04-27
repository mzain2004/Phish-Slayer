export type ConnectorType = 'edr' | 'siem' | 'firewall' | 'wazuh';

export interface NormalizedEvent {
  id: string;
  source: string;
  sourceType: ConnectorType;
  organizationId: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  rawPayload: any;
  normalizedFields: {
    title?: string;
    description?: string;
    sourceIp?: string;
    destIp?: string;
    hostname?: string;
    user?: string;
    filePath?: string;
    hash?: string;
    [key: string]: any;
  };
}

export interface ConnectorAction {
  type: 'block_ip' | 'isolate_host' | 'kill_process' | 'quarantine_file';
  target: string;
  metadata?: any;
}

export interface ActionResult {
  success: boolean;
  actionId?: string;
  message: string;
  timestamp: Date;
}

export abstract class BaseConnector {
  abstract id: string;
  abstract name: string;
  abstract vendor: string;
  abstract type: ConnectorType;
  organizationId: string;
  protected config: any;

  constructor(config: any, organizationId: string) {
    this.config = config;
    this.organizationId = organizationId;
  }

  abstract testConnection(): Promise<boolean>;
  abstract pullEvents(since: Date): Promise<NormalizedEvent[]>;
  abstract executeAction(action: ConnectorAction): Promise<ActionResult>;

  protected async withRetry<T>(fn: () => Promise<T>, attempts = 3, backoff = 1000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < attempts; i++) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${this.name}: Request timed out`)), 10000)
        );
        return await Promise.race([fn(), timeoutPromise as Promise<T>]);
      } catch (error: any) {
        lastError = error;
        console.error(`[${this.vendor}] Attempt ${i + 1} failed:`, error.message);
        if (i < attempts - 1) {
          await new Promise(res => setTimeout(res, backoff * Math.pow(2, i)));
        }
      }
    }
    throw lastError;
  }

  protected log(message: string, level: 'info' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${this.vendor}:${this.name}] ${message}`);
  }
}
