"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

Валідатори ETL (Рівень 7)
"""

import asyncio
import aiohttp
from typing import Dict, Any
import logging
import os

from core.validator import ValidationResult, ValidationLevel, ValidationStatus
from config import config


logger = logging.getLogger(__name__)


async def validate_etl() -> ValidationResult:
    """Валідація ETL процесу"""
    details = {}
    errors = []
    warnings = []
    base_url = config.BACKEND_API_URL
    
    # Створення тестового файлу
    test_file_path = "/tmp/test_etl.csv"
    with open(test_file_path, 'w') as f:
        f.write("company_name,inn,edrpou\n")
        f.write("Test Company,1234567890,987654321\n")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Крок 1: Завантаження файлу
            with open(test_file_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename='test_etl.csv', content_type='text/csv')
                
                async with session.post(f"{base_url}/api/v1/etl/upload", 
                                       data=data,
                                       timeout=aiohttp.ClientTimeout(total=60)) as response:
                    if response.status == 200:
                        result = await response.json()
                        details['upload_status'] = 'OK'
                        details['upload_id'] = result.get('id')
                    else:
                        errors.append(f'ETL upload failed with status {response.status}')
            
            # Крок 2: Перевірка статусу обробки
            if 'upload_id' in details:
                await asyncio.sleep(5)  # Чекання на обробку
                
                async with session.get(f"{base_url}/api/v1/etl/status/{details['upload_id']}",
                                      timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status == 200:
                        status = await response.json()
                        details['etl_status'] = status.get('status')
                        
                        if status.get('status') != 'completed':
                            warnings.append(f'ETL status: {status.get("status")}')
                    else:
                        warnings.append('Failed to get ETL status')
            
            # Крок 3: Перевірка наявності даних в PostgreSQL
            # TODO: додати перевірку через PostgreSQL connection
            details['postgresql_check'] = 'SKIPPED'
            
            # Крок 4: Перевірка наявності даних в Neo4j
            # TODO: додати перевірку через Neo4j connection
            details['neo4j_check'] = 'SKIPPED'
            
            # Крок 5: Перевірка наявності даних в OpenSearch
            # TODO: додати перевірку через OpenSearch connection
            details['opensearch_check'] = 'SKIPPED'
            
            # Крок 6: Перевірка наявності даних в Qdrant
            # TODO: додати перевірку через Qdrant connection
            details['qdrant_check'] = 'SKIPPED'
            
    except Exception as e:
        errors.append(f'ETL validation error: {str(e)}')
    finally:
        # Видалення тестового файлу
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
    
    status = ValidationStatus.PASSED
    if errors:
        status = ValidationStatus.FAILED
    elif warnings:
        status = ValidationStatus.WARNING
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.ETL,
        name='ETL Validation',
        status=status,
        details=details,
        errors=errors,
        warnings=warnings
    )
