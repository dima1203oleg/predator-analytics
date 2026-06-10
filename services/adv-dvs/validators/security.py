"""
Валідатори Security (Рівень 11)
"""

import asyncio
import subprocess
import aiohttp
from typing import Dict, Any
import logging
import os

from ..core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)


async def validate_vault() -> ValidationResult:
    """Валідація Vault"""
    details = {}
    errors = []
    
    try:
        # Отримання секрету з Vault
        vault_addr = os.getenv('VAULT_ADDR', 'http://localhost:8200')
        vault_token = os.getenv('VAULT_TOKEN')
        
        if not vault_token:
            errors.append('VAULT_TOKEN not set')
            return ValidationResult(
                level=ValidationLevel.SECURITY,
                name='Vault Validation',
                status=ValidationStatus.FAILED,
                details=details,
                errors=errors
            )
        
        async with aiohttp.ClientSession() as session:
            headers = {'X-Vault-Token': vault_token}
            
            async with session.get(f"{vault_addr}/v1/secret/data/test",
                                   headers=headers,
                                   timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    details['vault_status'] = 'OK'
                else:
                    errors.append('Vault not accessible')
        
    except Exception as e:
        errors.append(f'Vault validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.SECURITY,
        name='Vault Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_keycloak() -> ValidationResult:
    """Валідація Keycloak"""
    details = {}
    errors = []
    
    try:
        keycloak_url = os.getenv('KEYCLOAK_URL', 'http://localhost:8080')
        
        async with aiohttp.ClientSession() as session:
            # Перевірка доступності Keycloak
            async with session.get(f"{keycloak_url}/auth/realms/master",
                                   timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    details['keycloak_status'] = 'OK'
                else:
                    errors.append('Keycloak not accessible')
        
        # Логін тест
        # TODO: реалізувати логін з тестовими credentials
        
    except Exception as e:
        errors.append(f'Keycloak validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.SECURITY,
        name='Keycloak Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_jwt() -> ValidationResult:
    """Валідація JWT"""
    details = {}
    errors = []
    
    try:
        base_url = "http://localhost:8000"
        
        async with aiohttp.ClientSession() as session:
            # Отримання токена
            async with session.post(f"{base_url}/api/v1/auth/login",
                                   json={'username': 'test', 'password': 'test'},
                                   timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    data = await response.json()
                    token = data.get('token')
                    if token:
                        details['jwt_issuance'] = 'OK'
                    else:
                        errors.append('JWT token not issued')
                else:
                    errors.append('JWT login failed')
        
    except Exception as e:
        errors.append(f'JWT validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.SECURITY,
        name='JWT Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_rls() -> ValidationResult:
    """Валідація Row Level Security"""
    details = {}
    errors = []
    
    try:
        # Спроба доступу до іншого tenant
        base_url = "http://localhost:8000"
        
        async with aiohttp.ClientSession() as session:
            # Спроба доступу без правильних credentials
            async with session.get(f"{base_url}/api/v1/companies/999",
                                   headers={'X-Tenant-ID': '999'},
                                   timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 403 or response.status == 401:
                    details['rls_status'] = 'OK'
                    details['access_denied'] = True
                else:
                    errors.append('RLS not working correctly')
        
    except Exception as e:
        errors.append(f'RLS validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.SECURITY,
        name='RLS Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )
