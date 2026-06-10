"""
Валідатори API (Рівень 6)
"""

import asyncio
import aiohttp
from typing import Dict, Any, List
import logging

from ..core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)

API_ENDPOINTS = [
    '/api/v1/health',
    '/api/v1/companies',
    '/api/v1/search',
    '/api/v1/risks',
    '/api/v1/graph',
    '/api/v1/etl'
]


async def validate_api_endpoints() -> ValidationResult:
    """Валідація API endpoints"""
    details = {}
    errors = []
    warnings = []
    
    base_url = "http://localhost:8000"  # TODO: отримати з конфігурації
    
    async with aiohttp.ClientSession() as session:
        endpoint_results = {}
        
        for endpoint in API_ENDPOINTS:
            try:
                url = f"{base_url}{endpoint}"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as response:
                    
                    result = {
                        'status_code': response.status,
                        'status': 'OK' if response.status == 200 else 'ERROR'
                    }
                    
                    if response.status != 200:
                        errors.append(f'Endpoint {endpoint} returned {response.status}')
                    
                    # Перевірка JSON
                    try:
                        data = await response.json()
                        result['json_valid'] = True
                        result['data_keys'] = list(data.keys()) if isinstance(data, dict) else 'array'
                    except:
                        result['json_valid'] = False
                        warnings.append(f'Endpoint {endpoint} did not return valid JSON')
                    
                    endpoint_results[endpoint] = result
                    
            except asyncio.TimeoutError:
                errors.append(f'Endpoint {endpoint} timeout')
                endpoint_results[endpoint] = {'status': 'TIMEOUT'}
            except Exception as e:
                errors.append(f'Endpoint {endpoint} error: {str(e)}')
                endpoint_results[endpoint] = {'status': 'ERROR', 'error': str(e)}
    
    details['endpoint_results'] = endpoint_results
    
    status = ValidationStatus.PASSED
    if errors:
        status = ValidationStatus.FAILED
    elif warnings:
        status = ValidationStatus.WARNING
    
    return ValidationResult(
        level=ValidationLevel.API,
        name='API Validation',
        status=status,
        details=details,
        errors=errors,
        warnings=warnings
    )
