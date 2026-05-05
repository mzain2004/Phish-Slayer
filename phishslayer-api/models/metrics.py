# FILE: models/metrics.py
# Metrics and monitoring models

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class Metric(BaseModel):
    """Metric object"""
    id: str
    name: str
    value: Any
    unit: Optional[str] = None
    timestamp: datetime
    tags: Optional[Dict[str, str]] = None
    
    model_config = ConfigDict(extra="ignore")


class MetricCreate(BaseModel):
    """Create metric"""
    name: str
    value: Any
    unit: Optional[str] = None
    tags: Optional[Dict[str, str]] = None
    
    model_config = ConfigDict(extra="ignore")


class SOCMetrics(BaseModel):
    """SOC metrics summary"""
    total_alerts: int
    alerts_acknowledged: int
    alerts_pending: int
    average_triage_time: float
    mttr: float
    
    model_config = ConfigDict(extra="ignore")


class AgentMetrics(BaseModel):
    """Agent execution metrics"""
    l1_triage_count: int
    l2_investigation_count: int
    l3_hunt_count: int
    average_execution_time: float
    success_rate: float
    
    model_config = ConfigDict(extra="ignore")


class MetricsSnapshot(BaseModel):
    """Snapshot of all metrics"""
    soc_metrics: SOCMetrics
    agent_metrics: AgentMetrics
    timestamp: datetime
    
    model_config = ConfigDict(extra="ignore")


class MetricsTrend(BaseModel):
    """Metrics trend data"""
    metric_name: str
    data_points: List[Dict[str, Any]]
    time_range: str
    
    model_config = ConfigDict(extra="ignore")
