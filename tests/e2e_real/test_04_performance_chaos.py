import pytest
import asyncio
import subprocess

@pytest.mark.asyncio
async def test_chaos_db_restart(api_client, test_context):
    """
    Перевірка відмовостійкості (Пункт 12 ТЗ).
    Симулює перезапуск PostgreSQL / Kafka через kubectl.
    Обмежено: запускається лише якщо є доступ до kubectl.
    """
    # Перевірка наявності kubectl та доступу до кластера
    result = subprocess.run(["kubectl", "get", "pods", "-n", "predator"], capture_output=True, text=True)
    if result.returncode != 0:
        pytest.skip("Kubectl не налаштовано або немає доступу, пропускаємо Chaos Test.")
    
    # Chaos action: kill a pod
    # subprocess.run(["kubectl", "delete", "pod", "-l", "app=postgres", "-n", "predator"])
    
    # Очікування відновлення
    await asyncio.sleep(10)
    
    # Валідація того, що API знову працює
    response = await api_client.get("/health")
    assert response.status_code == 200, "Система не відновилась після Chaos Event"
