"""
Основний клас валідатора деплою
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import asyncio
from datetime import datetime
import json


class ValidationLevel(Enum):
    """Рівні валідації"""
    INFRASTRUCTURE = 1
    CONTAINER = 2
    DATABASE = 3
    DOM = 4
    USER_JOURNEY = 5
    API = 6
    ETL = 7
    TELEGRAM = 8
    AI = 9
    OBSERVABILITY = 10
    SECURITY = 11
    CHAOS = 12


class ValidationStatus(Enum):
    """Статус валідації"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    SKIPPED = "skipped"


@dataclass
class ValidationResult:
    """Результат валідації"""
    level: ValidationLevel
    name: str
    status: ValidationStatus
    duration: float
    details: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Конвертація в словник"""
        return {
            'level': self.level.name,
            'name': self.name,
            'status': self.status.value,
            'duration': self.duration,
            'details': self.details,
            'errors': self.errors,
            'warnings': self.warnings,
            'timestamp': self.timestamp.isoformat()
        }


@dataclass
class DeploymentReport:
    """Звіт про деплой"""
    deployment_id: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    results: List[ValidationResult] = field(default_factory=list)
    readiness_index: float = 0.0
    overall_status: ValidationStatus = ValidationStatus.PENDING
    
    def calculate_readiness_index(self) -> float:
        """Розрахунок індексу готовності"""
        if not self.results:
            return 0.0
        
        total_score = 0
        total_weight = 0
        
        for result in self.results:
            weight = self._get_level_weight(result.level)
            score = self._get_status_score(result.status)
            total_score += score * weight
            total_weight += weight
        
        self.readiness_index = (total_score / total_weight) * 100 if total_weight > 0 else 0.0
        return self.readiness_index
    
    def _get_level_weight(self, level: ValidationLevel) -> float:
        """Вага рівня валідації"""
        weights = {
            ValidationLevel.INFRASTRUCTURE: 1.0,
            ValidationLevel.CONTAINER: 1.0,
            ValidationLevel.DATABASE: 1.5,
            ValidationLevel.DOM: 1.5,
            ValidationLevel.USER_JOURNEY: 1.5,
            ValidationLevel.API: 1.0,
            ValidationLevel.ETL: 1.0,
            ValidationLevel.TELEGRAM: 0.5,
            ValidationLevel.AI: 1.0,
            ValidationLevel.OBSERVABILITY: 0.5,
            ValidationLevel.SECURITY: 1.5,
            ValidationLevel.CHAOS: 1.0
        }
        return weights.get(level, 1.0)
    
    def _get_status_score(self, status: ValidationStatus) -> float:
        """Оцінка статусу"""
        scores = {
            ValidationStatus.PASSED: 1.0,
            ValidationStatus.WARNING: 0.7,
            ValidationStatus.FAILED: 0.0,
            ValidationStatus.SKIPPED: 0.5,
            ValidationStatus.PENDING: 0.0,
            ValidationStatus.RUNNING: 0.0
        }
        return scores.get(status, 0.0)
    
    def to_dict(self) -> Dict[str, Any]:
        """Конвертація в словник"""
        return {
            'deployment_id': self.deployment_id,
            'timestamp': self.timestamp.isoformat(),
            'readiness_index': self.readiness_index,
            'overall_status': self.overall_status.value,
            'results': [r.to_dict() for r in self.results]
        }


class DeploymentValidator:
    """Основний клас валідатора деплою"""
    
    def __init__(self, deployment_id: str):
        self.deployment_id = deployment_id
        self.report = DeploymentReport(deployment_id=deployment_id)
        self.validators = {}
        
    def register_validator(self, level: ValidationLevel, validator_func):
        """Реєстрація валідатора"""
        if level not in self.validators:
            self.validators[level] = []
        self.validators[level].append(validator_func)
    
    async def validate_all(self) -> DeploymentReport:
        """Запуск всіх валідацій"""
        self.report.overall_status = ValidationStatus.RUNNING
        
        for level in ValidationLevel:
            if level in self.validators:
                await self._validate_level(level)
        
        self.report.calculate_readiness_index()
        
        if self.report.readiness_index >= 95:
            self.report.overall_status = ValidationStatus.PASSED
        elif self.report.readiness_index >= 70:
            self.report.overall_status = ValidationStatus.WARNING
        else:
            self.report.overall_status = ValidationStatus.FAILED
        
        return self.report
    
    async def _validate_level(self, level: ValidationLevel):
        """Валідація конкретного рівня"""
        if level not in self.validators:
            return
        
        for validator_func in self.validators[level]:
            try:
                start_time = datetime.utcnow()
                result = await validator_func()
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                if isinstance(result, ValidationResult):
                    result.duration = duration
                else:
                    result = ValidationResult(
                        level=level,
                        name=validator_func.__name__,
                        status=ValidationStatus.PASSED if result else ValidationStatus.FAILED,
                        duration=duration,
                        details={'result': result}
                    )
                
                self.report.results.append(result)
                
            except Exception as e:
                result = ValidationResult(
                    level=level,
                    name=validator_func.__name__,
                    status=ValidationStatus.FAILED,
                    duration=0,
                    errors=[str(e)]
                )
                self.report.results.append(result)
