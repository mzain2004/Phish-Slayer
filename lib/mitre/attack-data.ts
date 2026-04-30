export interface MITRETactic {
  id: string;
  name: string;
  order: number;
}

export interface MITRETechnique {
  id: string;
  name: string;
  tactic_id: string;
  subtechniques: { id: string; name: string }[];
  detection_difficulty: 'easy' | 'moderate' | 'hard';
}

export const tactics: MITRETactic[] = [
  { id: "TA0043", name: "Reconnaissance", order: 1 },
  { id: "TA0042", name: "Resource Development", order: 2 },
  { id: "TA0001", name: "Initial Access", order: 3 },
  { id: "TA0002", name: "Execution", order: 4 },
  { id: "TA0003", name: "Persistence", order: 5 },
  { id: "TA0004", name: "Privilege Escalation", order: 6 },
  { id: "TA0005", name: "Defense Evasion", order: 7 },
  { id: "TA0006", name: "Credential Access", order: 8 },
  { id: "TA0007", name: "Discovery", order: 9 },
  { id: "TA0008", name: "Lateral Movement", order: 10 },
  { id: "TA0009", name: "Collection", order: 11 },
  { id: "TA0011", name: "Command and Control", order: 12 },
  { id: "TA0010", name: "Exfiltration", order: 13 },
  { id: "TA0040", name: "Impact", order: 14 }
];

