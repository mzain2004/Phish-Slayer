
import agentops
import os
import uuid
import logging
from datetime import datetime
from typing import Optional

class VerifyInterface:
    """
    V in ETCSLV. Wraps AgentOps session lifecycle.
    Migrated to AgentOps v4 trace-based API.
    """

    def __init__(self):
        self._traces = {}

    def start_session(self, alert_id: str, name: str = "agent_action") -> str:
        """Start AgentOps trace for one action. Returns trace_id."""
        try:
            import agentops
            trace = agentops.start_trace(name=name)
            trace_id = str(uuid.uuid4())
            self._traces[trace_id] = trace
            return trace_id
        except Exception as e:
            logging.warning(f"AgentOps start_trace failed: {e}")
            return str(uuid.uuid4())

    def end_session(self, trace_id: str, outcome: str) -> None:
        """End trace. outcome = 'Success' | 'Fail' | 'Indeterminate'."""
        try:
            import agentops
            trace = self._traces.pop(trace_id, None)
            if trace:
                state = "Success"
                if outcome.lower() in ["failed", "fail", "error"]:
                    state = "Fail"
                agentops.end_trace(trace, end_state=state)
        except Exception as e:
            logging.warning(f"AgentOps end_trace failed: {e}")

    def log_agent_action(self, trace_id: str, agent: str, action: dict) -> None:
        """Log single agent action within session."""
        try:
            import logging
            logging.info(f"Agent action logged: {agent} -> {action}")
            # agentops.record() is deprecated/removed in v4
        except Exception as e:
            logging.warning(f"Logging action failed: {e}")
