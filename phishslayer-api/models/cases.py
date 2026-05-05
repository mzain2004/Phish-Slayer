# FILE: models/cases.py
# Case models for case management

from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class Case(BaseModel):
    """Case object"""
    id: str
    organization_id: str
    title: str
    status: str  # OPEN, IN_PROGRESS, CONTAINED, REMEDIATED, CLOSED, ARCHIVED
    severity: str  # p1, p2, p3, p4
    alert_type: Optional[str] = None
    source_ip: Optional[str] = None
    affected_asset: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    created_at: datetime
    closed_at: Optional[datetime] = None
    
    model_config = ConfigDict(extra="ignore")


class CaseCreate(BaseModel):
    """Create case"""
    title: str
    organization_id: str
    severity: Optional[str] = "p3"
    status: Optional[str] = "OPEN"
    alert_type: Optional[str] = None
    source_ip: Optional[str] = None
    affected_asset: Optional[str] = None
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    sla_deadline: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class CaseUpdate(BaseModel):
    """Update case"""
    title: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    affected_asset: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class Evidence(BaseModel):
    """Evidence object"""
    id: str
    case_id: str
    evidence_type: str
    file_url: Optional[str] = None
    text_content: Optional[str] = None
    collected_by: str
    hash_sha256: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class EvidenceCreate(BaseModel):
    """Create evidence"""
    evidence_type: str
    file_url: Optional[str] = None
    text_content: Optional[str] = None
    collected_by: str
    hash_sha256: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class TimelineEntry(BaseModel):
    """Case timeline entry"""
    id: str
    case_id: str
    event_type: str
    actor: str
    description: str
    created_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class TimelineCreate(BaseModel):
    """Create timeline entry"""
    event_type: str
    actor: str
    description: str
    
    model_config = ConfigDict(extra="ignore")
