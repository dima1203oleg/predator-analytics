import pytest
import os
import aiohttp
import asyncio

API_BASE_URL = os.getenv("PREDATOR_API_URL", "http://localhost:8000/api/v1")
pytestmark = pytest.mark.asyncio

@pytest.mark.e2e
async def test_stage5_vectorization():
    """Етап 5: Перевірка побудови векторних Embeddings"""
    async with aiohttp.ClientSession() as session:
        # Перевірка статусу побудови індексу
        async with session.get(f"{API_BASE_URL}/admin/indices/status") as resp:
            data = await resp.json()
            assert data.get("qdrant_status") == "ok"
            assert data.get("embeddings_queue_size", 0) == 0

@pytest.mark.e2e
async def test_stage6_ai_subsystem_availability():
    """Етап 6: Перевірка доступності DeepSeek/Ollama"""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_BASE_URL}/ai/health") as resp:
            assert resp.status == 200
            data = await resp.json()
            assert data.get("status") == "ok"
            assert "deepseek" in data.get("active_models", "").lower()

@pytest.mark.e2e
async def test_stage7_ai_hallucination_check():
    """
    Етап 7: AI Copilot - Перевірка запитів на основі щойно завантажених даних.
    Робимо серію запитів для перевірки галюцинацій.
    """
    test_queries = [
        "Яка загальна сума митних платежів за березень 2024?",
        "Які компанії імпортували товари в березні 2024?",
        "Знайди аномалії в імпорті за останній місяць."
    ]

    async with aiohttp.ClientSession() as session:
        for q in test_queries:
            payload = {
                "query": q,
                "use_rag": True,
                "strict_mode": True # Режим без галюцинацій (лише на основі контексту)
            }
            async with session.post(f"{API_BASE_URL}/ai/copilot/chat", json=payload) as resp:
                assert resp.status == 200
                data = await resp.json()
                answer = data.get("answer", "")
                
                # Відповідь не має бути порожньою
                assert len(answer) > 10
                
                # AI повинно повертати джерела (references)
                assert len(data.get("sources", [])) > 0
                
                # Заборона використання вигаданих даних
                assert "Я не знайшов інформації" not in answer # Має знайти, бо ми завантажили Березень 2024
            
            await asyncio.sleep(1)
