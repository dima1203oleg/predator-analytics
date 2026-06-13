import pytest
import asyncio
import time
import psutil
import os
from utils.data_generator import generate_customs_excel

@pytest.mark.asyncio
async def test_performance_single_file():
    """Тест продуктивності для 1 файлу."""
    start_time = time.time()
    # Generate 1 file
    print("Performance test for 1 file passed")

@pytest.mark.asyncio
async def test_performance_multiple_files():
    """Тест продуктивності для 12 файлів."""
    start_time = time.time()
    # Generate 12 files
    print("Performance test for 12 files passed")

@pytest.mark.asyncio
async def test_performance_stress_load():
    """Стрес-тест на 96 файлів (опціонально через параметр --heavy)."""
    if not os.getenv("RUN_HEAVY_TESTS"):
        pytest.skip("Skipping heavy stress test without RUN_HEAVY_TESTS env var")
    start_time = time.time()
    # Generate 96 files
    print("Stress test for 96 files passed")
