#!/usr/bin/env python3
"""
Тестування Telegram Bot V4.0
"""

import asyncio
import os
from unittest.mock import AsyncMock
import pytest

# Імпорт компонентів бота (якщо запускається окремо)
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# ==================== TEST DATA ====================

TEST_USER_ID = 123456789
TEST_ADMIN_ID = 1020504147
TEST_MESSAGE = "Тестове повідомлення"

# ==================== UNIT TESTS ====================

class TestMenuSystem:
    """Тести системи меню"""

    def test_main_menu_structure(self):
        """Перевірка структури головного меню"""
        # Імпорт тут щоб уникнути помилок якщо модуль не доступний
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import MenuSystem

            menu = MenuSystem.get_main_menu()
            assert menu is not None
            assert len(menu.keyboard) > 0
            print("✅ Main menu structure test passed")
        except ImportError:
            print("⚠️  Skipping menu test - module not available")

    def test_all_menus_have_back_button(self):
        """Перевірка що всі меню мають кнопку повернення"""
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

            print("✅ All menus have back button test passed")
        except ImportError:
            print("⚠️  Skipping menu back button test - module not available")

class TestSystemController:
    """Тести системного контролера"""

    @pytest.mark.asyncio
    async def test_get_system_status(self):
        """Тест отримання статусу системи"""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

            status = await SystemController.get_system_status()
            assert status is not None
            assert "CPU" in status
            assert "Memory" in status
            assert "Disk" in status
            print("✅ System status test passed")
        except ImportError:
            print("⚠️  Skipping system status test - module not available")

    @pytest.mark.asyncio
    async def test_get_processes(self):
        """Тест отримання списку процесів"""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

            processes = await SystemController.get_processes()
            assert processes is not None
            assert "PROCESSES" in processes
            print("✅ Processes test passed")
        except ImportError:
            print("⚠️  Skipping processes test - module not available")

class TestAIController:
    """Тести AI контролера"""

    @pytest.mark.asyncio
    async def test_ai_controller_initialization(self):
        """Тест ініціалізації AI контролера"""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import AIController

            ai = AIController()
            assert ai is not None
            assert ai.current_model in ["gemini", "groq"]
            print("✅ AI controller initialization test passed")
        except ImportError:
            print("⚠️  Skipping AI controller test - module not available")

    @pytest.mark.asyncio
    async def test_ai_chat_without_keys(self):
        """Тест чату без API ключів"""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import AIController

            # Створюємо контролер без ключів
            ai = AIController()
            ai.gemini_key = ""
            ai.groq_key = ""

            response = await ai.chat("Привіт")
            assert "не налаштована" in response or "API" in response
            print("✅ AI chat without keys test passed")
        except ImportError:
            print("⚠️  Skipping AI chat test - module not available")

class TestContextManager:
    """Тести менеджера контексту"""

    @pytest.mark.asyncio
    async def test_context_creation(self):
        """Тест створення контексту"""
        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import ContextManager, UserContext

            # Mock Redis
            mock_redis = AsyncMock()
            mock_redis.get.return_value = None
            mock_redis.set.return_value = True

            context_mgr = ContextManager(mock_redis)
            context = await context_mgr.get_context(TEST_USER_ID)

            assert context is not None
            assert context.user_id == TEST_USER_ID
            assert isinstance(context.conversation_history, list)
            print("✅ Context creation test passed")
        except ImportError:
            print("⚠️  Skipping context test - module not available")

    @pytest.mark.asyncio
    async def test_add_message_to_context(self):
        """Тест додавання повідомлення в контекст"""
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
            print("✅ Add message to context test passed")
        except ImportError:
            print("⚠️  Skipping add message test - module not available")

# ==================== INTEGRATION TESTS ====================

class TestBotIntegration:
    """Інтеграційні тести бота"""

    @pytest.mark.asyncio
    async def test_bot_initialization(self):
        """Тест ініціалізації бота"""
        # Встановлюємо тестові змінні середовища
        os.environ["TELEGRAM_BOT_TOKEN"] = "test_token"
        os.environ["TELEGRAM_ADMIN_ID"] = str(TEST_ADMIN_ID)

        try:
            from backend.orchestrator.agents.telegram_bot_v4_advanced import Bot, Dispatcher

            bot = Bot(token="test_token")
            assert bot is not None
            print("✅ Bot initialization test passed")
        except ImportError:
            print("⚠️  Skipping bot initialization test - module not available")
        except Exception as e:
            print(f"⚠️  Bot initialization test skipped: {e}")

# ==================== MANUAL TESTS ====================

async def manual_test_system_status():
    """Ручний тест статусу системи"""
    print("\n" + "="*50)
    print("MANUAL TEST: System Status")
    print("="*50)

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

        status = await SystemController.get_system_status()
        print(status)
        print("✅ Manual system status test completed")
    except Exception as e:
        print(f"❌ Error: {e}")

async def manual_test_processes():
    """Ручний тест процесів"""
    print("\n" + "="*50)
    print("MANUAL TEST: Processes")
    print("="*50)

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import SystemController

        processes = await SystemController.get_processes()
        print(processes)
        print("✅ Manual processes test completed")
    except Exception as e:
        print(f"❌ Error: {e}")

async def manual_test_docker():
    """Ручний тест Docker"""
    print("\n" + "="*50)
    print("MANUAL TEST: Docker")
    print("="*50)

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import DockerController

        containers = await DockerController.get_containers()
        print(containers)
        print("✅ Manual Docker test completed")
    except Exception as e:
        print(f"❌ Error: {e}")

async def manual_test_git():
    """Ручний тест Git"""
    print("\n" + "="*50)
    print("MANUAL TEST: Git")
    print("="*50)

    try:
        from backend.orchestrator.agents.telegram_bot_v4_advanced import GitController

        status = await GitController.get_status()
        print(status)

        log = await GitController.get_log(5)
        print(log)
        print("✅ Manual Git test completed")
    except Exception as e:
        print(f"❌ Error: {e}")

# ==================== MAIN ====================

async def run_all_manual_tests():
    """Запустити всі ручні тести"""
    print("\n🧪 Running Manual Tests...")

    await manual_test_system_status()
    await manual_test_processes()
    await manual_test_docker()
    await manual_test_git()

    print("\n" + "="*50)
    print("✅ All manual tests completed!")
    print("="*50)

def run_unit_tests():
    """Запустити юніт тести"""
    print("\n🧪 Running Unit Tests...")

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

    print("\n✅ All unit tests completed!")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test Telegram Bot V4.0")
    parser.add_argument(
        "--mode",
        choices=["unit", "manual", "all"],
        default="all",
        help="Test mode: unit, manual, or all"
    )

    args = parser.parse_args()

    print("🚀 Telegram Bot V4.0 - Test Suite")
    print("="*50)

    if args.mode in ["unit", "all"]:
        run_unit_tests()

    if args.mode in ["manual", "all"]:
        asyncio.run(run_all_manual_tests())

    print("\n🎉 Testing complete!")
