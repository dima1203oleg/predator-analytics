"""
Валідатори контейнерів (Рівень 2)
"""

import asyncio
import subprocess
from typing import Dict, Any, List
import logging

from ..core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)

EXPECTED_CONTAINERS = [
    'predator_backend',
    'predator_frontend',
    'predator_postgres',
    'predator_clickhouse',
    'predator_neo4j',
    'predator_qdrant',
    'predator_opensearch',
    'predator_minio',
    'predator_redpanda',
    'predator_redis',
    'predator_ollama',
    'predator_graph_service',
    'predator_osint_service',
    'predator_mcp_router',
    'predator_orchestrator',
    'predator_telegram_bot'
]


async def validate_containers() -> ValidationResult:
    """Валідація контейнерів"""
    details = {}
    errors = []
    warnings = []
    
    try:
        # Отримання списку контейнерів
        result = subprocess.run(
            ['docker', 'ps', '--format', '{{.Names}}'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            errors.append('Failed to get container list')
            return ValidationResult(
                level=ValidationLevel.CONTAINER,
                name='Container Validation',
                status=ValidationStatus.FAILED,
                details=details,
                errors=errors
            )
        
        running_containers = result.stdout.strip().split('\n')
        details['running_containers'] = running_containers
        details['running_count'] = len(running_containers)
        
        # Перевірка очікуваних контейнерів
        missing_containers = []
        for expected in EXPECTED_CONTAINERS:
            if not any(expected in container for container in running_containers):
                missing_containers.append(expected)
        
        if missing_containers:
            warnings.append(f'Missing containers: {", ".join(missing_containers)}')
            details['missing_containers'] = missing_containers
        
        # Перевірка статусу контейнерів
        container_details = {}
        for container in running_containers:
            try:
                inspect_result = subprocess.run(
                    ['docker', 'inspect', container],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if inspect_result.returncode == 0:
                    import json
                    inspect_data = json.loads(inspect_result.stdout)
                    container_info = inspect_data[0]
                    
                    container_details[container] = {
                        'status': container_info['State']['Status'],
                        'restart_count': container_info['RestartCount'],
                        'running': container_info['State']['Running']
                    }
                    
                    if container_info['RestartCount'] > 5:
                        warnings.append(f'Container {container} has {container_info["RestartCount"]} restarts')
                    
                    if not container_info['State']['Running']:
                        errors.append(f'Container {container} is not running')
                        
            except Exception as e:
                warnings.append(f'Failed to inspect container {container}: {str(e)}')
        
        details['container_details'] = container_details
        
    except subprocess.TimeoutExpired:
        errors.append('Container validation timeout')
    except Exception as e:
        errors.append(f'Container validation error: {str(e)}')
    
    status = ValidationStatus.PASSED
    if errors:
        status = ValidationStatus.FAILED
    elif warnings:
        status = ValidationStatus.WARNING
    
    return ValidationResult(
        level=ValidationLevel.CONTAINER,
        name='Container Validation',
        status=status,
        details=details,
        errors=errors,
        warnings=warnings
    )
