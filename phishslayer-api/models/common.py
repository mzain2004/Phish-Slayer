# FILE: models/common.py
# Shared models and response types for all routers

from typing import TypeVar, Generic, List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response model"""
    data: List[T]
    count: int
    page: int
    limit: int
    
    model_config = ConfigDict(extra="ignore")


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    status_code: int
    
    model_config = ConfigDict(extra="ignore")


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class StatusResponse(BaseModel):
    """Health/status response"""
    status: str
    timestamp: Optional[str] = None
    
    model_config = ConfigDict(extra="ignore")


class BulkActionRequest(BaseModel):
    """Generic bulk action request"""
    ids: List[str]
    action: str
    payload: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")


class BulkActionResponse(BaseModel):
    """Generic bulk action response"""
    success: int
    failed: int
    details: Optional[List[Dict[str, Any]]] = None
    
    model_config = ConfigDict(extra="ignore")


class ValidationResult(BaseModel):
    """Result of validation operation"""
    valid: bool
    error: Optional[str] = None
    parsed: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="ignore")
