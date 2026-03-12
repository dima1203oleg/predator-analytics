"""Copilot Router — PREDATOR Analytics v55.2-SM-EXTENDED.

AI-assistant for analyzing customs data and risk reports.
Реалізація згідно TZ §2.2.7 з SSE streaming.
"""
from datetime import UTC, datetime
import json
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.dependencies import get_current_active_user, get_tenant_id
from app.services.ai_service import AIService
from app.services.redis_service import get_redis_service

router = APIRouter(prefix="/copilot", tags=["ai"])


# ======================== МОДЕЛІ ========================

class ChatContext(BaseModel):
    """Контекст для чату."""

    entity_filter: str | None = None
    date_range: str | None = None


class ChatRequest(BaseModel):
    """Запит до Copilot."""

    session_id: str | None = None
    message: str
    context: ChatContext | None = None
    context_ueid: str | None = None
    history: list[dict[str, str]] = Field(default_factory=list)


class ChatSource(BaseModel):
    """Джерело для відповіді."""

    type: str
    id: str | None = None
    entity: str | None = None
    title: str | None = None
    url: str | None = None
    relevance: float = 0.0


class ChatResponse(BaseModel):
    """Відповідь Copilot (non-streaming)."""

    message_id: str
    reply: str
    sources: list[ChatSource] = Field(default_factory=list)
    tokens_used: int = 0


# ======================== ЕНДПОЇНТИ ========================

@router.post("/chat")
async def copilot_chat(
    payload: ChatRequest,
    user: dict = Depends(get_current_active_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """Інтерактивний AI-асистент. Згідно TZ §2.2.7.

    Підтримує як звичайну відповідь, так і SSE streaming.
    """
    redis = get_redis_service()
    user_id = user.get("sub")

    # Створюємо або отримуємо сесію
    session_id = payload.session_id or str(uuid.uuid4())
    message_id = str(uuid.uuid4())

    # Якщо нова сесія - створюємо в Redis
    if not payload.session_id:
        await redis.create_session(
            session_id=session_id,
            user_id=user_id,
            tenant_id=tenant_id,
            context=payload.context.model_dump() if payload.context else None,
        )

    system_prompt = {
        "role": "system",
        "content": """Ти - PREDATOR Copilot v55.2, елітний аналітик митних даних України.
Твоя ціль - допомагати знаходити корупційні схеми, аномалії та ризики.
Відповідай українською мовою. Будь точним та конкретним.
Використовуй дані з контексту для формування відповідей."""
    }

    # Додаємо контекст якщо є
    context_message = None
    if payload.context:
        context_parts = []
        if payload.context.entity_filter:
            context_parts.append(f"Фільтр сутностей: {payload.context.entity_filter}")
        if payload.context.date_range:
            context_parts.append(f"Діапазон дат: {payload.context.date_range}")
        if context_parts:
            context_message = {"role": "system", "content": f"Контекст запиту: {'; '.join(context_parts)}"}

    messages = [system_prompt]
    if context_message:
        messages.append(context_message)
    messages.extend(payload.history)
    messages.append({"role": "user", "content": payload.message})

    response_text = await AIService.chat_completion(messages)

    # Зберігаємо повідомлення в Redis
    await redis.add_message(session_id, "user", payload.message)
    await redis.add_message(session_id, "assistant", response_text, message_id)

    # Формуємо джерела (спрощена версія)
    sources = []
    if payload.context_ueid:
        sources.append(ChatSource(
            type="entity",
            id=payload.context_ueid,
            entity=payload.context_ueid[:20],
            relevance=0.95,
        ))

    return ChatResponse(
        message_id=message_id,
        reply=response_text,
        sources=sources,
        tokens_used=len(response_text.split()) * 2,
    )


@router.post("/chat/stream")
async def copilot_chat_stream(
    payload: ChatRequest,
    user: dict = Depends(get_current_active_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """SSE streaming версія Copilot. Згідно TZ §2.2.7."""
    payload.session_id or str(uuid.uuid4())
    message_id = str(uuid.uuid4())

    async def generate_sse():
        # Початок - статус thinking
        yield f"event: thinking\ndata: {json.dumps({'status': 'searching_rag_index'})}\n\n"

        system_prompt = {
            "role": "system",
            "content": """Ти - PREDATOR Copilot v55.2, елітний аналітик митних даних України.
Відповідай українською мовою. Будь точним та конкретним."""
        }

        messages = [system_prompt, *payload.history, {"role": "user", "content": payload.message}]

        try:
            response_text = await AIService.chat_completion(messages)

            # Симулюємо streaming по словах
            words = response_text.split()
            chunk_size = 5
            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i + chunk_size])
                yield f"event: chunk\ndata: {json.dumps({'text': chunk + ' '})}\n\n"

            # Джерела
            sources = []
            if payload.context_ueid:
                sources.append({
                    "type": "entity",
                    "id": payload.context_ueid,
                    "relevance": 0.95,
                })
            yield f"event: sources\ndata: {json.dumps(sources)}\n\n"

            # Завершення
            yield f"event: complete\ndata: {json.dumps({'message_id': message_id, 'tokens_used': len(words) * 2})}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/sessions/{session_id}")
async def get_session_history(
    session_id: str,
    user: dict = Depends(get_current_active_user),
    limit: int = 50,
):
    """Отримання історії сесії чату з Redis."""
    redis = get_redis_service()
    session = await redis.get_session(session_id)

    if not session:
        return {
            "session_id": session_id,
            "messages": [],
            "created_at": None,
            "error": "Сесію не знайдено",
        }

    messages = await redis.get_messages(session_id, limit=limit)

    return {
        "session_id": session_id,
        "messages": messages,
        "created_at": session.get("created_at"),
        "updated_at": session.get("updated_at"),
        "message_count": session.get("message_count", 0),
        "context": session.get("context"),
    }


@router.post("/sessions")
async def create_session(
    user: dict = Depends(get_current_active_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """Створення нової copilot сесії."""
    session_id = str(uuid.uuid4())
    user_id = user.get("sub")

    redis = get_redis_service()
    success = await redis.create_session(
        session_id=session_id,
        user_id=user_id,
        tenant_id=tenant_id,
    )

    if not success:
        return {"error": "Не вдалося створити сесію", "session_id": None}

    return {
        "session_id": session_id,
        "created_at": datetime.now(UTC).isoformat(),
    }


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: dict = Depends(get_current_active_user),
):
    """Видалення copilot сесії."""
    redis = get_redis_service()
    success = await redis.delete_session(session_id)

    return {"deleted": success, "session_id": session_id}
