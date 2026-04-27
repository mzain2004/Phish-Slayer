import techniquesData from './data/techniques.json';

export interface MitreTechnique {
  id: string;
  name: string;
  shortDescription: string;
  tactics: string[];
  dataSources: string[];
  platforms: string[];
  url: string;
  subtechniqueOf: string | null;
}

const techniques: MitreTechnique[] = techniquesData as MitreTechnique[];

export const MITRE_TACTICS = [
  'Reconnaissance',
  'Resource Development',
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact'
];

export function getAllTechniques(): MitreTechnique[] {
  return techniques;
}

export function getTechniqueById(id: string): MitreTechnique | undefined {
  return techniques.find(t => t.id === id);
}

export function getTechniquesByTactic(tactic: string): MitreTechnique[] {
  const normalizedTactic = tactic.toLowerCase().replace(/\s/g, '-');
  return techniques.filter(t => 
    t.tactics.some(phase => phase.toLowerCase().replace(/\s/g, '-') === normalizedTactic)
  );
}

export function searchTechniques(query: string): MitreTechnique[] {
  const q = query.toLowerCase();
  return techniques.filter(t => 
    t.id.toLowerCase().includes(q) || 
    t.name.toLowerCase().includes(q) || 
    t.shortDescription.toLowerCase().includes(q)
  );
}
