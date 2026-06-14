import pytest
import os
import aiohttp
import hashlib

API_BASE_URL = os.getenv("PREDATOR_API_URL", "http://localhost:8000/api/v1")
TEST_FILE_PATH = os.getenv("EXCEL_TEST_FILE", "/Users/dima1203/Desktop/Березень_2024.xlsx")

pytestmark = pytest.mark.asyncio

async def calculate_file_hash(filepath: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

@pytest.mark.e2e
async def test_stage2_file_acceptance():
    """
    Етап 2: Перевірка приймання файлу (API & Storage)
    - перевірити його структуру
    - перевірити кодування та типи даних
    - обчислити контрольну суму
    - зберегти оригінал без модифікацій
    - створити запис аудиту про імпорт
    """
    if not os.path.exists(TEST_FILE_PATH):
        pytest.skip(f"Тестовий файл {TEST_FILE_PATH} не знайдено.")

    file_hash = await calculate_file_hash(TEST_FILE_PATH)

    async with aiohttp.ClientSession() as session:
        with open(TEST_FILE_PATH, 'rb') as f:
            data = aiohttp.FormData()
            data.add_field('file', f, filename=os.path.basename(TEST_FILE_PATH))
            
            # Відправляємо файл на Ingestion API
            async with session.post(f"{API_BASE_URL}/ingestion/upload", data=data) as resp:
                assert resp.status in (200, 202), f"Upload failed with status {resp.status}"
                result = await resp.json()
                
                # Перевіряємо контрольні суми
                assert "file_hash" in result or "checksum" in result
                if "file_hash" in result:
                    assert result["file_hash"] == file_hash
                
                # Зберігаємо ID джоби для перевірки ETL
                os.environ["CURRENT_JOB_ID"] = result.get("job_id", "")

@pytest.mark.e2e
async def test_stage3_etl_pipeline():
    """
    Етап 3: Перевірка ETL
    - читання всіх аркушів
    - очищення даних
    - нормалізацію форматів
    - дедуплікацію
    - валідацію схеми
    - журналювання кожної стадії
    """
    job_id = os.environ.get("CURRENT_JOB_ID")
    if not job_id:
        pytest.skip("Немає JOB_ID з попереднього етапу.")

    async with aiohttp.ClientSession() as session:
        # Чекаємо завершення ETL (polling)
        max_retries = 30
        for _ in range(max_retries):
            async with session.get(f"{API_BASE_URL}/ingestion/jobs/{job_id}") as resp:
                status_data = await resp.json()
                if status_data.get("status") == "COMPLETED":
                    break
                elif status_data.get("status") == "FAILED":
                    pytest.fail(f"ETL Job failed: {status_data}")
            import asyncio
            await asyncio.sleep(5)
        
        # Перевіряємо метадані після ETL
        assert status_data.get("status") == "COMPLETED"
        assert status_data.get("sheets_processed", 0) > 0
        assert status_data.get("rows_processed", 0) > 0
        assert status_data.get("duplicates_removed") is not None
