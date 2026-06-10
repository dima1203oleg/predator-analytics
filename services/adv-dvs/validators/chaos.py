"""
Валідатори Chaos (Рівень 12)
"""

import asyncio
import subprocess
from typing import Dict, Any
import logging

from ..core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)


async def validate_chaos_postgresql() -> ValidationResult:
    """Симуляція падіння PostgreSQL"""
    details = {}
    errors = []
    warnings = []
    
    try:
        # Зупинка контейнера
        subprocess.run(
            ['docker', 'stop', 'predator_postgres'],
            capture_output=True,
            timeout=30
        )
        
        details['postgresql_stopped'] = True
        
        # Чекання на відновлення (ArgoCD Self-Healing)
        await asyncio.sleep(30)
        
        # Перевірка статусу
        result = subprocess.run(
            ['docker', 'ps', '--filter', 'name=predator_postgres', '--format', '{{.Status}}'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if 'Up' in result.stdout:
            details['postgresql_recovered'] = True
        else:
            errors.append('PostgreSQL did not recover')
        
        # Перезапуск контейнера
        subprocess.run(
            ['docker', 'start', 'predator_postgres'],
            capture_output=True,
            timeout=30
        )
        
    except Exception as e:
        errors.append(f'Chaos PostgreSQL error: {str(e)}')
        # Відновлення контейнера в разі помилки
        try:
            subprocess.run(['docker', 'start', 'predator_postgres'], capture_output=True, timeout=30)
        except:
            pass
    
    return ValidationResult(
        level=ValidationLevel.CHAOS,
        name='Chaos PostgreSQL Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors,
        warnings=warnings
    )


async def validate_chaos_neo4j() -> ValidationResult:
    """Симуляція падіння Neo4j"""
    details = {}
    errors = []
    warnings = []
    
    try:
        # Зупинка контейнера
        subprocess.run(
            ['docker', 'stop', 'predator_neo4j'],
            capture_output=True,
            timeout=30
        )
        
        details['neo4j_stopped'] = True
        
        # Чекання на відновлення
        await asyncio.sleep(30)
        
        # Перевірка статусу
        result = subprocess.run(
            ['docker', 'ps', '--filter', 'name=predator_neo4j', '--format', '{{.Status}}'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if 'Up' in result.stdout:
            details['neo4j_recovered'] = True
        else:
            errors.append('Neo4j did not recover')
        
        # Перезапуск контейнера
        subprocess.run(
            ['docker', 'start', 'predator_neo4j'],
            capture_output=True,
            timeout=30
        )
        
    except Exception as e:
        errors.append(f'Chaos Neo4j error: {str(e)}')
        try:
            subprocess.run(['docker', 'start', 'predator_neo4j'], capture_output=True, timeout=30)
        except:
            pass
    
    return ValidationResult(
        level=ValidationLevel.CHAOS,
        name='Chaos Neo4j Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors,
        warnings=warnings
    )


async def validate_chaos_backend() -> ValidationResult:
    """Симуляція падіння Backend"""
    details = {}
    errors = []
    warnings = []
    
    try:
        # Зупинка контейнера
        subprocess.run(
            ['docker', 'stop', 'predator_backend'],
            capture_output=True,
            timeout=30
        )
        
        details['backend_stopped'] = True
        
        # Чекання на відновлення
        await asyncio.sleep(30)
        
        # Перевірка статусу
        result = subprocess.run(
            ['docker', 'ps', '--filter', 'name=predator_backend', '--format', '{{.Status}}'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if 'Up' in result.stdout:
            details['backend_recovered'] = True
        else:
            errors.append('Backend did not recover')
        
        # Перезапуск контейнера
        subprocess.run(
            ['docker', 'start', 'predator_backend'],
            capture_output=True,
            timeout=30
        )
        
    except Exception as e:
        errors.append(f'Chaos Backend error: {str(e)}')
        try:
            subprocess.run(['docker', 'start', 'predator_backend'], capture_output=True, timeout=30)
        except:
            pass
    
    return ValidationResult(
        level=ValidationLevel.CHAOS,
        name='Chaos Backend Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors,
        warnings=warnings
    )
