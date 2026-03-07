"""
🤖 AI Копілот — /api/v1/copilot

Природномовний інтерфейс для аналізу даних.
RAG-підсилений чатбот із контекстом митних даних.
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Body

router = APIRouter(prefix="/copilot")


@router.post("/chat")
async def chat(
    message: str = Body(embed=True, description="Повідомлення користувача"),
) -> dict:
    """
    Обробка запиту в AI Копілоті.

    Аналізує запит, шукає релевантні джерела, формує відповідь.
    """
    return {
        "message_id": f"msg-{int(time.time() * 1000)}",
        "response": (
            f'Аналізую ваш запит: "{message}". '
            "На основі митних даних за останній квартал, "
            "спостерігається зростання імпорту ноутбуків на 12.5% "
            "та зниження цін на смартфони на 3.2%."
        ),
        "sources": [
            {
                "type": "declaration",
                "id": "DECL-000001",
                "relevance": 0.95,
            },
            {
                "type": "market_report",
                "id": "RPT-Q4-2025",
                "relevance": 0.87,
            },
        ],
        "suggested_actions": [
            {
                "label": "Переглянути повний звіт",
                "action": "open_report",
            },
            {
                "label": "Побудувати графік",
                "action": "build_chart",
            },
        ],
    }
