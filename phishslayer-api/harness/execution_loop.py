
"""
execution_loop.py — E in ETCSLV.
Plain async Python orchestration. Orchestrates L1→L2→L3 per alert.
"""

from dataclasses import dataclass, asdict
from typing import Optional
from harness.context_manager import ContextManager
from harness.state_store import StateStore
from harness.lifecycle_hooks import LifecycleHooks
from harness.verify_interface import VerifyInterface
from agents.l1_triage import L1TriageAgent, TriageResult
from agents.l2_investigator import L2InvestigatorAgent, InvestigationResult
from agents.l3_hunter import L3HunterAgent, HuntResult


@dataclass
class AlertPayload:
    """Incoming Wazuh alert — structured input to execution loop."""
    alert_id: str
    org_id: str
    raw_alert: dict
    source_ip: Optional[str] = None
    severity: Optional[str] = None


@dataclass
class ExecutionResult:
    """Final output of full L1→L2→L3 chain for one alert."""
    alert_id: str
    org_id: str
    triage_result: Optional[dict] = None
    investigation_result: Optional[dict] = None
    hunt_result: Optional[dict] = None
    final_verdict: Optional[str] = None
    requires_human_approval: bool = False
    escalation_reason: Optional[str] = None


class ETCSLVOrchestrator:
    """
    E in ETCSLV. Orchestrates L1→L2→L3 agents.
    One ETCSLVOrchestrator instance per alert — never shared across alerts.
    Clean context: agents receive findings JSON only, never full history.
    """

    def __init__(
        self,
        context_manager: ContextManager,
        state_store: StateStore,
        lifecycle_hooks: LifecycleHooks,
    ):
        self.ctx = context_manager
        self.state = state_store
        self.hooks = lifecycle_hooks
        self.verify = VerifyInterface()

    async def run(self, payload: AlertPayload) -> ExecutionResult:
        """
        Main entry point. Runs full agent chain for one alert.
        """
        # L1 Triage
        l1_findings = await self._run_l1(payload)
        
        result = ExecutionResult(
            alert_id=payload.alert_id,
            org_id=payload.org_id,
            triage_result=l1_findings,
            final_verdict=l1_findings.get("verdict"),
            requires_human_approval=l1_findings.get("requires_human_approval", False),
            escalation_reason=l1_findings.get("escalation_reason")
        )

        if not l1_findings.get("escalate_to_l2"):
            return result

        # L2 Investigator
        l2_findings = await self._run_l2(l1_findings, payload)
        result.investigation_result = l2_findings
        result.final_verdict = l2_findings.get("verdict")
        result.requires_human_approval = l2_findings.get("requires_human_approval", False)

        if not l2_findings.get("escalate_to_l3"):
            return result

        # L3 Hunter
        l3_findings = await self._run_l3(l2_findings, payload)
        result.hunt_result = l3_findings
        result.final_verdict = l3_findings.get("final_verdict")
        result.requires_human_approval = l3_findings.get("requires_human_approval", False)

        return result

    async def _run_l1(self, payload: AlertPayload) -> dict:
        """
        L1 triage agent. Red hat → blue hat → consequence gate.
        Returns structured findings JSON.
        """
        agent = L1TriageAgent(lifecycle_hooks=self.hooks, verify=self.verify, state_store=self.state)
        result = await agent.triage(
            alert_id=payload.alert_id,
            org_id=payload.org_id,
            raw_alert=payload.raw_alert
        )
        return asdict(result)

    async def _run_l2(self, l1_findings: dict, payload: AlertPayload) -> dict:
        l1_result = TriageResult(**l1_findings)
        agent = L2InvestigatorAgent(
            lifecycle_hooks=self.hooks,
            verify=self.verify,
            state_store=self.state
        )
        org_scope = {"max_blast_radius": "medium"}
        result = await agent.investigate(l1_result, org_scope)
        return asdict(result)

    async def _run_l3(self, l2_findings: dict, payload: AlertPayload) -> dict:
        agent = L3HunterAgent(verify=self.verify, state_store=self.state)
        result = await agent.hunt(l2_result=l2_findings, org_id=payload.org_id)
        return asdict(result)
