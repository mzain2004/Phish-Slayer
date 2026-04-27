import fs from 'fs';
import path from 'path';

async function fetchMitre() {
  console.log('Fetching MITRE ATT&CK data...');
  const url = 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json';
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch MITRE data: ${response.statusText}`);
    
    const data = await response.json();
    const objects = data.objects || [];
    
    const techniques = objects
      .filter((obj: any) => obj.type === 'attack-pattern' && !obj.x_mitre_deprecated)
      .map((obj: any) => {
        const externalId = obj.external_references?.find((ref: any) => ref.source_name === 'mitre-attack')?.external_id;
        return {
          id: externalId,
          name: obj.name,
          shortDescription: obj.description?.substring(0, 300) + '...',
          tactics: obj.kill_chain_phases?.map((phase: any) => phase.phase_name.replace(/-/g, ' ')) || [],
          dataSources: obj.x_mitre_data_sources || [],
          platforms: obj.x_mitre_platforms || [],
          url: obj.external_references?.find((ref: any) => ref.source_name === 'mitre-attack')?.url,
          subtechniqueOf: obj.x_mitre_is_subtechnique ? obj.revoked_by : null // simplified logic for sub-techniques
        };
      })
      .filter((tech: any) => tech.id);

    const dir = path.join(process.cwd(), 'lib', 'mitre', 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(dir, 'techniques.json'),
      JSON.stringify(techniques, null, 2)
    );

    console.log(`Successfully saved ${techniques.length} techniques to lib/mitre/data/techniques.json`);
  } catch (error) {
    console.error('Error fetching MITRE data:', error);
    process.exit(1);
  }
}

fetchMitre();
