from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DiscoverySource(BaseModel):
    url: str
    source_type: str = Field(description="openapi, rest, graphql, ckan, csv, html, etc.")
    auth_required: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ProfilingResult(BaseModel):
    schema_definition: Dict[str, Any]
    entity_mapping: Dict[str, str]
    priority_score: float = Field(default=0.0, description="AI Priority Score (0-100)")
    relationships: List[Dict[str, str]] = Field(default_factory=list)

class ConnectorArtifacts(BaseModel):
    api_client_code: str
    normalizer_code: str
    tests_code: str
    dependencies: List[str] = Field(default_factory=list)

class TestReport(BaseModel):
    passed: bool
    coverage: float
    error_logs: Optional[str] = None
    chaos_resilient: bool = False

class FactoryState(BaseModel):
    source: DiscoverySource
    profiling: Optional[ProfilingResult] = None
    artifacts: Optional[ConnectorArtifacts] = None
    test_report: Optional[TestReport] = None
    status: str = "init"
    error_message: Optional[str] = None
