export type OsintTargetType = 'domain'|'ip'|'email'|'hash'|'person'|'company';

export interface OsintTarget { 
  type: OsintTargetType; 
  value: string; 
  orgId: string; 
}

export interface IOC { 
  type: string; 
  value: string; 
  confidence: number; 
  source: string; 
}

export interface CollectorResult { 
  collector: string; 
  success: boolean; 
  data: any; 
  error?: string; 
  iocs: IOC[]; 
}

export interface OsintReport { 
  narrative: string; 
  riskScore: number; 
  keyFindings: string[]; 
  recommendations: string[]; 
}
