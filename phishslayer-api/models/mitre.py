# FILE: models/mitre.py
# MITRE ATT&CK framework models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MITRETechnique(BaseModel):
    """MITRE ATT&CK technique"""
    id: str
    technique_id: str
    tactic: str
    name: str
    description: Optional[str] = None
    detection_rate: Optional[float] = None
    
    model_config = ConfigDict(extra="ignore")


class MITRETag(BaseModel):
    """Tag alert with MITRE technique"""
    alert_ids: List[str]
    technique_ids: List[str]
    
    model_config = ConfigDict(extra="ignore")


class MITRESim(BaseModel):
    """MITRE attack chain simulation"""
    attack_chain: List[str]
    
    model_config = ConfigDict(extra="ignore")


class MITRESimResult(BaseModel):
    """Simulation result"""
    chain: List[str]
    coverage: float
    detectable_techniques: List[str]
    gaps: List[str]
    
    model_config = ConfigDict(extra="ignore")


class MITRECoverage(BaseModel):
    """MITRE coverage metrics"""
    total_techniques: int
    detected_techniques: int
    coverage_percentage: float
    by_tactic: Dict[str, float]
    
    model_config = ConfigDict(extra="ignore")


class MITREHeatmap(BaseModel):
    """MITRE heatmap data"""
    tactics: Dict[str, List[Dict[str, Any]]]
    
    model_config = ConfigDict(extra="ignore")


class MITREGaps(BaseModel):
    """Detection gaps in MITRE coverage"""
    uncovered_tactics: List[str]
    uncovered_techniques: List[str]
    recommendations: Optional[List[str]] = None
    
    model_config = ConfigDict(extra="ignore")
