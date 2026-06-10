"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

Валідатори AI (Рівень 9)
"""

import asyncio
import subprocess
from typing import Dict, Any
import logging

from core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)


async def validate_ollama() -> ValidationResult:
    """Валідація Ollama"""
    details = {}
    errors = []
    warnings = []
    
    try:
        # Перевірка списку моделей
        result = subprocess.run(
            ['ollama', 'list'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            details['ollama_status'] = 'OK'
            models = result.stdout.strip().split('\n')[1:]  # Пропускаємо заголовок
            details['available_models'] = [m.split()[0] for m in models if m.strip()]
            
            expected_models = ['qwen', 'gemma', 'phi', 'nemotron']
            missing_models = [m for m in expected_models if not any(m in model.lower() for model in details['available_models'])]
            
            if missing_models:
                warnings.append(f'Missing models: {", ".join(missing_models)}')
        else:
            errors.append('Ollama not accessible')
        
        # Контрольний запит
        try:
            result = subprocess.run(
                ['ollama', 'run', 'qwen', 'Напиши слово ТЕСТ'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                details['test_query'] = 'OK'
                if 'ТЕСТ' not in result.stdout:
                    warnings.append('Test query response unexpected')
            else:
                warnings.append('Test query failed')
        except Exception as e:
            warnings.append(f'Test query error: {str(e)}')
        
        # Контрольний аналітичний запит
        try:
            result = subprocess.run(
                ['ollama', 'run', 'qwen', 'Знайди ризики компанії TestCompany'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                details['analytical_query'] = 'OK'
                details['response_length'] = len(result.stdout)
            else:
                warnings.append('Analytical query failed')
        except Exception as e:
            warnings.append(f'Analytical query error: {str(e)}')
        
    except subprocess.TimeoutExpired:
        errors.append('Ollama validation timeout')
    except FileNotFoundError:
        errors.append('Ollama not found')
    except Exception as e:
        errors.append(f'Ollama validation error: {str(e)}')
    
    status = ValidationStatus.PASSED
    if errors:
        status = ValidationStatus.FAILED
    elif warnings:
        status = ValidationStatus.WARNING
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.AI,
        name='AI Validation',
        status=status,
        details=details,
        errors=errors,
        warnings=warnings
    )
