# FILE: models/intel.py
# Intelligence and TIP models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class IOC(BaseModel):
    """Indicator of Compromise"""
    id: str
    ioc_value: str
    ioc_type: str  # ip, domain, email, hash, etc
    confidence: float
    source: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class IOCCreate(BaseModel):
    """Create IOC"""
    ioc_value: str
    ioc_type: str
    confidence: Optional[float] = None
    source: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class IOCLookup(BaseModel):
    """Lookup IOC"""
    ioc_value: str
    ioc_type: str
    
    model_config = ConfigDict(extra="ignore")


class IOCLookupResult(BaseModel):
    """IOC lookup result with enrichment"""
    ioc_value: str
    ioc_type: str
    found: bool
    threat_level: Optional[str] = None
    enrichment: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class ThreatIntelFeed(BaseModel):
    """Threat intelligence feed"""
    id: str
    feed_name: str
    feed_url: str
    feed_type: str
    last_updated: Optional[datetime] = None
    is_active: bool
    
    model_config = ConfigDict(extra="ignore")


class ThreatIntelFeedCreate(BaseModel):
    """Create threat intel feed"""
    feed_name: str
    feed_url: str
    feed_type: str
    is_active: Optional[bool] = True
    
    model_config = ConfigDict(extra="ignore")


class Campaign(BaseModel):
    """Threat campaign"""
    id: str
    name: str
    description: Optional[str] = None
    associated_actors: Optional[List[str]] = None
    indicators: Optional[List[str]] = None
    
    model_config = ConfigDict(extra="ignore")


class ThreatActor(BaseModel):
    """Threat actor object"""
    id: str
    name: str
    aliases: Optional[List[str]] = None
    description: Optional[str] = None
    known_tactics: Optional[List[str]] = None
    
    model_config = ConfigDict(extra="ignore")
