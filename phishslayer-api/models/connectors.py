# FILE: models/connectors.py
# Connector models for integration management

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class Connector(BaseModel):
    """Connector configuration object"""
    id: str
    vendor: str
    connector_type: str
    display_name: str
    is_active: bool
    config: Dict[str, Any]  # Sanitized, no sensitive data
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(extra="ignore")


class ConnectorCreate(BaseModel):
    """Create connector"""
    vendor: str
    connector_type: str
    display_name: str
    config: Dict[str, Any]
    is_active: Optional[bool] = True
    
    model_config = ConfigDict(extra="ignore")


class ConnectorUpdate(BaseModel):
    """Update connector"""
    display_name: Optional[str] = None
    is_active: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class ConnectorTestRequest(BaseModel):
    """Test connector connection"""
    config: Dict[str, Any]
    
    model_config = ConfigDict(extra="ignore")


class ConnectorTestResult(BaseModel):
    """Connector test result"""
    success: bool
    message: str
    error: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class ConnectorAction(BaseModel):
    """Execute action on connector"""
    action_type: str
    action_data: Dict[str, Any]
    
    model_config = ConfigDict(extra="ignore")


class WazuhConnector(BaseModel):
    """Wazuh connector configuration"""
    vendor: str = "wazuh"
    connector_type: str = "siem"
    display_name: str
    config: Dict[str, Any]
    
    model_config = ConfigDict(extra="ignore")
