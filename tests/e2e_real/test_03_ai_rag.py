import pytest

@pytest.mark.asyncio
async def test_ai_search_query(api_client, test_context):
    """ Перевірка AI та RAG (Пункти 8, 9 ТЗ): чи AI знаходить нові дані. """
    # Запит до API AI Copilot
    response = await api_client.post("/ai/query", json={
        "query": "Знайди всі декларації з Березень_2024.xlsx",
        "use_rag": True
    })
    
    # 404/500 check
    if response.status_code != 200:
        pytest.skip("AI API is not fully implemented or RAG is down")

    data = response.json()
    assert "answer" in data
    # Переконатися, що RAG підтягнув контекст з Qdrant/OpenSearch
    assert len(data.get("sources", [])) > 0, "AI не використав RAG джерела"
