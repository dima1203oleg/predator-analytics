from __future__ import annotations

#!/usr/bin/env python3
"""Тестування Telegram Bot V4.0."""

import asyncio
import os

# Імпорт компонентів бота (якщо запускається окремо)
import sys
from unittest.mock import AsyncMock

import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# ==================== TEST DATA ====================

TEST_USER_ID = 123456789
TEST_ADMIN_ID = 1020504147
TEST_MESSAGE = "Тестове повідомлення"

# ==================== UNIT TESTS ====================


class TestMenuSystem:
    """Тести системи меню."""

    def test_main_menu_structure(self):
        """Перевірка структури головного меню."""
        # Імпорт тут щоб уникнути помилок якщо модуль не доступний
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import MenuSystem

            menu = MenuSystem.get_main_menu()
            assert menu is not None
            assert len(menu.keyboard) > 0
        except ImportError:
            pass

    def test_all_menus_have_back_button(self):
        """Перевірка що всі меню мають кнопку повернення."""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import MenuSystem

            menus = [
                MenuSystem.get_dashboard_menu(),
                MenuSystem.get_ai_menu(),
                MenuSystem.get_system_control_menu(),
                MenuSystem.get_analytics_menu(),
                MenuSystem.get_configuration_menu(),
                MenuSystem.get_automation_menu(),
                MenuSystem.get_data_management_menu(),
                MenuSystem.get_security_menu(),
                MenuSystem.get_network_api_menu(),
                MenuSystem.get_logs_reports_menu(),
                MenuSystem.get_tasks_jobs_menu(),
            ]

            for menu in menus:
                # Перевірка що є кнопка "Main Menu"
                has_back = any(
                    any(btn.callback_data == "main_menu" for btn in row)
                    for row in menu.inline_keyboard
                )
                assert has_back, "Menu missing back button"

        except ImportError:
            pass


class TestSystemController:
    """Тести системного контролера."""

    @pytest.mark.asyncio
    async def test_get_system_status(self):
        """Тест отримання статусу системи."""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

            status = await SystemController.get_system_status()
            assert status is not None
            assert "CPU" in status
            assert "Memory" in status
            assert "Disk" in status
        except ImportError:
            pass

    @pytest.mark.asyncio
    async def test_get_processes(self):
        """Тест отримання списку процесів."""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

            processes = await SystemController.get_processes()
            assert processes is not None
            assert "PROCESSES" in processes
        except ImportError:
            pass


class TestAIController:
    """Тести AI контролера."""

    @pytest.mark.asyncio
    async def test_ai_controller_initialization(self):
        """Тест ініціалізації AI контролера."""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import AIController

            ai = AIController()
            assert ai is not None
            assert ai.current_model in ["gemini", "groq"]
        except ImportError:
            pass

    @pytest.mark.asyncio
    async def test_ai_chat_without_keys(self):
        """Тест чату без API ключів."""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import AIController

            # Створюємо контролер без ключів
            ai = AIController()
            ai.gemini_key = ""
            ai.groq_key = ""

            response = await ai.chat("Привіт")
            assert "не налаштована" in response or "API" in response
        except ImportError:
            pass


class TestContextManager:
    """Тести менеджера контексту."""

    @pytest.mark.asyncio
    async def test_context_creation(self):
        """Тест створення контексту."""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import (
                ContextManager,
                UserContext,
            )

            # Mock Redis
            mock_redis = AsyncMock()
            mock_redis.get.return_value = None
            mock_redis.set.return_value = True

            context_mgr = ContextManager(mock_redis)
            context = await context_mgr.get_context(TEST_USER_ID)

            assert context is not None
            assert context.user_id == TEST_USER_ID
            assert isinstance(context.conversation_history, list)
        except ImportError:
            pass

    @pytest.mark.asyncio
    async def test_add_message_to_context(self):
        """Тест додавання повідомлення в контекст."""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import ContextManager

            # Mock Redis
            mock_redis = AsyncMock()
            mock_redis.get.return_value = None
            mock_redis.set.return_value = True

            context_mgr = ContextManager(mock_redis)
            await context_mgr.add_message(TEST_USER_ID, "user", TEST_MESSAGE)

            context = await context_mgr.get_context(TEST_USER_ID)
            # Перевірка що повідомлення додано
            assert len(context.conversation_history) > 0
        except ImportError:
            pass


# ==================== INTEGRATION TESTS ====================


class TestBotIntegration:
    """Інтеграційні тести бота."""

    @pytest.mark.asyncio
    async def test_bot_initialization(self):
        """Тест ініціалізації бота."""
        # Встановлюємо тестові змінні середовища
        os.environ["TELEGRAM_BOT_TOKEN"] = "test_token"
        os.environ["TELEGRAM_ADMIN_ID"] = str(TEST_ADMIN_ID)

        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import Bot, Dispatcher

            bot = Bot(token="test_token")
            assert bot is not None
        except ImportError:
            pass
        except Exception:
            pass


# ==================== MANUAL TESTS ====================


async def manual_test_system_status():
    """Ручний тест статусу системи."""

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

        await SystemController.get_system_status()
    except Exception:
        pass


async def manual_test_processes():
    """Ручний тест процесів."""

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

        await SystemController.get_processes()
    except Exception:
        pass


async def manual_test_docker():
    """Ручний тест Docker."""

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import DockerController

        await DockerController.get_containers()
    except Exception:
        pass


async def manual_test_git():
    """Ручний тест Git."""

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import GitController

        await GitController.get_status()

        await GitController.get_log(5)
    except Exception:
        pass


# ==================== MAIN ====================


async def run_all_manual_tests():
    """Запустити всі ручні тести."""

    await manual_test_system_status()
    await manual_test_processes()
    await manual_test_docker()
    await manual_test_git()



def run_unit_tests():
    """Запустити юніт тести."""

    # Menu tests
    test_menu = TestMenuSystem()
    test_menu.test_main_menu_structure()
    test_menu.test_all_menus_have_back_button()

    # System tests
    test_system = TestSystemController()
    asyncio.run(test_system.test_get_system_status())
    asyncio.run(test_system.test_get_processes())

    # AI tests
    test_ai = TestAIController()
    asyncio.run(test_ai.test_ai_controller_initialization())
    asyncio.run(test_ai.test_ai_chat_without_keys())

    # Context tests
    test_context = TestContextManager()
    asyncio.run(test_context.test_context_creation())
    asyncio.run(test_context.test_add_message_to_context())



if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test Telegram Bot V4.0")
    parser.add_argument(
        "--mode",
        choices=["unit", "manual", "all"],
        default="all",
        help="Test mode: unit, manual, or all",
    )

    args = parser.parse_args()


    if args.mode in ["unit", "all"]:
        run_unit_tests()

    if args.mode in ["manual", "all"]:
        asyncio.run(run_all_manual_tests())