export const techniques: MITRETechnique[] = [
  // Reconnaissance
  { id: "T1595", name: "Active Scanning", tactic_id: "TA0043", subtechniques: [{ id: "T1595.001", name: "Scanning IP Blocks" }, { id: "T1595.002", name: "Vulnerability Scanning" }], detection_difficulty: "easy" },
  { id: "T1590", name: "Gather Victim Network Information", tactic_id: "TA0043", subtechniques: [{ id: "T1590.001", name: "Domain Properties" }, { id: "T1590.002", name: "DNS" }], detection_difficulty: "hard" },
  
  // Resource Development
  { id: "T1583", name: "Acquire Infrastructure", tactic_id: "TA0042", subtechniques: [{ id: "T1583.001", name: "Domains" }], detection_difficulty: "hard" },
  { id: "T1588", name: "Obtain Capabilities", tactic_id: "TA0042", subtechniques: [{ id: "T1588.001", name: "Malware" }, { id: "T1588.002", name: "Tool" }], detection_difficulty: "moderate" },

  // Initial Access
  { id: "T1566", name: "Phishing", tactic_id: "TA0001", subtechniques: [{ id: "T1566.001", name: "Spearphishing Attachment" }, { id: "T1566.002", name: "Spearphishing Link" }], detection_difficulty: "moderate" },
  { id: "T1190", name: "Exploit Public-Facing Application", tactic_id: "TA0001", subtechniques: [], detection_difficulty: "easy" },
  { id: "T1078", name: "Valid Accounts", tactic_id: "TA0001", subtechniques: [{ id: "T1078.001", name: "Default Accounts" }, { id: "T1078.002", name: "Domain Accounts" }], detection_difficulty: "hard" },
  { id: "T1133", name: "External Remote Services", tactic_id: "TA0001", subtechniques: [], detection_difficulty: "moderate" },
  
  // Execution
  { id: "T1059", name: "Command and Scripting Interpreter", tactic_id: "TA0002", subtechniques: [{ id: "T1059.001", name: "PowerShell" }, { id: "T1059.003", name: "Windows Command Shell" }], detection_difficulty: "easy" },
  { id: "T1047", name: "Windows Management Instrumentation", tactic_id: "TA0002", subtechniques: [], detection_difficulty: "moderate" },
  { id: "T1053", name: "Scheduled Task/Job", tactic_id: "TA0002", subtechniques: [{ id: "T1053.005", name: "Scheduled Task" }], detection_difficulty: "moderate" },
  { id: "T1204", name: "User Execution", tactic_id: "TA0002", subtechniques: [{ id: "T1204.001", name: "Malicious Link" }, { id: "T1204.002", name: "Malicious File" }], detection_difficulty: "hard" },
  
  // Persistence
  { id: "T1543", name: "Create or Modify System Process", tactic_id: "TA0003", subtechniques: [{ id: "T1543.003", name: "Windows Service" }], detection_difficulty: "moderate" },
  { id: "T1547", name: "Boot or Logon Autostart Execution", tactic_id: "TA0003", subtechniques: [{ id: "T1547.001", name: "Registry Run Keys / Startup Folder" }], detection_difficulty: "easy" },
  { id: "T1136", name: "Create Account", tactic_id: "TA0003", subtechniques: [{ id: "T1136.001", name: "Local Account" }, { id: "T1136.002", name: "Domain Account" }], detection_difficulty: "easy" },
  
  // Privilege Escalation
  { id: "T1548", name: "Abuse Elevation Control Mechanism", tactic_id: "TA0004", subtechniques: [{ id: "T1548.002", name: "Bypass User Account Control" }], detection_difficulty: "moderate" },
  { id: "T1134", name: "Access Token Manipulation", tactic_id: "TA0004", subtechniques: [{ id: "T1134.001", name: "Token Impersonation/Theft" }], detection_difficulty: "hard" },
  { id: "T1068", name: "Exploitation for Privilege Escalation", tactic_id: "TA0004", subtechniques: [], detection_difficulty: "moderate" },

  // Defense Evasion
  { id: "T1562", name: "Impair Defenses", tactic_id: "TA0005", subtechniques: [{ id: "T1562.001", name: "Disable or Modify Tools" }, { id: "T1562.002", name: "Disable Windows Event Logging" }], detection_difficulty: "moderate" },
  { id: "T1070", name: "Indicator Removal on Host", tactic_id: "TA0005", subtechniques: [{ id: "T1070.001", name: "Clear Windows Event Logs" }], detection_difficulty: "easy" },
  { id: "T1027", name: "Obfuscated Files or Information", tactic_id: "TA0005", subtechniques: [{ id: "T1027.002", name: "Software Packing" }], detection_difficulty: "hard" },
  { id: "T1036", name: "Obfuscated Files or Information (Legacy)", tactic_id: "TA0005", subtechniques: [], detection_difficulty: "hard" },
  { id: "T1218", name: "System Binary Proxy Execution", tactic_id: "TA0005", subtechniques: [{ id: "T1218.011", name: "Rundll32" }, { id: "T1218.010", name: "Regsvr32" }], detection_difficulty: "moderate" },

  // Credential Access
  { id: "T1003", name: "OS Credential Dumping", tactic_id: "TA0006", subtechniques: [{ id: "T1003.001", name: "LSASS Memory" }, { id: "T1003.002", name: "Security Account Manager" }], detection_difficulty: "moderate" },
  { id: "T1110", name: "Brute Force", tactic_id: "TA0006", subtechniques: [{ id: "T1110.001", name: "Password Guessing" }, { id: "T1110.003", name: "Password Spraying" }, { id: "T1110.004", name: "Credential Stuffing" }], detection_difficulty: "easy" },
  { id: "T1552", name: "Unsecured Credentials", tactic_id: "TA0006", subtechniques: [{ id: "T1552.001", name: "Credentials In Files" }, { id: "T1552.004", name: "Private Keys" }], detection_difficulty: "hard" },
  { id: "T1056", name: "Input Capture", tactic_id: "TA0006", subtechniques: [{ id: "T1056.001", name: "Keylogging" }], detection_difficulty: "moderate" },

  // Discovery
  { id: "T1082", name: "System Information Discovery", tactic_id: "TA0007", subtechniques: [], detection_difficulty: "hard" },
  { id: "T1083", name: "File and Directory Discovery", tactic_id: "TA0007", subtechniques: [], detection_difficulty: "hard" },
  { id: "T1049", name: "System Network Connections Discovery", tactic_id: "TA0007", subtechniques: [], detection_difficulty: "hard" },
  { id: "T1016", name: "System Network Configuration Discovery", tactic_id: "TA0007", subtechniques: [], detection_difficulty: "hard" },
  { id: "T1087", name: "Account Discovery", tactic_id: "TA0007", subtechniques: [{ id: "T1087.001", name: "Local Account" }, { id: "T1087.002", name: "Domain Account" }], detection_difficulty: "moderate" },

  // Lateral Movement
  { id: "T1021", name: "Remote Services", tactic_id: "TA0008", subtechniques: [{ id: "T1021.001", name: "Remote Desktop Protocol" }, { id: "T1021.002", name: "SMB/Windows Admin Shares" }], detection_difficulty: "moderate" },
  { id: "T1570", name: "Lateral Tool Transfer", tactic_id: "TA0008", subtechniques: [], detection_difficulty: "moderate" },
  { id: "T1563", name: "Remote Service Session Hijacking", tactic_id: "TA0008", subtechniques: [{ id: "T1563.001", name: "SSH Hijacking" }, { id: "T1563.002", name: "RDP Hijacking" }], detection_difficulty: "hard" },
  
  // Collection
  { id: "T1560", name: "Archive Collected Data", tactic_id: "TA0009", subtechniques: [{ id: "T1560.001", name: "Archive via Utility" }], detection_difficulty: "moderate" },
  { id: "T1114", name: "Email Collection", tactic_id: "TA0009", subtechniques: [{ id: "T1114.001", name: "Local Email Collection" }, { id: "T1114.002", name: "Remote Email Collection" }], detection_difficulty: "hard" },
  { id: "T1119", name: "Automated Collection", tactic_id: "TA0009", subtechniques: [], detection_difficulty: "hard" },

  // Command and Control
  { id: "T1071", name: "Application Layer Protocol", tactic_id: "TA0011", subtechniques: [{ id: "T1071.001", name: "Web Protocols" }, { id: "T1071.004", name: "DNS" }], detection_difficulty: "moderate" },
  { id: "T1090", name: "Proxy", tactic_id: "TA0011", subtechniques: [{ id: "T1090.003", name: "Multi-hop Proxy" }], detection_difficulty: "hard" },
  { id: "T1105", name: "Ingress Tool Transfer", tactic_id: "TA0011", subtechniques: [], detection_difficulty: "easy" },
  { id: "T1573", name: "Encrypted Channel", tactic_id: "TA0011", subtechniques: [{ id: "T1573.001", name: "Symmetric Cryptography" }, { id: "T1573.002", name: "Asymmetric Cryptography" }], detection_difficulty: "hard" },

  // Exfiltration
  { id: "T1041", name: "Exfiltration Over C2 Channel", tactic_id: "TA0010", subtechniques: [], detection_difficulty: "moderate" },
  { id: "T1048", name: "Exfiltration Over Alternative Protocol", tactic_id: "TA0010", subtechniques: [{ id: "T1048.003", name: "Exfiltration Over Unencrypted/Obfuscated Non-C2 Protocol" }], detection_difficulty: "moderate" },
  { id: "T1567", name: "Exfiltration Over Web Service", tactic_id: "TA0010", subtechniques: [{ id: "T1567.002", name: "Exfiltration to Cloud Storage" }], detection_difficulty: "moderate" },

  // Impact
  { id: "T1486", name: "Data Encrypted for Impact", tactic_id: "TA0040", subtechniques: [], detection_difficulty: "easy" },
  { id: "T1490", name: "Inhibit System Recovery", tactic_id: "TA0040", subtechniques: [], detection_difficulty: "easy" },
  { id: "T1485", name: "Data Destruction", tactic_id: "TA0040", subtechniques: [], detection_difficulty: "easy" },
  { id: "T1489", name: "Service Stop", tactic_id: "TA0040", subtechniques: [], detection_difficulty: "moderate" },
  { id: "T1491", name: "Defacement", tactic_id: "TA0040", subtechniques: [{ id: "T1491.001", name: "Internal Defacement" }], detection_difficulty: "moderate" }
];

export function getTechniqueById(id: string): MITRETechnique | undefined {
  return techniques.find(t => t.id === id || t.subtechniques.some(st => st.id === id));
}

export function getByTactic(tacticId: string): MITRETechnique[] {
  return techniques.filter(t => t.tactic_id === tacticId);
}
