"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

Валідатори observability (Рівень 10)
"""

import asyncio
import aiohttp
from typing import Dict, Any
import logging

from core.validator import ValidationResult, ValidationLevel, ValidationStatus
from config import config


logger = logging.getLogger(__name__)


async def validate_observability() -> ValidationResult:
    """Валідація observability систем"""
    details = {}
    errors = []
    warnings = []
    
    # Перевірка Prometheus
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{config.PROMETHEUS_URL}/api/v1/query', 
                                   params={'query': 'up'}, 
                                   timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    data = await response.json()
                    details['prometheus'] = 'OK'
                    details['prometheus_metrics'] = len(data.get('data', {}).get('result', []))
                else:
                    errors.append('Prometheus not accessible')
    except Exception as e:
        warnings.append(f'Prometheus validation error: {str(e)}')
    
    # Перевірка Grafana
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{config.GRAFANA_URL}/api/health', 
                                   timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    details['grafana'] = 'OK'
                else:
                    warnings.append('Grafana not accessible')
    except Exception as e:
        warnings.append(f'Grafana validation error: {str(e)}')
    
    # Перевірка Loki
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f'{config.LOKI_URL}/ready', 
                                   timeout=aiohttp.ClientTimeout(total=10)) as response:
                if response.status == 200:
                    details['loki'] = 'OK'
                else:
                    warnings.append('Loki not accessible')
    except Exception as e:
        warnings.append(f'Loki validation error: {str(e)}')
    
    status = ValidationStatus.PASSED
    if errors:
        status = ValidationStatus.FAILED
    elif warnings:
        status = ValidationStatus.WARNING
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.OBSERVABILITY,
        name='Observability Validation',
        status=status,
        details=details,
        errors=errors,
        warnings=warnings
    )
