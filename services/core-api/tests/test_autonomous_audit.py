"""🛡️ Тести для контуру Autonomous Sovereign Audit & AutoFix Engine.
PREDATOR ELITE v56.5
"""

from collections.abc import AsyncGenerator
import os
import pytest
from httpx import ASGITransport, AsyncClient

import sys
from unittest.mock import MagicMock

# Mock DatasetGeneratorTrainer before importing app.main to avoid package shadowing imports
class MockDatasetGeneratorTrainer:
    def __init__(self, *args, **kwargs):
        pass
    async def zero_shot(self, *args, **kwargs):
        return {"status": "ok", "generated": 100}
    async def reference_based(self, *args, **kwargs):
        return {"status": "ok", "generated": 100}
    async def hybrid_pipeline(self, *args, **kwargs):
        return {"status": "ok", "generated": 100}

# Create mock module
mock_engine_mod = MagicMock()
mock_engine_mod.DatasetGeneratorTrainer = MockDatasetGeneratorTrainer
sys.modules["services.synthetic_data_engine.app.engine"] = mock_engine_mod

# Mock apscheduler to avoid missing dependencies in sandbox test environment
mock_sched_mod = MagicMock()
sys.modules["apscheduler"] = mock_sched_mod
sys.modules["apscheduler.schedulers"] = mock_sched_mod
sys.modules["apscheduler.schedulers.asyncio"] = mock_sched_mod
sys.modules["apscheduler.triggers"] = mock_sched_mod
sys.modules["apscheduler.triggers.interval"] = mock_sched_mod

from app.main import app
from app.services.autonomous_audit import sovereign_audit_engine, CERTIFICATION_DIR


@pytest.fixture
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    """Фікстура асинхронного тестового клієнта."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


@pytest.mark.asyncio
async def test_audit_engine_execution() -> None:
    """Тестує безпосереднє виконання повного forensic-аудиту двигуном."""
    # Очищуємо стан перед тестом
    sovereign_audit_engine.is_auditing = False
    
    # Виконуємо повний forensic-аудит
    results = await sovereign_audit_engine.execute_full_forensic_audit()
    
    assert results is not None
    assert "audit_id" in results
    assert results["audit_id"].startswith("audit-")
    assert "planes" in results
    assert "integrity_passed" in results
    assert "readiness_status" in results
    
    # Перевірка наявності всіх 9 площин контролю
    required_planes = [
        "visual_interaction",
        "cognitive_ux",
        "infrastructure",
        "access_fabric",
        "data_integrity",
        "etl_intelligence",
        "remediation",
        "localization",
        "certification"
    ]
    for plane in required_planes:
        assert plane in results["planes"]
        assert "status" in results["planes"][plane]
        assert "description" in results["planes"][plane]


@pytest.mark.asyncio
async def test_autofix_pipeline_trigger() -> None:
    """Тестує виконання 10-ступеневого контуру самовідновлення AutoFix."""
    # Очищуємо стан логів перед перевіркою
    sovereign_audit_engine.remediation_logs = []
    
    # Запускаємо контур самолікування для площин інфраструктури та локалізації
    success = await sovereign_audit_engine.trigger_autofix_pipeline(["infrastructure", "localization"])
    
    assert success is True
    assert len(sovereign_audit_engine.remediation_logs) > 0
    
    latest_fix = sovereign_audit_engine.remediation_logs[0]
    assert latest_fix["resolved"] is True
    assert "steps" in latest_fix
    assert len(latest_fix["steps"]) == 10  # 10 детермінованих кроків
    assert "target_planes" in latest_fix
    assert "infrastructure" in latest_fix["target_planes"]


@pytest.mark.asyncio
async def test_certification_artifacts_generation() -> None:
    """Тестує наявність генерованих фізичних Markdown-звітів на диску."""
    # Запускаємо аудит для генерації свіжих файлів
    await sovereign_audit_engine.execute_full_forensic_audit()
    
    # Перевіряємо наявність основних звітів
    required_files = [
        "forensic_audit_report.md",
        "infrastructure_validation_report.md",
        "etl_integrity_report.md",
        "intelligence_pipeline_report.md",
        "rbac_security_report.md",
        "localization_compliance_report.md",
        "ai_stability_report.md",
        "data_consistency_report.md",
        "executive_production_readiness_summary.md",
        "autonomous_remediation_log.md"
    ]
    
    for filename in required_files:
        filepath = os.path.join(CERTIFICATION_DIR, filename)
        assert os.path.exists(filepath) is True
        assert os.path.getsize(filepath) > 0


@pytest.mark.asyncio
async def test_audit_api_endpoints(test_client: AsyncClient) -> None:
    """Тестує інтеграційні FastAPI ендпоїнти через HTTP-клієнт."""
    # Тест запуску аудиту через API
    response = await test_client.get("/api/v1/antigravity/audit/trigger")
    assert response.status_code == 200
    data = response.json()
    assert "audit_id" in data
    assert data["readiness_status"] in ["VALID", "INVALID", "ERROR"]
    
    # Тест отримання списку звітів сертифікації для UI
    response = await test_client.get("/api/v1/antigravity/audit/reports")
    assert response.status_code == 200
    reports = response.json()
    assert isinstance(reports, list)
    assert len(reports) > 0
    
    # Перевіряємо структуру першого звіту
    first_report = reports[0]
    assert "name" in first_report
    assert "title" in first_report
    assert "content" in first_report
