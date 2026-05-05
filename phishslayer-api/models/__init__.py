# FILE: models/__init__.py
# Models package - Pydantic models for request/response validation

from .common import (
    PaginatedResponse,
    ErrorResponse,
    SuccessResponse,
    StatusResponse,
    BulkActionRequest,
    BulkActionResponse,
    ValidationResult
)

from .alerts import (
    Alert,
    AlertUpdate,
    AlertAcknowledge,
    AlertAssign,
    BulkAlertAction
)

from .cases import (
    Case,
    CaseCreate,
    CaseUpdate,
    Evidence,
    EvidenceCreate,
    TimelineEntry,
    TimelineCreate
)

from .connectors import (
    Connector,
    ConnectorCreate,
    ConnectorUpdate,
    ConnectorTestRequest,
    ConnectorTestResult,
    ConnectorAction,
    WazuhConnector
)

from .detection import (
    DetectionRule,
    DetectionRuleCreate,
    DetectionRuleUpdate,
    RuleValidation,
    RuleTest,
    RuleTestResult,
    SuppressionRule,
    SuppressionRuleCreate,
    SuppressionRuleUpdate
)

from .intel import (
    IOC,
    IOCCreate,
    IOCLookup,
    IOCLookupResult,
    ThreatIntelFeed,
    ThreatIntelFeedCreate,
    Campaign,
    ThreatActor
)

from .metrics import (
    Metric,
    MetricCreate,
    SOCMetrics,
    AgentMetrics,
    MetricsSnapshot,
    MetricsTrend
)

from .osint import (
    OSINTInvestigation,
    OSINTInvestigationCreate,
    BrandMonitoringStatus,
    BrandScan,
    BrandScanRequest,
    OSINTReport
)

from .playbooks import (
    Playbook,
    PlaybookCreate,
    PlaybookUpdate,
    PlaybookExecution,
    PlaybookRun,
    PlaybookRunApproval,
    PlaybookRunRollback
)

from .sigma import (
    SigmaRule,
    SigmaRuleCreate,
    SigmaRuleDeploy,
    SigmaDeploymentResult
)

from .assets import (
    Asset,
    AssetCreate,
    AssetUpdate,
    AssetCriticality
)

from .hunting import (
    Hypothesis,
    HypothesisCreate,
    HuntExecution,
    HuntResults,
    HuntQuery,
    HuntHistory
)

from .mitre import (
    MITRETechnique,
    MITRETag,
    MITRESim,
    MITRESimResult,
    MITRECoverage,
    MITREHeatmap,
    MITREGaps
)

from .ingest import (
    IngestedEvent,
    IngestRequest,
    BatchIngestRequest,
    BatchIngestResult,
    CEFIngest,
    STIXIngest,
    STIXIngestResult
)

__all__ = [
    # Common
    "PaginatedResponse",
    "ErrorResponse",
    "SuccessResponse",
    "StatusResponse",
    "BulkActionRequest",
    "BulkActionResponse",
    "ValidationResult",
    # Alerts
    "Alert",
    "AlertUpdate",
    "AlertAcknowledge",
    "AlertAssign",
    "BulkAlertAction",
    # Cases
    "Case",
    "CaseCreate",
    "CaseUpdate",
    "Evidence",
    "EvidenceCreate",
    "TimelineEntry",
    "TimelineCreate",
    # Connectors
    "Connector",
    "ConnectorCreate",
    "ConnectorUpdate",
    "ConnectorTestRequest",
    "ConnectorTestResult",
    "ConnectorAction",
    "WazuhConnector",
    # Detection
    "DetectionRule",
    "DetectionRuleCreate",
    "DetectionRuleUpdate",
    "RuleValidation",
    "RuleTest",
    "RuleTestResult",
    "SuppressionRule",
    "SuppressionRuleCreate",
    "SuppressionRuleUpdate",
    # Intel
    "IOC",
    "IOCCreate",
    "IOCLookup",
    "IOCLookupResult",
    "ThreatIntelFeed",
    "ThreatIntelFeedCreate",
    "Campaign",
    "ThreatActor",
    # Metrics
    "Metric",
    "MetricCreate",
    "SOCMetrics",
    "AgentMetrics",
    "MetricsSnapshot",
    "MetricsTrend",
    # OSINT
    "OSINTInvestigation",
    "OSINTInvestigationCreate",
    "BrandMonitoringStatus",
    "BrandScan",
    "BrandScanRequest",
    "OSINTReport",
    # Playbooks
    "Playbook",
    "PlaybookCreate",
    "PlaybookUpdate",
    "PlaybookExecution",
    "PlaybookRun",
    "PlaybookRunApproval",
    "PlaybookRunRollback",
    # Sigma
    "SigmaRule",
    "SigmaRuleCreate",
    "SigmaRuleDeploy",
    "SigmaDeploymentResult",
    # Assets
    "Asset",
    "AssetCreate",
    "AssetUpdate",
    "AssetCriticality",
    # Hunting
    "Hypothesis",
    "HypothesisCreate",
    "HuntExecution",
    "HuntResults",
    "HuntQuery",
    "HuntHistory",
    # MITRE
    "MITRETechnique",
    "MITRETag",
    "MITRESim",
    "MITRESimResult",
    "MITRECoverage",
    "MITREHeatmap",
    "MITREGaps",
    # Ingest
    "IngestedEvent",
    "IngestRequest",
    "BatchIngestRequest",
    "BatchIngestResult",
    "CEFIngest",
    "STIXIngest",
    "STIXIngestResult"
]
