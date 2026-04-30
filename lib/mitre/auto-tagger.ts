import { MITRETechnique, getTechniqueById } from "./attack-data";

const RULE_MAPPINGS: Record<string, string[]> = {
  // Credential Access & Brute Force
  "Brute Force": ["T1110"],
  "Failed Login": ["T1110"],
  "Multiple authentication failures": ["T1110"],
  "Mimikatz": ["T1003"],
  "Credential Dump": ["T1003"],
  "LSASS": ["T1003.001"],
  "Kerberoasting": ["T1558.003"],

  // Execution
  "PowerShell Execution": ["T1059.001"],
  "PowerShell Script": ["T1059.001"],
  "WMI": ["T1047"],
  "Scheduled Task": ["T1053.005"],
  "PsExec": ["T1021.002", "T1569.002"],
  "Command Shell": ["T1059.003"],
  "Suspicious Process": ["T1059"],

  // Initial Access
  "Phishing": ["T1566"],
  "Suspicious Email": ["T1566"],
  "Spearphishing": ["T1566.001"],
  "Exploit Public-Facing Application": ["T1190"],

  // Lateral Movement
  "Lateral Movement": ["T1021"],
  "Remote Desktop": ["T1021.001"],
  "SMB/Windows Admin Shares": ["T1021.002"],

  // Command and Control
  "DNS Tunneling": ["T1071.004"],
  "C2 Traffic": ["T1071"],
  "Beaconing": ["T1071"],
  
  // Impact
  "Ransomware": ["T1486"],
  "Volume Shadow Copy deletion": ["T1490"],
  "Inhibit System Recovery": ["T1490"],
  "Data Destruction": ["T1485"],

  // Defense Evasion
  "Log Deletion": ["T1070.001"],
  "Clear Event Logs": ["T1070.001"],
  "Antivirus Disabled": ["T1562.001"]
};

export function ruleBasedTag(alert: { rule_name?: string; event_category?: string; process_name?: string }): MITRETechnique[] {
  const matchedIds = new Set<string>();

  const inputs = [
    alert.rule_name || "",
    alert.event_category || "",
    alert.process_name || ""
  ].map(s => s.toLowerCase());

  // Check mappings
  for (const [keyword, ids] of Object.entries(RULE_MAPPINGS)) {
    const kwLower = keyword.toLowerCase();
    if (inputs.some(input => input.includes(kwLower))) {
      ids.forEach(id => matchedIds.add(id));
    }
  }

  // Map IDs to actual technique objects
  const results: MITRETechnique[] = [];
  matchedIds.forEach(id => {
    const t = getTechniqueById(id);
    if (t) results.push(t);
  });

  return results;
}
