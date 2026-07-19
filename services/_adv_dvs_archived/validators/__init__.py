import os
from .base import BaseValidator
from .level1_infra import InfraValidator
from .level2_backend import BackendValidator
from .level3_frontend import FrontendValidator
from .level4_sync import SyncValidator
from .level5_databases import DatabasesValidator
from .level5_osint import OsintValidator
from .level6_etl import EtlValidator
from .level7_parsers import ParsersValidator
from .level8_integrations import IntegrationsValidator
from .level9_datasets import DatasetsValidator
from .level10_automl import AutoMLValidator
from .level11_llm import LlmValidator
from .level12_ai_pipelines import AiPipelinesValidator
from .level13_data_flow import DataFlowValidator
from .level14_performance import PerformanceValidator
from .level15_security import SecurityValidator
from .level16_backup import BackupValidator
from .level17_e2e import E2eValidator

VALIDATORS = [
    InfraValidator, BackendValidator, FrontendValidator, SyncValidator,
    DatabasesValidator, OsintValidator, EtlValidator, ParsersValidator, IntegrationsValidator,
    DatasetsValidator, AutoMLValidator, LlmValidator, AiPipelinesValidator,
    DataFlowValidator, PerformanceValidator, SecurityValidator, BackupValidator,
    E2eValidator
]
