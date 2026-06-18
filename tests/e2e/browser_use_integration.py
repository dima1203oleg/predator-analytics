#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🤖 Інтеграція Browser Use з автономними E2E тестами

Цей модуль забезпечує глибоку інтеграцію фреймворку browser-use
з існуючою системою автономних E2E тестів PREDATOR Analytics.

Важливо: Запускайте після активації віртуального середовища:
source e2e_venv/bin/activate
python browser_use_integration.py
"""

import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List
import json
import logging

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

try:
    from browser_use import Agent
    # BrowserConfig більше не потрібен в новій версії
    # Налаштування робиться через параметри Agent
    BROWSER_USE_AVAILABLE = True
    logger.info("browser-use успішно імпортовано")
except ImportError as e:
    BROWSER_USE_AVAILABLE = False
    logger.warning(f"browser-use не встановлено або помилка імпорту: {e}. Деякі функції будуть недоступні.")
    logger.info("Для встановлення виконайте: pip install browser-use playwright")


class BrowserUseIntegration:
    """
    🌐 Клас для інтеграції browser-use з E2E тестами
    
    Забезпечує поєднання можливостей browser-use (AI-агент для браузера)
    з існуючими Playwright тестами для створення гнучких autonomous агентів.
    """
    
    def __init__(self, headless: bool = True, base_url: str = "http://localhost:3030"):
        """
        Ініціалізація інтеграції browser-use
        
        Args:
            headless: Чи запускати браузер у headless режимі
            base_url: Базовий URL для тестування
        """
        self.headless = headless
        self.base_url = base_url
        self.agent: Optional[Agent] = None
        
        if not BROWSER_USE_AVAILABLE:
            logger.error("browser-use не встановлено. Встановіть його: pip install browser-use")
            return
            
        logger.info(f"Інтеграцію browser-use налаштовано: headless={self.headless}, base_url={self.base_url}")

    async def create_agent(
        self,
        task: str,
        model_provider: str = "openai",
        model_name: str = "gpt-4o",
        max_steps: int = 100
    ) -> Optional[Agent]:
        """
        Створення AI-агента для виконання завдань у браузері
        
        Args:
            task: Опис завдання українською мовою
            model_provider: Провайдер моделі (openai, anthropic, etc.)
            model_name: Назва моделі
            max_steps: Максимальна кількість кроків агента
            
        Returns:
            Agent екземпляр або None у разі помилки
        """
        if not BROWSER_USE_AVAILABLE:
            logger.error("browser-use недоступний")
            return None
            
        try:
            # В новій версії browser-use не потрібен browser_config
            # Налаштування робиться через параметри безпосередньо
            self.agent = Agent(
                task=task,
                use_vision=True,
                save_conversation_path="tests/e2e/browser_use_logs",
                max_failures=3,
                generate_gif=False,
                # Додайте інші параметри за потреби
            )
            
            logger.info(f"Агент створено: task='{task}'")
            return self.agent
            
        except Exception as e:
            logger.error(f"Помилка створення агента: {e}")
            return None
    
    async def run_agent_task(
        self,
        task: str,
        url: Optional[str] = None,
        max_steps: int = 100
    ) -> Dict[str, Any]:
        """
        Виконання завдання через AI-агента
        
        Args:
            task: Опис завдання українською мовою
            url: URL для переходу (якщо None, використовується base_url)
            max_steps: Максимальна кількість кроків
            
        Returns:
            Результат виконання завдання
        """
        if not BROWSER_USE_AVAILABLE:
            return {
                "success": False,
                "error": "browser-use недоступний",
                "result": None
            }
        
        try:
            # Формування повного завдання
            full_task = f"""
            Перейти на сайт: {url or self.base_url}
            
            Завдання: {task}
            
            Важливо:
            - Виконуй дії покроково
            - Роби скріншоти для кожної важливої дії
            - У разі помилки спробуй інший підхід
            - Поверни детальний звіт про виконане завдання
            """
            
            # Створення агента
            agent = await self.create_agent(
                task=full_task,
                max_steps=max_steps
            )
            
            if not agent:
                return {
                    "success": False,
                    "error": "Не вдалося створити агента",
                    "result": None
                }
            
            # Виконання завдання
            result = await agent.run()
            
            logger.info(f"Завдання виконано: success={result is not None}")
            
            return {
                "success": result is not None,
                "result": result,
                "task": task,
                "steps": max_steps
            }
            
        except Exception as e:
            logger.error(f"Помилка виконання завдання: {e}")
            return {
                "success": False,
                "error": str(e),
                "result": None
            }
    
    async def test_excel_import_autonomous(self, excel_path: str) -> Dict[str, Any]:
        """
        Автономне тестування імпорту Excel через browser-use
        
        Args:
            excel_path: Шлях до Excel файлу
            
        Returns:
            Результати тестування
        """
        task = f"""
        Автономно протестувати імпорт Excel файлу:
        
        1. Перейти на сторінку імпорту
        2. Знайти кнопку для завантаження файлу
        3. Завантажити Excel файл за шляхом: {excel_path}
        4. Натиснути кнопку імпорту
        5. Переконатися, що файл почав оброблятися
        6. Чекати завершення імпорту (або повідомлення про помилку)
        7. Зробити скріншоти на кожному етапі
        8. Повернути детальний звіт про результат імпорту
        """
        
        return await self.run_agent_task(task)
    
    async def test_ui_navigation(self, navigation_path: List[str]) -> Dict[str, Any]:
        """
        Тестування навігації по UI
        
        Args:
            navigation_path: Шлях навігації (список елементів для натискання)
            
        Returns:
            Результати тестування
        """
        task = f"""
        Протестувати навігацію по UI:
        
        Шлях навігації: {' -> '.join(navigation_path)}
        
        1. Перейти на головну сторінку
        2. Послідовно натискати на елементи: {navigation_path}
        3. На кожному кроці робити скріншот
        4. Переконатися, що кожен елемент доступний та клікабельний
        5. Повернути звіт про успішну навігацію або помилки
        """
        
        return await self.run_agent_task(task)
    
    async def test_visual_regression(self, page_url: str) -> Dict[str, Any]:
        """
        Тестування візуальної регресії через AI-агента
        
        Args:
            page_url: URL сторінки для тестування
            
        Returns:
            Результати візуального тестування
        """
        task = f"""
        Провести візуальну перевірку сторінки: {page_url}
        
        1. Перейти на вказану сторінку
        2. Зачекати повного завантаження
        3. Перевірити, чи всі основні елементи відображаються коректно
        4. Зробити повний скріншот сторінки
        5. Перевірити відсутність візуальних артефактів
        6. Повернути детальний звіт про візуальний стан
        """
        
        return await self.run_agent_task(task, url=page_url)
    
    async def cleanup(self) -> None:
        """Очистка ресурсів"""
        try:
            # В новій версії browser-use Agent сам керує браузером
            # Не потрібно явно закривати браузер
            logger.info("Очищення завершено")
        except Exception as e:
            logger.error(f"Помилка очищення: {e}")


async def main():
    """Тестова функція для перевірки інтеграції"""
    integration = BrowserUseIntegration(headless=False)
    
    try:
        # Тест навігації
        result = await integration.test_ui_navigation([
            "Головна сторінка",
            "Панель керування",
            "Аналітика"
        ])
        
        print(f"Результат навігації: {result}")
        
    finally:
        await integration.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
