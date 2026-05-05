# FILE: models/osint.py
# OSINT investigation models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class OSINTInvestigation(BaseModel):
    """OSINT investigation"""
    id: str
    target: str
    investigation_type: str
    status: str
    results: Optional[List[Dict[str, Any]]] = None
    report: Optional[Dict[str, Any]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    model_config = ConfigDict(extra="ignore")


class OSINTInvestigationCreate(BaseModel):
    """Create OSINT investigation"""
    target: str
    investigation_type: str
    
    model_config = ConfigDict(extra="ignore")


class BrandMonitoringStatus(BaseModel):
    """Brand monitoring status"""
    brand_name: str
    is_monitoring: bool
    domains: Optional[List[str]] = None
    last_scan: Optional[datetime] = None
    
    model_config = ConfigDict(extra="ignore")


class BrandScan(BaseModel):
    """Brand monitoring scan"""
    id: str
    brand_name: str
    domains: Optional[List[str]] = None
    scan_status: str
    findings: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class BrandScanRequest(BaseModel):
    """Request brand scan"""
    brand_name: str
    domains: Optional[List[str]] = None
    
    model_config = ConfigDict(extra="ignore")


class OSINTReport(BaseModel):
    """OSINT investigation report"""
    investigation_id: str
    title: Optional[str] = None
    findings: Optional[List[Dict[str, Any]]] = None
    recommendations: Optional[List[str]] = None
    generated_at: datetime
    
    model_config = ConfigDict(extra="ignore")
