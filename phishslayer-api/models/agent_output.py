# FILE: models/agent_output.py
# Pre-existing agent output models - do not regenerate
# Used for agent execution results

from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class AgentDecision(BaseModel):
    """Decision output from agent execution"""
    action: str
    confidence: float
    reasoning: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class AgentOutput(BaseModel):
    """Output from agent execution"""
    agent_name: str
    execution_time: float
    decision: AgentDecision
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")
