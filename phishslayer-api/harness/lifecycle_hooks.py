
"""
lifecycle_hooks.py — L in ETCSLV.
Consequence gates. All actions pass through here before execution.
block_ip always requires human approval — enforced at this layer.
3 gates: confidence, reversibility, scope.
Phase 2: skeleton. Phase 4 implements gate logic.
"""

from dataclasses import dataclass
from typing import Optional
from enum import Enum


class GateDecision(Enum):
    PROCEED = "proceed"
    BLOCK = "block"
    REQUIRE_HUMAN = "require_human"
    DRY_RUN = "dry_run"


@dataclass
class ConsequenceReport:
    """Output of consequence gate evaluation."""
    action: str
    gate_decision: GateDecision
    confidence_score: float
    is_reversible: bool
    blast_radius: str        # "low"|"medium"|"high"
    scope_ok: bool
    reason: str
    requires_human: bool


ALWAYS_REQUIRE_HUMAN = {
    "block_ip",
    "isolate_host",
    "delete_rule",
    "disable_account",
}


class LifecycleHooks:
    """
    L in ETCSLV. Consequence gates before any action executes.
    Gate 1: confidence < 0.7 → BLOCK, escalate.
    Gate 2: irreversible action → DRY_RUN, require human approval.
    Gate 3: blast radius > scope → HARD STOP.
    Actions in ALWAYS_REQUIRE_HUMAN → REQUIRE_HUMAN unconditionally.
    """

    IRREVERSIBLE_ACTIONS = {"block_ip","isolate_host","delete_rule","disable_account","quarantine_file"}

    def evaluate(self, action: str, confidence: float, context: dict) -> ConsequenceReport:
        # Gate 0: always-require-human set
        if action in ALWAYS_REQUIRE_HUMAN:
            return ConsequenceReport(
                action=action,
                gate_decision=GateDecision.REQUIRE_HUMAN,
                confidence_score=confidence,
                is_reversible=False,
                blast_radius="high",
                scope_ok=True,
                reason=f"{action} always requires human approval",
                requires_human=True,
            )
        g1 = self._gate1_confidence(confidence)
        if g1 == GateDecision.BLOCK:
            return ConsequenceReport(
                action=action, gate_decision=GateDecision.BLOCK,
                confidence_score=confidence, is_reversible=True,
                blast_radius="low", scope_ok=True,
                reason=f"Confidence {confidence:.2f} below 0.70 threshold",
                requires_human=False,
            )
        reversible = self._is_reversible(action)
        g2 = self._gate2_reversibility(action)
        blast = context.get("blast_radius", "low")
        g3 = self._gate3_scope(blast, context.get("org_scope", {}))
        if g3 == GateDecision.BLOCK:
            return ConsequenceReport(
                action=action, gate_decision=GateDecision.BLOCK,
                confidence_score=confidence, is_reversible=reversible,
                blast_radius=blast, scope_ok=False,
                reason="Blast radius exceeds org scope",
                requires_human=True,
            )
        decision = g2 if g2 == GateDecision.REQUIRE_HUMAN else GateDecision.PROCEED
        return ConsequenceReport(
            action=action, gate_decision=decision,
            confidence_score=confidence, is_reversible=reversible,
            blast_radius=blast, scope_ok=True,
            reason="All gates passed" if decision == GateDecision.PROCEED else "Irreversible — human required",
            requires_human=(decision == GateDecision.REQUIRE_HUMAN),
        )

    def _gate1_confidence(self, confidence: float) -> GateDecision:
        return GateDecision.BLOCK if confidence < 0.70 else GateDecision.PROCEED

    def _gate2_reversibility(self, action: str) -> GateDecision:
        return GateDecision.REQUIRE_HUMAN if action in self.IRREVERSIBLE_ACTIONS else GateDecision.PROCEED

    def _is_reversible(self, action: str) -> bool:
        return action not in self.IRREVERSIBLE_ACTIONS

    def _gate3_scope(self, blast_radius: str, org_scope: dict) -> GateDecision:
        max_allowed = org_scope.get("max_blast_radius", "medium")
        order = {"low": 0, "medium": 1, "high": 2}
        if order.get(blast_radius, 0) > order.get(max_allowed, 1):
            return GateDecision.BLOCK
        return GateDecision.PROCEED
