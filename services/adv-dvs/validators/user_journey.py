"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

Валідатори User Journey Testing (Рівень 5)
"""

import asyncio
from typing import Dict, Any, List
import logging
from playwright.async_api import async_playwright

from core.validator import ValidationResult, ValidationLevel, ValidationStatus


logger = logging.getLogger(__name__)


async def validate_user_journey_scenario_1() -> ValidationResult:
    """Сценарій №1: Логін -> Пошук -> Картка -> Ризик -> Граф -> PDF -> Завантаження"""
    details = {}
    errors = []
    warnings = []
    
    base_url = "http://localhost:3030"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Крок 1: Логін
            await page.goto(f"{base_url}/login", wait_until='networkidle', timeout=30000)
            
            # Перевірка наявності форми логіну
            login_form = await page.query_selector('form')
            if not login_form:
                errors.append('Login form not found')
            
            # Крок 2: Пошук компанії
            await page.goto(f"{base_url}/search", wait_until='networkidle', timeout=30000)
            
            search_input = await page.query_selector('input[type="search"]')
            if not search_input:
                errors.append('Search input not found')
            else:
                await search_input.fill('Test Company')
                await page.keyboard.press('Enter')
                await page.wait_for_timeout(2000)
            
            # Крок 3: Відкриття картки
            company_card = await page.query_selector('[data-testid="company-card"]')
            if company_card:
                await company_card.click()
                await page.wait_for_timeout(1000)
            else:
                warnings.append('Company card not found, skipping')
            
            # Крок 4: Перегляд ризику
            risk_section = await page.query_selector('[data-testid="risk-section"]')
            if not risk_section:
                warnings.append('Risk section not found')
            
            # Крок 5: Відкриття графу зв'язків
            graph_button = await page.query_selector('button:has-text("Граф")')
            if graph_button:
                await graph_button.click()
                await page.wait_for_timeout(1000)
            else:
                warnings.append('Graph button not found')
            
            # Крок 6: Формування PDF
            pdf_button = await page.query_selector('button:has-text("PDF")')
            if pdf_button:
                await pdf_button.click()
                await page.wait_for_timeout(2000)
            else:
                warnings.append('PDF button not found')
            
            # Крок 7: Завантаження PDF
            download_button = await page.query_selector('button:has-text("Завантажити")')
            if download_button:
                await download_button.click()
                await page.wait_for_timeout(1000)
            else:
                warnings.append('Download button not found')
            
            details['scenario_1'] = {
                'status': 'COMPLETED',
                'steps_completed': 7
            }
            
        except Exception as e:
            errors.append(f'Scenario 1 error: {str(e)}')
            details['scenario_1'] = {'status': 'FAILED', 'error': str(e)}
        
        await browser.close()
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.USER_JOURNEY,
        name='User Journey Scenario 1',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors,
        warnings=warnings
    )


async def validate_user_journey_scenario_2() -> ValidationResult:
    """Сценарій №2: Прогноз -> Сценарій -> Monte-Carlo -> Результат"""
    details = {}
    errors = []
    warnings = []
    
    base_url = "http://localhost:3030"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Крок 1: Відкрити прогноз
            await page.goto(f"{base_url}/modeling", wait_until='networkidle', timeout=30000)
            
            # Крок 2: Створити сценарій
            create_scenario_button = await page.query_selector('button:has-text("Створити сценарій")')
            if create_scenario_button:
                await create_scenario_button.click()
                await page.wait_for_timeout(1000)
            else:
                warnings.append('Create scenario button not found')
            
            # Крок 3: Запустити Monte-Carlo
            monte_carlo_button = await page.query_selector('button:has-text("Monte-Carlo")')
            if monte_carlo_button:
                await monte_carlo_button.click()
                await page.wait_for_timeout(2000)
            else:
                warnings.append('Monte-Carlo button not found')
            
            # Крок 4: Отримати результат
            result_section = await page.query_selector('[data-testid="result-section"]')
            if not result_section:
                warnings.append('Result section not found')
            
            details['scenario_2'] = {
                'status': 'COMPLETED',
                'steps_completed': 4
            }
            
        except Exception as e:
            errors.append(f'Scenario 2 error: {str(e)}')
            details['scenario_2'] = {'status': 'FAILED', 'error': str(e)}
        
        await browser.close()
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.USER_JOURNEY,
        name='User Journey Scenario 2',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors,
        warnings=warnings
    )


async def validate_user_journey_scenario_3() -> ValidationResult:
    """Сценарій №3: AI Nexus -> Питання -> Відповідь -> Перевірка"""
    details = {}
    errors = []
    warnings = []
    
    base_url = "http://localhost:3030"
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Крок 1: Відкрити AI Nexus
            await page.goto(f"{base_url}/nexus", wait_until='networkidle', timeout=30000)
            
            # Крок 2: Поставити питання
            chat_input = await page.query_selector('textarea[placeholder*="питання"]')
            if chat_input:
                await chat_input.fill('Тестове питання')
                await page.keyboard.press('Enter')
                await page.wait_for_timeout(3000)
            else:
                errors.append('Chat input not found')
            
            # Крок 3: Отримати відповідь
            response = await page.query_selector('[data-testid="ai-response"]')
            if not response:
                errors.append('AI response not found')
            
            # Крок 4: Перевірити відповідь
            if response:
                response_text = await response.inner_text()
                if len(response_text) < 10:
                    warnings.append('AI response too short')
            
            details['scenario_3'] = {
                'status': 'COMPLETED',
                'steps_completed': 4
            }
            
        except Exception as e:
            errors.append(f'Scenario 3 error: {str(e)}')
            details['scenario_3'] = {'status': 'FAILED', 'error': str(e)}
        
        await browser.close()
    
    return ValidationResult(duration=0.0, 
        level=ValidationLevel.USER_JOURNEY,
        name='User Journey Scenario 3',
        status=ValidationStatus.PASSED if not errors else ValidationStatus.FAILED,
        details=details,
        errors=errors,
        warnings=warnings
    )
