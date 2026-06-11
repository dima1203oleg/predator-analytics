"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

Валідатори Telegram (Рівень 8)
"""

import asyncio
import aiohttp
from typing import Dict, Any
import logging

from core.validator import ValidationResult, ValidationLevel, ValidationStatus
from config import config


logger = logging.getLogger(__name__)


async def validate_telegram() -> ValidationResult:
    """Валідація Telegram бота"""
    details = {}
    errors = []
    warnings = []
    
    bot_token = config.TELEGRAM_BOT_TOKEN
    test_chat_id = config.TELEGRAM_TEST_CHAT_ID
    
    if not bot_token:
        errors.append('TELEGRAM_BOT_TOKEN not set')
        return ValidationResult(duration=0.0, 
            level=ValidationLevel.TELEGRAM,
            name='Telegram Validation',
            status=ValidationStatus.FAILED,
            details=details,
            errors=errors
        )
    
    try:
        async with aiohttp.ClientSession() as session:
            # Перевірка статусу бота
            async with session.get(f"https://api.telegram.org/bot{bot_token}/getMe",
                                   timeout=aiohttp.ClientTimeout(total=30)) as response:
                if response.status == 200:
                    bot_info = await response.json()
                    details['bot_status'] = 'OK'
                    details['bot_name'] = bot_info.get('result', {}).get('username')
                else:
                    errors.append('Telegram bot not accessible')
            
            # Відправка тестового повідомлення
            if test_chat_id:
                async with session.post(f"https://api.telegram.org/bot{bot_token}/sendMessage",
                                        json={'chat_id': test_chat_id, 'text': 'ADV-DVS Test Message'},
                                        timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status == 200:
                        details['test_message'] = 'OK'
                    else:
                        warnings.append('Failed to send test message')
            
            # Відправка тестового запиту
            if test_chat_id:
                async with session.post(f"https://api.telegram.org/bot{bot_token}/sendMessage",
                                        json={'chat_id': test_chat_id, 'text': 'Компанія: TestCompany'},
                                        timeout=aiohttp.ClientTimeout(total=30)) as response:
                    if response.status == 200:
                        details['test_query'] = 'OK'
                        # Чекання на відповідь
                        await asyncio.sleep(5)
                    else:
                        warnings.append('Failed to send test query')
            
    except Exception as e:
        errors.append(f'Telegram validation error: {str(e)}')
    
    status = ValidationStatus.PASSED
    if errors:
        status = ValidationStatus.FAILED
    elif warnings:
        status = ValidationStatus.WARNING
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.TELEGRAM,
        name='Telegram Validation',
        status=status,
        details=details,
        errors=errors,
        warnings=warnings
    )
