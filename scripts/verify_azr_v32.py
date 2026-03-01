from __future__ import annotations

import asyncio
import os
import sys
from unittest.mock import MagicMock


# Add project root to path
sys.path.append(os.getcwd())

# --- CRITICAL: MOCK DEPENDENCIES TO BYPASS PYTHON VERSION ISSUES ---
# Since local env is 3.9 but code uses 3.10+ syntax in libs.core,
# we mock libs.core completely to verify ONLY the business logic of AZR.

# Mock libs.core hierarchy
sys.modules["libs"] = MagicMock()
sys.modules["libs.core"] = MagicMock()
sys.modules["libs.core.structured_logger"] = MagicMock()

# Setup Logger Mocks
mock_logger = MagicMock()
sys.modules["libs.core.structured_logger"].get_logger = MagicMock(return_value=mock_logger)
sys.modules["libs.core.structured_logger"].log_business_event = MagicMock()
sys.modules["libs.core.structured_logger"].log_security_event = MagicMock()

# Mock other potential dependencies if needed
sys.modules["app.services.auth_service"] = MagicMock()

# Set environment variables
os.environ["TELEGRAM_BOT_TOKEN"] = "mock_token"
os.environ["TELEGRAM_ADMIN_ID"] = "123456"
os.environ["AZR_ROOT"] = "/tmp/predator_test"

# ------------------------------------------------------------------

import logging


logging.basicConfig(level=logging.INFO, format='%(message)s')

async def test_azr_logic():
    print("🧠 Ініціалізація двигуна AZR v32 для верифікації (Mock середовище)...")

    try:
        # Спробувати прямий імпорт
        from services.api_gateway.app.services.azr_engine_v32 import AZREngineV32
    except ImportError:
        # Налаштування шляху для імпорту
        sys.path.append(os.path.join(os.getcwd(), 'services/api_gateway'))
        from app.services.azr_engine_v32 import AZREngineV32

    # Ініціалізація
    engine = AZREngineV32(project_root="/tmp/predator_test")

    # Mock Telegram Sender internal method to see output (Async Mock)
    async def mock_network_alert(msg, level="info"):
        print(f"📧 [MOCK TELEGRAM] {level.upper()}: {msg.splitlines()[0]}...")

    engine._send_telegram_alert = MagicMock(side_effect=mock_network_alert)

    print("\n🧪 Тест 1: Виявлення аномалій")
    # Подача нормальних даних
    print("   Подача нормальних даних (CPU ~40%)...")
    for _ in range(20):
        engine.anomaly_detector.add_observation({"cpu": 40.0, "memory": 50.0, "disk": 30.0})

    # Ін'єкція АНОМАЛІЇ
    print("   💉 Ін'єкція СТРИБКА CPU (99.0%)...")
    anomalous_metrics = {"cpu": 99.0, "memory": 50.0, "disk": 30.0}

    # Запуск детектора
    anomalies = engine.anomaly_detector.detect_anomalies(anomalous_metrics)
    print(f"   Виявлено {len(anomalies)} аномалій.")

    if len(anomalies) > 0:
        a = anomalies[0]
        print(f"   ✅ Аномалію знайдено: {a['metric']} = {a['current_value']} (Z-Score: {a['z_score']:.2f})")
    else:
        print("   ❌ НЕ ВДАЛОСЯ виявити аномалію")

    print("\n🧪 Тест 2: Рішення петлі OODA")
    # Симуляція результату орієнтації
    orientation = {
        "health_status": "degraded",
        "health_score": 50.0,
        "anomalies": anomalies,
        "trends": {},
        "experience": {},
        "constitutional_violations": 0
    }

    # Виконання фази DECIDE (Рішення)
    actions = await engine._decide(orientation)
    print(f"   Прийнято рішення про {len(actions)} дії.")

    anomaly_response = next((a for a in actions if a.type == "ANOMALY_RESPONSE"), None)

    if anomaly_response:
        print("   ✅ Згенеровано дію ANOMALY_RESPONSE")
        # Перевірка виклику mock-сповіщення
        await asyncio.sleep(0.1)
    else:
        print("   ❌ НЕ ВДАЛОСЯ згенерувати відповідь")

    print("\n🧪 Тест 3: Конституційна варта (Guard)")
    from app.services.azr_engine_v32 import AZRAction

    bad_action = AZRAction(type="DELETE_DATA", meta={"has_backup": False})
    print(f"   Тестування забороненої дії: {bad_action.type}")

    approved, reason = await engine.guard.verify_action(bad_action)
    if not approved:
        print(f"   ✅ Дію ЗАБЛОКОВАНО коректно: {reason}")
    else:
        print("   ❌ Дію ДОЗВОЛЕНО (має бути заблоковано)")

    print("\n🧪 Тест 4: Хаос-інжиніринг")
    engine.chaos.enabled = True
    print("   🔥 Активація модуля Хаосу...")

    # Ручне виконання сценарію
    scenario = "network_latency"
    print(f"   Симуляція '{scenario}' (затримка мережі)...")
    result = await engine.chaos._execute_scenario(scenario)

    if result["scenario"] == scenario and result["recovered"]:
        print(f"   ✅ Хаос впроваджено та відновлено за {result['recovery_time_ms']:.2f}мс")
    else:
        print("   ❌ Хаос-ін'єкція не вдалася")

    print("\n🎉 Верифікацію AZR v32 завершено!")

if __name__ == "__main__":
    asyncio.run(test_azr_logic())
