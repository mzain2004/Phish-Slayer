# FILE: models/sigma.py
# Sigma rule models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SigmaRule(BaseModel):
    """Sigma rule object"""
    id: str
    title: str
    description: Optional[str] = None
    rule_content: str
    status: str
    created_at: datetime
    updated_at: datetime
    is_deployed: bool
    
    model_config = ConfigDict(extra="ignore")


class SigmaRuleCreate(BaseModel):
    """Create Sigma rule"""
    title: str
    description: Optional[str] = None
    rule_content: str
    
    model_config = ConfigDict(extra="ignore")


class SigmaRuleDeploy(BaseModel):
    """Deploy Sigma rule"""
    deploy_options: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class SigmaDeploymentResult(BaseModel):
    """Sigma deployment result"""
    rule_id: str
    deployed: bool
    deployment_time: Optional[datetime] = None
    error: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")
