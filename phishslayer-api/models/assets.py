# FILE: models/assets.py
# Asset management models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class Asset(BaseModel):
    """Asset object"""
    id: str
    asset_type: str
    hostname: Optional[str] = None
    ip_addresses: Optional[List[str]] = None
    criticality: str  # critical, high, medium, low
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class AssetCreate(BaseModel):
    """Create asset"""
    asset_type: str
    hostname: Optional[str] = None
    ip_addresses: Optional[List[str]] = None
    criticality: Optional[str] = "medium"
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class AssetUpdate(BaseModel):
    """Update asset"""
    hostname: Optional[str] = None
    criticality: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class AssetCriticality(BaseModel):
    """Asset criticality level"""
    asset_id: str
    criticality: str
    
    model_config = ConfigDict(extra="ignore")
