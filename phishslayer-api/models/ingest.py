# FILE: models/ingest.py
# Data ingestion models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class IngestedEvent(BaseModel):
    """Ingested event"""
    id: str
    raw_content: str
    source_type: str
    organization_id: str
    source_ip: Optional[str] = None
    parsed_data: Optional[Dict[str, Any]] = None
    ingested_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class IngestRequest(BaseModel):
    """Ingest event"""
    raw_content: str
    source_type: str
    organization_id: str
    source_ip: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class BatchIngestRequest(BaseModel):
    """Batch ingest events"""
    events: List[Dict[str, Any]]
    
    model_config = ConfigDict(extra="ignore")


class BatchIngestResult(BaseModel):
    """Batch ingest result"""
    ingested: int
    failed: int
    details: Optional[List[Dict[str, Any]]] = None
    
    model_config = ConfigDict(extra="ignore")


class CEFIngest(BaseModel):
    """CEF format ingestion"""
    cef_formatted_data: str
    
    model_config = ConfigDict(extra="ignore")


class STIXIngest(BaseModel):
    """STIX format ingestion"""
    stix_bundle: Dict[str, Any]
    
    model_config = ConfigDict(extra="ignore")


class STIXIngestResult(BaseModel):
    """STIX ingest result"""
    success: bool
    imported: int
    error: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")
