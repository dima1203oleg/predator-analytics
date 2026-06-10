"""
Оркестратор валідації
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
import asyncio
from datetime import datetime
import logging

from .validator import (
    DeploymentValidator,
    ValidationLevel,
    ValidationStatus,
    DeploymentReport
)


logger = logging.getLogger(__name__)


class ValidationOrchestrator:
    """Оркестратор валідації деплою"""
    
    def __init__(self):
        self.validator: Optional[DeploymentValidator] = None
        self.current_deployment_id: Optional[str] = None
        
    async def start_validation(self, deployment_id: str) -> DeploymentReport:
        """Запуск повної валідації деплою"""
        self.current_deployment_id = deployment_id
        self.validator = DeploymentValidator(deployment_id=deployment_id)
        
        # Реєстрація валідаторів для кожного рівня
        await self._register_validators()
        
        # Запуск валідації
        logger.info(f"Starting validation for deployment {deployment_id}")
        report = await self.validator.validate_all()
        
        logger.info(f"Validation completed. Readiness Index: {report.readiness_index:.2f}%")
        
        return report
    
    async def _register_validators(self):
        """Реєстрація валідаторів для всіх рівнів"""
        from ..validators.infrastructure import validate_docker, validate_kubernetes, validate_argocd, validate_helm
        from ..validators.containers import validate_containers
        from ..validators.databases import validate_postgresql, validate_neo4j, validate_clickhouse, validate_redis
        from ..validators.dom import validate_dom_pages
        from ..validators.api import validate_api_endpoints
        from ..validators.observability import validate_observability
        from ..validators.user_journey import validate_user_journey_scenario_1, validate_user_journey_scenario_2, validate_user_journey_scenario_3
        from ..validators.etl import validate_etl
        from ..validators.telegram import validate_telegram
        from ..validators.ai import validate_ollama
        from ..validators.security import validate_vault, validate_keycloak, validate_jwt, validate_rls
        from ..validators.chaos import validate_chaos_postgresql, validate_chaos_neo4j, validate_chaos_backend
        
        # Рівень 1 - Infrastructure
        self.validator.register_validator(ValidationLevel.INFRASTRUCTURE, validate_docker)
        self.validator.register_validator(ValidationLevel.INFRASTRUCTURE, validate_kubernetes)
        self.validator.register_validator(ValidationLevel.INFRASTRUCTURE, validate_argocd)
        self.validator.register_validator(ValidationLevel.INFRASTRUCTURE, validate_helm)
        
        # Рівень 2 - Containers
        self.validator.register_validator(ValidationLevel.CONTAINER, validate_containers)
        
        # Рівень 3 - Databases
        self.validator.register_validator(ValidationLevel.DATABASE, validate_postgresql)
        self.validator.register_validator(ValidationLevel.DATABASE, validate_neo4j)
        self.validator.register_validator(ValidationLevel.DATABASE, validate_clickhouse)
        self.validator.register_validator(ValidationLevel.DATABASE, validate_redis)
        
        # Рівень 4 - DOM Testing
        self.validator.register_validator(ValidationLevel.DOM, validate_dom_pages)
        
        # Рівень 5 - User Journey Testing
        self.validator.register_validator(ValidationLevel.USER_JOURNEY, validate_user_journey_scenario_1)
        self.validator.register_validator(ValidationLevel.USER_JOURNEY, validate_user_journey_scenario_2)
        self.validator.register_validator(ValidationLevel.USER_JOURNEY, validate_user_journey_scenario_3)
        
        # Рівень 6 - API Validation
        self.validator.register_validator(ValidationLevel.API, validate_api_endpoints)
        
        # Рівень 7 - ETL Validation
        self.validator.register_validator(ValidationLevel.ETL, validate_etl)
        
        # Рівень 8 - Telegram Validation
        self.validator.register_validator(ValidationLevel.TELEGRAM, validate_telegram)
        
        # Рівень 9 - AI Validation
        self.validator.register_validator(ValidationLevel.AI, validate_ollama)
        
        # Рівень 10 - Observability
        self.validator.register_validator(ValidationLevel.OBSERVABILITY, validate_observability)
        
        # Рівень 11 - Security Validation
        self.validator.register_validator(ValidationLevel.SECURITY, validate_vault)
        self.validator.register_validator(ValidationLevel.SECURITY, validate_keycloak)
        self.validator.register_validator(ValidationLevel.SECURITY, validate_jwt)
        self.validator.register_validator(ValidationLevel.SECURITY, validate_rls)
        
        # Рівень 12 - Chaos Validation
        self.validator.register_validator(ValidationLevel.CHAOS, validate_chaos_postgresql)
        self.validator.register_validator(ValidationLevel.CHAOS, validate_chaos_neo4j)
        self.validator.register_validator(ValidationLevel.CHAOS, validate_chaos_backend)
    
    def get_current_report(self) -> Optional[DeploymentReport]:
        """Отримати поточний звіт"""
        if self.validator:
            return self.validator.report
        return None
