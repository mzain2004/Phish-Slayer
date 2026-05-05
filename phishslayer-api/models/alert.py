from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class AlertInput(BaseModel):
    model_config = ConfigDict(extra="ignore")
    alert_id: str
    source: Literal["wazuh", "manual", "api"]
    severity: int = Field(ge=1, le=5)
    raw_data: dict
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AgentDecision(BaseModel):
    model_config = ConfigDict(extra="ignore")
    decision: Literal["CLOSE", "ESCALATE", "HUNT", "MANUAL_REVIEW"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str
    actions: list[str] = Field(default_factory=list)
    agent_level: Literal["L1", "L2", "L3"] = "L1"