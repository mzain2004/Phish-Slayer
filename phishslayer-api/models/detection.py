# FILE: models/detection.py
# Detection rule models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DetectionRule(BaseModel):
    """Detection rule object"""
    id: str
    name: str
    rule_type: str  # sigma, yara, custom
    rule_content: str
    organization_id: str
    severity: Optional[str] = None
    mitre_technique: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    model_config = ConfigDict(extra="ignore")


class DetectionRuleCreate(BaseModel):
    """Create detection rule"""
    name: str
    rule_type: str
    rule_content: str
    organization_id: str
    severity: Optional[str] = None
    mitre_technique: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class DetectionRuleUpdate(BaseModel):
    """Update detection rule"""
    name: Optional[str] = None
    rule_content: Optional[str] = None
    severity: Optional[str] = None
    mitre_technique: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(extra="ignore")


class RuleValidation(BaseModel):
    """Validate rule content"""
    rule_content: str
    rule_type: str  # sigma, yara, custom
    
    model_config = ConfigDict(extra="ignore")


class RuleTest(BaseModel):
    """Test detection rule"""
    test_data: Dict[str, Any]
    
    model_config = ConfigDict(extra="ignore")


class RuleTestResult(BaseModel):
    """Result of rule test"""
    matched: bool
    details: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class SuppressionRule(BaseModel):
    """Suppression rule object"""
    id: str
    name: str
    rule_definition: Dict[str, Any]
    organization_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class SuppressionRuleCreate(BaseModel):
    """Create suppression rule"""
    name: str
    rule_definition: Dict[str, Any]
    organization_id: str
    
    model_config = ConfigDict(extra="ignore")


class SuppressionRuleUpdate(BaseModel):
    """Update suppression rule"""
    name: Optional[str] = None
    rule_definition: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")
