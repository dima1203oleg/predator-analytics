"""
Валідатори DOM тестування (Рівень 4)
"""

import asyncio
from typing import Dict, Any, List
import logging
from playwright.async_api import async_playwright

from ..core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)

PAGES_TO_VALIDATE = [
    '/login',
    '/dashboard',
    '/search',
    '/market',
    '/osint',
    '/nexus',
    '/financial',
    '/modeling',
    '/admin'
]


async def validate_dom_pages() -> ValidationResult:
    """Валідація DOM сторінок"""
    details = {}
    errors = []
    warnings = []
    
    base_url = "http://localhost:3030"  # TODO: отримати з конфігурації
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        page_results = {}
        
        for page_path in PAGES_TO_VALIDATE:
            try:
                url = f"{base_url}{page_path}"
                await page.goto(url, wait_until='networkidle', timeout=30000)
                
                # Перевірка JS помилок
                js_errors = []
                page.on('console', lambda msg: js_errors.append(msg.text) if msg.type == 'error' else None)
                
                # Перевірка наявності контенту
                content = await page.content()
                
                if len(content) < 1000:
                    warnings.append(f'Page {page_path} has minimal content')
                
                # Перевірка React помилок
                react_errors = await page.evaluate('''
                    () => {
                        const errors = [];
                        window.addEventListener('error', (e) => errors.push(e.message));
                        return errors;
                    }
                ''')
                
                if react_errors:
                    errors.append(f'React errors on {page_path}: {", ".join(react_errors)}')
                
                if js_errors:
                    errors.append(f'JS errors on {page_path}: {", ".join(js_errors)}')
                
                page_results[page_path] = {
                    'status': 'OK',
                    'content_length': len(content),
                    'js_errors': len(js_errors),
                    'react_errors': len(react_errors) if react_errors else 0
                }
                
            except asyncio.TimeoutError:
                errors.append(f'Page {page_path} timeout')
                page_results[page_path] = {'status': 'TIMEOUT'}
            except Exception as e:
                errors.append(f'Page {page_path} error: {str(e)}')
                page_results[page_path] = {'status': 'ERROR', 'error': str(e)}
        
        await browser.close()
    
    details['page_results'] = page_results
    
    status = ValidationStatus.PASSED
    if errors:
        status = ValidationStatus.FAILED
    elif warnings:
        status = ValidationStatus.WARNING
    
    return ValidationResult(
        level=ValidationLevel.DOM,
        name='DOM Validation',
        status=status,
        details=details,
        errors=errors,
        warnings=warnings
    )
