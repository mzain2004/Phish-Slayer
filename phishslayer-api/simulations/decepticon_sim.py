
"""
decepticon_sim.py — Red-Blue simulation for PhishSlayer.
RED TEAM (Groq): Generates synthetic attack scenarios.
BLUE TEAM (PhishSlayer): Detects and mitigates.
"""

import os
import json
import uuid
import asyncio
import time
from datetime import datetime
from groq import Groq
from dataclasses import dataclass, asdict
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# load_dotenv from Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env.local")

from harness.execution_loop import ETCSLVOrchestrator, AlertPayload
from harness.lifecycle_hooks import LifecycleHooks
from harness.state_store import StateStore
from harness.context_manager import ContextManager
from harness.verify_interface import VerifyInterface

@dataclass
class SimRound:
    scenario_name: str
    red_alert: dict
    blue_result: dict
    winner: str # "red" | "blue" | "tie"
    time_ms: float

@dataclass
class SimReport:
    run_id: str
    timestamp: str
    rounds: List[SimRound]
    score: Dict[str, int]
    weakest_scenario: str
    recommendation: str

class DecepticonSimulation:
    MODEL = "llama-3.3-70b-versatile"

    def __init__(self):
        self.hooks = LifecycleHooks()
        self.state = StateStore(os.getenv("MONGODB_URI", "mongodb://localhost:27017/phishslayer"))
        self.ctx = ContextManager()
        self.verify = VerifyInterface()

    async def run(self, rounds: int = 5) -> dict:
        rounds = min(max(1, rounds), 10)
        run_id = str(uuid.uuid4())
        
        # Generate scenarios
        scenarios = self._generate_scenarios(rounds)
        
        sim_rounds = []
        scores = {"red": 0, "blue": 0, "tie": 0}
        
        for scenario in scenarios:
            start_time = time.time()
            
            orchestrator = ETCSLVOrchestrator(self.ctx, self.state, self.hooks)
            payload = AlertPayload(
                alert_id=str(uuid.uuid4()),
                org_id="sim-org-001",
                raw_alert=scenario["alert"]
            )
            
            # BLUE TEAM ACTS
            try:
                blue_exec = await orchestrator.run(payload)
                blue_dict = asdict(blue_exec)
            except Exception as e:
                blue_dict = {"error": str(e)}
            
            # SCORING
            winner = self._score_round(scenario, blue_dict)
            scores[winner] += 1
            
            end_time = time.time()
            sim_rounds.append(SimRound(
                scenario_name=scenario["name"],
                red_alert=scenario["alert"],
                blue_result=blue_dict,
                winner=winner,
                time_ms=(end_time - start_time) * 1000
            ))

        # Generate recommendation
        recommendation = self._generate_recommendation(sim_rounds)
        
        # Find weakest scenario
        weakest = "none"
        if sim_rounds:
            # Sort by blue confidence in triage
            try:
                sorted_rounds = sorted(
                    sim_rounds, 
                    key=lambda x: x.blue_result.get("triage_result", {}).get("confidence", 1.0) 
                    if isinstance(x.blue_result, dict) else 1.0
                )
                weakest = sorted_rounds[0].scenario_name
            except Exception:
                weakest = sim_rounds[0].scenario_name

        report = SimReport(
            run_id=run_id,
            timestamp=datetime.utcnow().isoformat(),
            rounds=sim_rounds,
            score=scores,
            weakest_scenario=weakest,
            recommendation=recommendation
        )
        
        # Save report
        report_dict = asdict(report)
        report_path = Path(__file__).resolve().parent / "sim_report.json"
        with open(report_path, "w") as f:
            json.dump(report_dict, f, indent=2)
            
        return report_dict

    def _generate_scenarios(self, count: int) -> List[dict]:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"""You are a Red Team operator (Decepticon).
Generate {count} unique synthetic security attack scenarios for a SOC simulation.
Scenarios must include a mix of: phishing, lateral movement, C2 beacon, data exfil, credential stuffing.

Each scenario must be a realistic Wazuh-style alert JSON.
Try to craft alerts that might evade simple L1 detection by using low-confidence tricks or subtle indicators.

Return ONLY valid JSON with a key "scenarios" containing a list of objects:
{{
  "scenarios": [
    {{
      "name": "<scenario_name>",
      "attack_type": "<type>",
      "expected_mitre": ["T1234"],
      "alert": {{
        "rule": {{"description": "...", "id": "...", "level": 10}},
        "agent": {{"name": "...", "ip": "..."}},
        "data": {{"srcip": "...", "dstport": "...", "user": "..."}}
      }}
    }}
  ]
}}"""

        response = client.chat.completions.create(
            model=self.MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        if isinstance(data, dict) and "scenarios" in data:
            return data["scenarios"]
        return []

    def _score_round(self, scenario: dict, blue_result: dict) -> str:
        if "error" in blue_result:
            return "red"

        triage = blue_result.get("triage_result", {})
        confidence = triage.get("confidence", 0.0)
        escalated = triage.get("escalate_to_l2", False)
        
        # Red win: L1 confidence < 0.5 AND no escalation
        if confidence < 0.5 and not escalated:
            return "red"
            
        # Blue win: threat detected + correct MITRE tag + escalation triggered
        mitre_detected = triage.get("mitre_techniques", [])
        expected_mitre = scenario.get("expected_mitre", [])
        correct_mitre = any(m in mitre_detected for m in expected_mitre)
        
        if triage.get("is_real_threat") and correct_mitre and escalated:
            return "blue"
            
        return "tie"

    def _generate_recommendation(self, rounds: List[SimRound]) -> str:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return "Configure GROQ_API_KEY for technical recommendations."

        client = Groq(api_key=api_key)
        summary = []
        for r in rounds:
            summary.append({
                "scenario": r.scenario_name,
                "winner": r.winner,
                "blue_confidence": r.blue_result.get("triage_result", {}).get("confidence")
            })
            
        prompt = f"""Based on these SOC simulation results, provide ONE sentence of technical hardening advice for the SOC team.
        
Results:
{json.dumps(summary, indent=2)}"""

        try:
            response = client.chat.completions.create(
                model=self.MODEL,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return "Harden detection rules for low-confidence indicators."
