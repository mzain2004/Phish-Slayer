export interface AdversaryProfile {
  id: string;
  name: string;
  description: string;
  techniques: string[];
}

export const adversaries: AdversaryProfile[] = [
  {
    id: "ADV-001",
    name: "Lazarus Group (DPRK)",
    description: "North Korean state-sponsored cyber threat group known for financial theft and espionage.",
    techniques: ["T1566", "T1059", "T1003", "T1105", "T1071", "T1486"]
  },
  {
    id: "ADV-002",
    name: "APT28 (Fancy Bear)",
    description: "Russian state-sponsored group associated with military intelligence (GRU).",
    techniques: ["T1566", "T1078", "T1059", "T1003", "T1083"]
  },
  {
    id: "ADV-003",
    name: "FIN7",
    description: "Financially motivated threat group targeting retail, restaurant, and hospitality sectors.",
    techniques: ["T1566", "T1059", "T1003", "T1021", "T1071"]
  },
  {
    id: "ADV-004",
    name: "LockBit",
    description: "Ransomware-as-a-Service (RaaS) group performing double extortion.",
    techniques: ["T1486", "T1490", "T1021", "T1059", "T1082"]
  },
  {
    id: "ADV-005",
    name: "Phishing Campaigner",
    description: "Generic profile for groups conducting mass phishing and credential harvesting.",
    techniques: ["T1566", "T1566.001", "T1566.002", "T1078"]
  }
];
