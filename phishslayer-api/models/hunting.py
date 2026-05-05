# FILE: models/hunting.py
# Threat hunting models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class Hypothesis(BaseModel):
    """Threat hunting hypothesis"""
    id: str
    description: str
    attack_chain: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class HypothesisCreate(BaseModel):
    """Create hunting hypothesis"""
    hypothesis_description: str
    attack_chain: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class HuntExecution(BaseModel):
    """Execute hunt"""
    execution_options: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class HuntResults(BaseModel):
    """Hunt execution results"""
    hunt_id: str
    hypothesis_id: str
    findings: List[Dict[str, Any]]
    indicators: Optional[List[str]] = None
    executed_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class HuntQuery(BaseModel):
    """Hunt query"""
    hunt_query: str
    time_range: str
    
    model_config = ConfigDict(extra="ignore")


class HuntHistory(BaseModel):
    """Hunt history entry"""
    id: str
    hypothesis_id: Optional[str] = None
    query: str
    results: Optional[List[Dict[str, Any]]] = None
    executed_at: datetime
    
    model_config = ConfigDict(extra="ignore")
