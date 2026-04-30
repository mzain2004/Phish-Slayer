/**
 * Threat Actor Profiles for PhishSlayer
 * Comprehensive technical profiles for attribution and campaign tracking.
 */

export interface ActorProfile {
    id: string;
    name: string;
    country: string;
    target_sectors: string[];
    mitre_techniques: string[];
    malware_families: string[];
    description: string;
}

export const THREAT_ACTORS: ActorProfile[] = [
    {
        id: 'lazarus',
        name: 'Lazarus Group',
        country: 'North Korea',
        target_sectors: ['Financial', 'Crypto', 'Government', 'Defense'],
        mitre_techniques: ['T1566', 'T1059', 'T1027', 'T1071', 'T1105'],
        malware_families: ['Manuscrypt', 'Fallchill', 'Dtrack'],
        description: 'State-sponsored group responsible for high-profile financial and espionage operations.'
    },
    {
        id: 'apt28',
        name: 'APT28 (Fancy Bear)',
        country: 'Russia',
        target_sectors: ['Government', 'Military', 'NATO', 'NGO'],
        mitre_techniques: ['T1566', 'T1133', 'T1078', 'T1059.001'],
        malware_families: ['X-Agent', 'GameFish', 'Zebrocy'],
        description: 'Russian military intelligence group focused on geopolitical influence and espionage.'
    },
    {
        id: 'apt29',
        name: 'APT29 (Cozy Bear)',
        country: 'Russia',
        target_sectors: ['Government', 'Think Tanks', 'Health', 'Tech'],
        mitre_techniques: ['T1078', 'T1190', 'T1583', 'T1071.001'],
        malware_families: ['WellMess', 'WellMail', 'SolarWinds-Backdoor'],
        description: 'Advanced group linked to the SVR, known for high stealth and supply chain attacks.'
    },
    {
        id: 'apt41',
        name: 'APT41 (Double Dragon)',
        country: 'China',
        target_sectors: ['Tech', 'Health', 'Retail', 'Telecom'],
        mitre_techniques: ['T1190', 'T1059', 'T1053', 'T1070'],
        malware_families: ['Winnti', 'ShadowPad', 'Cobalt Strike'],
        description: 'Chinese group conducting both state-sponsored espionage and financially motivated crime.'
    },
    {
        id: 'fin7',
        name: 'FIN7',
        country: 'Eastern Europe',
        target_sectors: ['Retail', 'Hospitality', 'Gaming'],
        mitre_techniques: ['T1566.001', 'T1204.002', 'T1059.001'],
        malware_families: ['Carbanak', 'Lizar', 'Tirion'],
        description: 'Highly organized cybercrime group focused on large-scale theft of payment card data.'
    },
    {
        id: 'fin8',
        name: 'FIN8',
        country: 'Russia/CIS',
        target_sectors: ['Retail', 'Hospitality', 'Entertainment'],
        mitre_techniques: ['T1566', 'T1059', 'T1027', 'T1105'],
        malware_families: ['BADHATCH', 'Sardonic', 'PUNCHTRACK'],
        description: 'Cybercrime actor targeting POS systems and high-value financial transactions.'
    },
    {
        id: 'carbanak',
        name: 'Carbanak (Anunak)',
        country: 'Russia/Ukraine',
        target_sectors: ['Financial', 'Banks'],
        mitre_techniques: ['T1566', 'T1059', 'T1078', 'T1021'],
        malware_families: ['Carbanak', 'Anunak', 'Cobalt Strike'],
        description: 'Infamous for stealing over $1 billion from financial institutions globally.'
    },
    {
        id: 'conti',
        name: 'Conti',
        country: 'Russia',
        target_sectors: ['Health', 'Government', 'Education', 'Manufacturing'],
        mitre_techniques: ['T1486', 'T1059', 'T1021', 'T1566'],
        malware_families: ['Conti', 'BazarLoader', 'TrickBot'],
        description: 'Aggressive Ransomware-as-a-Service operator known for double extortion tactics.'
    },
    {
        id: 'lockbit',
        name: 'LockBit',
        country: 'Global/RaaS',
        target_sectors: ['Critical Infrastructure', 'Manufacturing', 'Finance'],
        mitre_techniques: ['T1486', 'T1059', 'T1133', 'T1070'],
        malware_families: ['LockBit', 'StealBit'],
        description: 'Dominant RaaS group known for the fastest encryption speeds and reliable affiliate network.'
    },
    {
        id: 'cl0p',
        name: 'Cl0p',
        country: 'Eastern Europe',
        target_sectors: ['Finance', 'Legal', 'Education'],
        mitre_techniques: ['T1190', 'T1486', 'T1059', 'T1027'],
        malware_families: ['Cl0p', 'FlawedAmmyy', 'MOVEit-Exploit'],
        description: 'Known for large-scale data theft via zero-day exploitation of file transfer software.'
    },
    {
        id: 'alphv',
        name: 'ALPHV (BlackCat)',
        country: 'Global/RaaS',
        target_sectors: ['Energy', 'Finance', 'Logistics'],
        mitre_techniques: ['T1486', 'T1059', 'T1078', 'T1562'],
        malware_families: ['BlackCat', 'Exmatter'],
        description: 'Sophisticated RaaS group using Rust-based ransomware for high portability.'
    },
    {
        id: 'scattered-spider',
        name: 'Scattered Spider',
        country: 'US/Europe/UK',
        target_sectors: ['Gaming', 'Tech', 'Critical Infrastructure'],
        mitre_techniques: ['T1566', 'T1558', 'T1078', 'T1090'],
        malware_families: ['AnyDesk', 'TeamViewer', 'Cobalt Strike'],
        description: 'Experts in social engineering and bypassing MFA to gain initial access.'
    },
    {
        id: 'lapsus',
        name: 'Lapsus$',
        country: 'Global',
        target_sectors: ['Tech', 'Telecom', 'Government'],
        mitre_techniques: ['T1566', 'T1078', 'T1567', 'T1021'],
        malware_families: ['Data-Exfil-Tools'],
        description: 'Teens-led group known for extortion via Telegram and breaching tech giants.'
    },
    {
        id: 'kimsuky',
        name: 'Kimsuky',
        country: 'North Korea',
        target_sectors: ['Government', 'Nuclear', 'Defense', 'NGO'],
        mitre_techniques: ['T1566', 'T1059', 'T1071', 'T1041'],
        malware_families: ['BabyShark', 'GoldDragon', 'AppCheck'],
        description: 'Focused on espionage against South Korea and international policy organizations.'
    },
    {
        id: 'patchwork',
        name: 'Patchwork',
        country: 'India (Suspected)',
        target_sectors: ['Government', 'Diplomacy', 'Military'],
        mitre_techniques: ['T1566', 'T1204', 'T1059', 'T1105'],
        malware_families: ['BADNEWS', 'NDRAT'],
        description: 'Focuses on regional rivals, often using copy-paste code from public repositories.'
    },
    {
        id: 'sidewinder',
        name: 'SideWinder',
        country: 'India (Suspected)',
        target_sectors: ['Government', 'Military', 'Education'],
        mitre_techniques: ['T1566', 'T1059.003', 'T1071.001'],
        malware_families: ['SideWinder-RAT'],
        description: 'Persistent group known for massive phishing campaigns using document lures.'
    },
    {
        id: 'turla',
        name: 'Turla',
        country: 'Russia',
        target_sectors: ['Government', 'Diplomacy', 'Military'],
        mitre_techniques: ['T1132', 'T1071.001', 'T1547.001'],
        malware_families: ['Agent.BTZ', 'KopiLuwak', 'Crutch'],
        description: 'High-end espionage group active since the 1990s, linked to the FSB.'
    },
    {
        id: 'gamaredon',
        name: 'Gamaredon',
        country: 'Russia',
        target_sectors: ['Ukraine Government', 'Military'],
        mitre_techniques: ['T1566', 'T1059', 'T1105', 'T1071'],
        malware_families: ['Pterodo', 'Pteranodon'],
        description: 'Specifically focuses on Ukrainian targets with high-volume phishing and basic RATs.'
    },
    {
        id: 'sandworm',
        name: 'Sandworm Team',
        country: 'Russia',
        target_sectors: ['Critical Infrastructure', 'Energy', 'Gov'],
        mitre_techniques: ['T1486', 'T1190', 'T1485', 'T1561'],
        malware_families: ['BlackEnergy', 'Industroyer', 'CaddyWiper'],
        description: 'Military intelligence group (GRU) known for destructive attacks on power grids.'
    },
    {
        id: 'charming-kitten',
        name: 'Charming Kitten (APT35)',
        country: 'Iran',
        target_sectors: ['Think Tanks', 'Journalists', 'Government'],
        mitre_techniques: ['T1566', 'T1078', 'T1583', 'T1071'],
        malware_families: ['Pow Iranian', 'ViperRat'],
        description: 'Iranian state group focused on intelligence collection through persona-based phishing.'
    },
    {
        id: 'muddywater',
        name: 'MuddyWater',
        country: 'Iran',
        target_sectors: ['Telecom', 'Oil', 'Government'],
        mitre_techniques: ['T1566', 'T1059', 'T1105', 'T1071'],
        malware_families: ['MuddyRat', 'Ligolo'],
        description: 'Linked to Iran Ministry of Intelligence, known for PowerShell-heavy attacks.'
    },
    {
        id: 'oilrig',
        name: 'OilRig (APT34)',
        country: 'Iran',
        target_sectors: ['Energy', 'Critical Infrastructure', 'Finance'],
        mitre_techniques: ['T1566', 'T1071', 'T1105', 'T1059'],
        malware_families: ['Karkoff', 'RGDoor', 'BondForward'],
        description: 'Iranian group specializing in web shells and DNS tunneling for data exfiltration.'
    },
    {
        id: 'apt33',
        name: 'APT33 (Elfin)',
        country: 'Iran',
        target_sectors: ['Aviation', 'Energy', 'Chemical'],
        mitre_techniques: ['T1566', 'T1190', 'T1059', 'T1105'],
        malware_families: ['Shamoon', 'TurnedUp'],
        description: 'Iranian group focused on aerospace and energy sectors with destructive potential.'
    },
    {
        id: 'apt15',
        name: 'APT15 (Kezhen)',
        country: 'China',
        target_sectors: ['Government', 'Diplomacy', 'Defense'],
        mitre_techniques: ['T1566', 'T1059', 'T1071', 'T1132'],
        malware_families: ['RoyalDNS', 'BS2005'],
        description: 'Chinese espionage group targeting foreign government organizations.'
    },
    {
        id: 'apt10',
        name: 'APT10 (Stone Panda)',
        country: 'China',
        target_sectors: ['MSP', 'Tech', 'Manufacturing'],
        mitre_techniques: ['T1078', 'T1190', 'T1071', 'T1132'],
        malware_families: ['QuasarRAT', 'RedLeaves'],
        description: 'Large-scale operator known for Cloud Hopper campaigns against Managed Service Providers.'
    },
    {
        id: 'threatconnect',
        name: 'ThreatConnect',
        country: 'Global',
        target_sectors: ['Research'],
        mitre_techniques: ['T1566', 'T1059'],
        malware_families: ['Generic'],
        description: 'Aggregated intelligence profiles for multi-actor campaign analysis.'
    },
    {
        id: 'equation-group',
        name: 'Equation Group',
        country: 'US',
        target_sectors: ['Global', 'Military', 'Nuclear', 'Telecom'],
        mitre_techniques: ['T1190', 'T1027', 'T1542', 'T1547'],
        malware_families: ['DoublePulsar', 'EternalBlue', 'Fanny'],
        description: 'Ultra-sophisticated group linked to the NSA, pioneering firmware-level persistence.'
    },
    {
        id: 'darkside',
        name: 'DarkSide',
        country: 'Russia/CIS',
        target_sectors: ['Corporate', 'Industrial'],
        mitre_techniques: ['T1486', 'T1059', 'T1078', 'T1021'],
        malware_families: ['DarkSide'],
        description: 'Responsible for the Colonial Pipeline attack; known for a corporate-style RaaS model.'
    },
    {
        id: 'scattered-spider-2',
        name: 'Scattered Spider (v2)',
        country: 'Global',
        target_sectors: ['Identity Providers', 'SaaS'],
        mitre_techniques: ['T1566', 'T1558', 'T1078', 'T1098'],
        malware_families: ['Oktapus'],
        description: 'Expertise in compromising IdP infrastructure and session hijacking.'
    },
    {
        id: 'fancy-bear',
        name: 'Fancy Bear (APT28 Reloaded)',
        country: 'Russia',
        target_sectors: ['Political Parties', 'Sports'],
        mitre_techniques: ['T1566', 'T1133', 'T1584', 'T1586'],
        malware_families: ['Drovorub'],
        description: 'Known for targeting global democratic processes and international sporting bodies.'
    }
];
