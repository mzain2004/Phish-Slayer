
"""
context_manager.py — C in ETCSLV.
Builds structured context per agent call.
CRITICAL RULE: agents receive findings JSON only — never full conversation history.
Red hat + blue hat prompts injected here. MITRE ATT&CK playbooks loaded here.
Phase 2: skeleton. Phase 3 implements prompt injection.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class AgentContext:
    """Structured context passed to one agent invocation."""
    agent_role: str          # "l1_triage" | "l2_investigator" | "l3_hunter"
    org_id: str
    alert_id: str
    findings_so_far: dict    # structured JSON from previous agent, never raw history
    red_hat_prompt: str      # attacker perspective prompt
    blue_hat_prompt: str     # defender perspective prompt
    mitre_techniques: list[str]
    system_prompt: str


class ContextManager:
    """
    C in ETCSLV. Assembles AgentContext per agent invocation.
    Never passes raw alert or conversation history between agents.
    Decepticon pattern: clean context window per objective.
    """

    def build_l1_context(self, org_id: str, alert: dict) -> AgentContext:
        """Build context for L1 triage. Phase 3 implements."""
        pass

    def build_l2_context(self, org_id: str, l1_findings: dict) -> AgentContext:
        """Build context for L2. Receives L1 findings JSON only. Phase 4 implements."""
        pass

    def build_l3_context(self, org_id: str, l2_findings: dict) -> AgentContext:
        """Build context for L3 hunter. Phase 5 implements."""
        pass

    def _inject_mitre_playbook(self, techniques: list[str]) -> str:
        """Load MITRE ATT&CK playbook for detected techniques. Phase 3 implements."""
        pass
