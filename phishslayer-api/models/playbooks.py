# FILE: models/playbooks.py
# Automated response playbook models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class Playbook(BaseModel):
    """Automated response playbook"""
    id: str
    name: str
    description: Optional[str] = None
    trigger_conditions: Dict[str, Any]
    steps: List[Dict[str, Any]]
    status: str
    human_approval_required: bool
    organization_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class PlaybookCreate(BaseModel):
    """Create playbook"""
    name: str
    description: Optional[str] = None
    trigger_conditions: Dict[str, Any]
    steps: List[Dict[str, Any]]
    status: Optional[str] = "draft"
    human_approval_required: Optional[bool] = False
    
    model_config = ConfigDict(extra="ignore")


class PlaybookUpdate(BaseModel):
    """Update playbook"""
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_conditions: Optional[Dict[str, Any]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    human_approval_required: Optional[bool] = None
    
    model_config = ConfigDict(extra="ignore")


class PlaybookExecution(BaseModel):
    """Execute playbook"""
    context: Optional[Dict[str, Any]] = None
    simulation: Optional[bool] = False
    
    model_config = ConfigDict(extra="ignore")


class PlaybookRun(BaseModel):
    """Playbook execution run"""
    id: str
    playbook_id: str
    status: str
    run_id: str
    results: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(extra="ignore")


class PlaybookRunApproval(BaseModel):
    """Approve playbook run"""
    approval_data: Dict[str, Any]
    
    model_config = ConfigDict(extra="ignore")


class PlaybookRunRollback(BaseModel):
    """Rollback playbook run"""
    rollback_reason: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")
