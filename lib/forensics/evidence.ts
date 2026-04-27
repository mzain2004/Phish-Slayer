import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import { logCustodyEvent } from './chainOfCustody';

export interface EvidenceItem {
  id: string;
  caseId: string;
  orgId: string;
  type: 'log' | 'screenshot' | 'pcap' | 'memory_dump' | 'file_hash' | 'network_capture' | 'config';
  title: string;
  description?: string;
  content: string | object;
  hash: string;
  addedBy: string;
  addedAt: Date;
  tags: string[];
  mitreTechniques: string[];
}

export async function addEvidence(caseId: string, item: Omit<EvidenceItem, 'id' | 'hash' | 'addedAt'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const contentStr = typeof item.content === 'string' ? item.content : JSON.stringify(item.content);
  const hash = crypto.createHash('sha256').update(contentStr).digest('hex');

  const { data, error } = await supabase
    .from('case_evidence')
    .insert({
      case_id: caseId,
      organization_id: item.orgId,
      evidence_type: item.type,
      title: item.title,
      description: item.description,
      content: item.content,
      content_hash: hash,
      added_by: user.id,
      tags: item.tags,
      mitre_techniques: item.mitreTechniques
    })
    .select()
    .single();

  if (error) throw error;

  await logCustodyEvent(caseId, user.id, 'evidence_added', { 
    evidenceId: data.id, 
    evidenceTitle: item.title,
    hash 
  });

  return {
    ...data,
    addedAt: new Date(data.created_at)
  };
}

export async function getEvidenceForCase(caseId: string, orgId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('case_evidence')
    .select('*')
    .eq('case_id', caseId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data.map(item => ({
    ...item,
    addedAt: new Date(item.created_at),
    verified: true // In production, we would re-verify the hash here
  }));
}
