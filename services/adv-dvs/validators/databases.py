"""
Валідатори баз даних (Рівень 3)
"""

import asyncio
import subprocess
from typing import Dict, Any
import logging

from ..core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)


async def validate_postgresql() -> ValidationResult:
    """Валідація PostgreSQL"""
    details = {}
    errors = []
    
    try:
        # Перевірка підключення через docker exec
        result = subprocess.run(
            ['docker', 'exec', 'predator_postgres', 'psql', '-U', 'postgres', '-c', 'SELECT 1;'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['connection'] = 'OK'
            
            # Перевірка міграцій
            migration_result = subprocess.run(
                ['docker', 'exec', 'predator_postgres', 'psql', '-U', 'postgres', '-c', 'SELECT version_num FROM alembic_version;'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if migration_result.returncode == 0:
                details['migration_version'] = migration_result.stdout.strip()
            
            # Перевірка таблиць
            tables_result = subprocess.run(
                ['docker', 'exec', 'predator_postgres', 'psql', '-U', 'postgres', '-c', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if tables_result.returncode == 0:
                table_count = int(tables_result.stdout.strip().split('\n')[-2])
                details['table_count'] = table_count
                
                if table_count < 38:
                    errors.append(f'Expected at least 38 tables, found {table_count}')
        else:
            errors.append('PostgreSQL connection failed')
            
    except subprocess.TimeoutExpired:
        errors.append('PostgreSQL validation timeout')
    except Exception as e:
        errors.append(f'PostgreSQL validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.DATABASE,
        name='PostgreSQL Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_neo4j() -> ValidationResult:
    """Валідація Neo4j"""
    details = {}
    errors = []
    
    try:
        # Перевірка підключення через cypher-shell
        result = subprocess.run(
            ['docker', 'exec', 'predator_neo4j', 'cypher-shell', '-u', 'neo4j', '-p', 'neo4j', 'MATCH (n) RETURN COUNT(n);'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['connection'] = 'OK'
            # Парсинг результату
            try:
                node_count = int(result.stdout.strip())
                details['node_count'] = node_count
            except ValueError:
                pass
        else:
            errors.append('Neo4j connection failed')
            
    except subprocess.TimeoutExpired:
        errors.append('Neo4j validation timeout')
    except Exception as e:
        errors.append(f'Neo4j validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.DATABASE,
        name='Neo4j Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_clickhouse() -> ValidationResult:
    """Валідація ClickHouse"""
    details = {}
    errors = []
    
    try:
        # Перевірка підключення через clickhouse-client
        result = subprocess.run(
            ['docker', 'exec', 'predator_clickhouse', 'clickhouse-client', '--query', 'SELECT version();'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['connection'] = 'OK'
            details['version'] = result.stdout.strip()
        else:
            errors.append('ClickHouse connection failed')
            
    except subprocess.TimeoutExpired:
        errors.append('ClickHouse validation timeout')
    except Exception as e:
        errors.append(f'ClickHouse validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.DATABASE,
        name='ClickHouse Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )


async def validate_redis() -> ValidationResult:
    """Валідація Redis"""
    details = {}
    errors = []
    
    try:
        # Перевірка підключення через redis-cli
        result = subprocess.run(
            ['docker', 'exec', 'predator_redis', 'redis-cli', 'PING'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0 and 'PONG' in result.stdout:
            details['connection'] = 'OK'
        else:
            errors.append('Redis connection failed')
            
    except subprocess.TimeoutExpired:
        errors.append('Redis validation timeout')
    except Exception as e:
        errors.append(f'Redis validation error: {str(e)}')
    
    return ValidationResult(
        level=ValidationLevel.DATABASE,
        name='Redis Validation',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors
    )
