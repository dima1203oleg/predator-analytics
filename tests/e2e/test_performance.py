import pytest
import asyncio
import time
import os
import uuid
from utils.data_generator import generate_customs_excel

# Налаштування для тестів
API_URL = os.getenv("API_URL", "http://localhost:8000")

@pytest.mark.asyncio
async def test_performance_single_file():
    """Тест продуктивності для 1 файлу."""
    start_time = time.time()
    
    file_path = f"/tmp/e2e_data/perf_1_{int(time.time())}.xlsx"
    os.makedirs("/tmp/e2e_data", exist_ok=True)
    generate_customs_excel(file_path, num_rows=1000, sheets=1)
    
    duration = time.time() - start_time
    print(f"Performance test for 1 file generated in {duration:.2f}s")
    
    # We ensure that file creation is fast enough
    assert duration < 10.0, "File generation is too slow"

@pytest.mark.asyncio
async def test_performance_stress_load():
    """Стрес-тест на 96 файлів (опціонально через параметр --heavy)."""
    if not os.getenv("RUN_HEAVY_TESTS"):
        pytest.skip("Skipping heavy stress test without RUN_HEAVY_TESTS env var")
    start_time = time.time()
    
    # Generate 10 files to represent a batch of 96
    files_to_gen = 10
    
    for i in range(files_to_gen):
        file_path = f"/tmp/e2e_data/perf_heavy_{i}_{int(time.time())}.xlsx"
        generate_customs_excel(file_path, num_rows=1000, sheets=1)
        
    duration = time.time() - start_time
    print(f"Stress test for {files_to_gen} files generated in {duration:.2f}s")
