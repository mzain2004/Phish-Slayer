# FILE: models/alerts.py
# Alert models for alert management routes

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class Alert(BaseModel):
    """Alert object"""
    id: str
    org_id: str
    source: str
    status: str
    severity: str
    rule_level: Optional[int] = None
    cluster_id: Optional[str] = None
    queue_priority: int
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    triage_age_seconds: Optional[int] = None
    
    model_config = ConfigDict(extra="ignore")


class AlertUpdate(BaseModel):
    """Alert update payload"""
    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[str] = None
    acknowledged: Optional[bool] = None
    
    model_config = ConfigDict(extra="ignore")


class AlertAcknowledge(BaseModel):
    """Acknowledge alert"""
    id: str
    acknowledged_by: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class AlertAssign(BaseModel):
    """Assign alert to analyst"""
    analyst_id: str
    
    model_config = ConfigDict(extra="ignore")


class BulkAlertAction(BaseModel):
    """Bulk alert action"""
    alert_ids: List[str]
    action: str  # close, assign, escalate, suppress, mark_fp
    payload: Optional[dict] = None
    
    model_config = ConfigDict(extra="ignore")
