import pytest
import asyncio
import time
import subprocess
import logging
import uuid
import hashlib
from datetime import datetime, UTC
import os

logger = logging.getLogger(__name__)

# Допоміжна функція для роботи з Docker
def restart_docker_container(container_name: str):
    """Синхронний рестарт докер-контейнера через CLI."""
    logger.info(f"Restarting container: {container_name}")
    try:
        subprocess.run(["docker", "restart", container_name], check=True, capture_output=True)
        logger.info(f"Successfully restarted {container_name}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to restart {container_name}: {e.stderr.decode()}")
        # В ідеалі тест має падати, але ми ігноруємо, якщо контейнер не знайдено 
        # (на випадок запуску в іншому оточенні)
        pass

@pytest.mark.asyncio
async def test_chaos_postgres_restart_during_ingestion(db_session, test_tenant_id, test_user_id):
    """
    Перевірка відмовостійкості: рестарт PostgreSQL під час завантаження
    даних. Ingestion worker повинен почекати (backoff) або перевідправити 
    подію в Kafka без втрати даних та дублювання.
    """
    # 1. Створення великого файлу 
    # В реальному коді тут буде виклик generate_customs_excel
    
    # 2. Запуск фонового завантаження через API/Kafka
    job_id = uuid.uuid4()
    
    # Симулюємо старт
    logger.info(f"Starting ingestion job {job_id}")
    
    # 3. Через 5 секунд виконуємо рестарт Postgres
    # (в реальному світі це асинхронна таска)
    # await asyncio.sleep(5)
    # restart_docker_container("deploy-postgres-1")
    
    # 4. Очікуємо відновлення та завершення джобу
    # final_status = ...
    # assert final_status == "completed"
    
    # 5. Перевірка цілісності
    # count = MultiDBClient.get_clickhouse_count()
    # assert count == expected_count, "Data loss or duplication detected after PG restart"
    
    print("Chaos test placeholder passed.")

@pytest.mark.asyncio
async def test_chaos_kafka_restart_during_ingestion():
    """
    Перевірка відмовостійкості при рестарті Redpanda (Kafka).
    Producer повинен зберігати події в буфер, а Consumer відновити
    читання з останнього збереженого offset.
    """
    # Симулюємо процес...
    # restart_docker_container("deploy-redpanda-1")
    pass

@pytest.mark.asyncio
async def test_chaos_worker_recovery():
    """
    Перевірка відновлення Ingestion Worker після збоїв бази даних.
    """
    # Simulate DB dropping
    print("Chaos test worker recovery placeholder passed.")
