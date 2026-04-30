/**
 * Platform Default Playbooks for PhishSlayer
 */

export const DEFAULT_PLAYBOOKS = [
    {
        name: "Phishing Response",
        description: "Standard workflow for detected phishing emails or malicious links.",
        trigger_conditions: { severity_min: "medium", event_types: ["phishing"] },
        steps: [
            { id: "s1", type: "quarantine_email", config: {}, on_failure: "continue" },
            { id: "s2", type: "block_ip", config: {}, on_failure: "stop" },
            { id: "s3", type: "notify", config: { channel: "slack", message: "Phishing containment active" }, on_failure: "continue" }
        ],
        human_approval_required: false
    },
    {
        name: "Ransomware Containment",
        description: "Aggressive isolation for suspected ransomware activity.",
        trigger_conditions: { severity_min: "high", mitre_techniques: ["T1486"] },
        steps: [
            { id: "s1", type: "human_approval", config: { message: "Approve host isolation?" }, on_failure: "stop" },
            { id: "s2", type: "isolate_host", config: {}, on_failure: "rollback" },
            { id: "s3", type: "notify", config: { channel: "discord", message: "URGENT: Ransomware isolation executed" }, on_failure: "continue" }
        ],
        human_approval_required: true
    },
    {
        name: "Credential Compromise",
        description: "Response for leaked or abused user credentials.",
        trigger_conditions: { severity_min: "high", event_types: ["credential_leak"] },
        steps: [
            { id: "s1", type: "disable_account", config: {}, on_failure: "stop" },
            { id: "s2", type: "run_hunt", config: { query: "logins from user" }, on_failure: "continue" },
            { id: "s3", type: "notify", config: { message: "Account disabled due to compromise" }, on_failure: "continue" }
        ],
        human_approval_required: false
    }
];
