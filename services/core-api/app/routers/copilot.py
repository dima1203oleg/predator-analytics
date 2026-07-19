"""Copilot Router — PREDATOR Analytics v61.0-ELITE.

AI-assistant для аналізу митних даних та ризик-звітів.
Реалізація згідно TZ §2.2.7 з SSE streaming та slash-командами.
"""
from datetime import UTC, datetime
import json
import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, get_tenant_id
from app.services.ai_service import AIService
from app.services.valkey_service import get_valkey_service
from predator_common.models import Anomaly, Company, RiskScore

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
    model: str | None = None
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
    redis = get_valkey_service()
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

    response_text = await AIService.chat_completion(messages, model=payload.model)

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
            response_text = await AIService.chat_completion(messages, model=payload.model)

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
    redis = get_valkey_service()
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

    redis = get_valkey_service()
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
    redis = get_valkey_service()
    success = await redis.delete_session(session_id)

    return {"deleted": success, "session_id": session_id}


# ======================== АНАЛІТИЧНІ КОМАНДИ ========================

class AnalyzeRequest(BaseModel):
    """Запит для глибокого аналізу компанії."""
    query: str                          # ЄДРПОУ, назва або довільний текст
    command: str = "analyze"            # тип команди: analyze, risk, sanctions, graph
    session_id: str | None = None
    model: str | None = None


@router.post("/analyze", summary="Глибокий аналіз компанії (slash-команди)")
async def copilot_analyze(
    payload: AnalyzeRequest,
    user: dict = Depends(get_current_active_user),
    tenant_id: Annotated[str, Depends(get_tenant_id)] = "",
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> StreamingResponse:
    """Контекстно-збагачений аналіз компанії з реальними даними з БД.

    Підтримує slash-команди: /analyze, /risk, /sanctions, /graph.
    Автоматично підтягує дані з PostgreSQL та формує AI-контекст.
    """
    query = payload.query.strip()
    message_id = str(uuid.uuid4())

    # ─── Збір реальних даних з БД ─────────────────────────────────────────
    company_context = ""
    if db:
        # Шукаємо по ЄДРПОУ або назві
        stmt = select(Company).where(
            Company.tenant_id == tenant_id,
            (Company.edrpou.ilike(f"%{query}%")) | (Company.name.ilike(f"%{query}%"))
        ).limit(1)
        company = await db.scalar(stmt)

        if company:
            # Ризик-профіль
            risk = await db.scalar(
                select(RiskScore).where(
                    RiskScore.tenant_id == tenant_id,
                    RiskScore.entity_ueid == company.ueid,
                )
            )
            # Аномалії
            anomaly_result = await db.execute(
                select(Anomaly).where(
                    Anomaly.tenant_id == tenant_id,
                    Anomaly.entity_ueid == company.ueid,
                ).order_by(Anomaly.detected_at.desc()).limit(5)
            )
            anomalies = anomaly_result.scalars().all()

            company_context = f"""
=== ДАНІ З PREDATOR БД ===
Компанія: {company.name}
ЄДРПОУ: {company.edrpou}
Статус: {company.status}
Галузь: {company.industry}
Адреса: {company.address}
CERS Risk Score: {risk.cers if risk else company.cers_score}/100
Поведінковий ризик: {risk.behavioral_score if risk else "N/A"}
Структурний ризик: {risk.structural_score if risk else "N/A"}
Прапорці ризику: {', '.join(risk.flags) if risk and risk.flags else "відсутні"}
Останні аномалії: {', '.join([a.message for a in anomalies]) if anomalies else "не виявлено"}
========================
"""

    # ─── Вибір системного промпту за командою ─────────────────────────────
    command_prompts: dict[str, str] = {
        "analyze": f"""Ти — PREDATOR Copilot, елітний аналітик митної розвідки України.
{company_context}
Зроби глибокий OSINT-аналіз. Структура звіту:
1. **Ідентифікація** — хто є суб'єкт, основні реквізити
2. **Ризик-профіль** — CERS, поведінкові та структурні ризики
3. **Зв'язки** — пов'язані компанії, директори, власники
4. **Тривожні сигнали** — конкретні аномалії та підозрілі патерни
5. **Рекомендації** — що перевірити далі""",

        "risk": f"""Ти — PREDATOR Risk Engine, спеціаліст з оцінки ризиків.
{company_context}
Розрахуй детальний Risk Score. Структура:
1. **Загальна оцінка** (0–100) з обґрунтуванням
2. **Компоненти ризику** — CERS, поведінковий, інституційний, структурний
3. **Санкційна близькість** — прямі/непрямі зв'язки
4. **Аномалії** — конкретні знахідки
5. **Висновок** — рекомендація (моніторинг/перевірка/блокування)""",

        "sanctions": f"""Ти — PREDATOR Sanctions Analyst.
{company_context}
Проведи санкційну перевірку. Структура звіту:
1. **Прямі санкції** — РНБО, OFAC SDN, EU, UK OFSI
2. **Непрямі зв'язки** — через пов'язаних осіб
3. **Рівень ризику** — ступінь санкційної загрози
4. **Докази** — конкретні записи/посилання
5. **Рекомендація** — статус комплаєнсу""",

        "graph": f"""Ти — PREDATOR Graph Intelligence, спеціаліст з мережевого аналізу.
{company_context}
Проаналізуй мережу зв'язків. Структура:
1. **Ядро мережі** — центральний суб'єкт та прямі зв'язки
2. **Корпоративна структура** — власники, директори, засновники
3. **Виявлені кластери** — групи пов'язаних компаній
4. **Підозрілі патерни** — циклічні зв'язки, офшорні структури
5. **Граф-маршрут** — шлях до кінцевого бенефіціара""",
    }

    system_content = command_prompts.get(payload.command, command_prompts["analyze"])

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": f"Проаналізуй: {query}"}
    ]

    async def generate_sse():
        yield f"event: thinking\ndata: {json.dumps({'status': 'gathering_intelligence', 'has_db_data': bool(company_context)})}\n\n"

        try:
            response_text = await AIService.chat_completion(messages, model=payload.model)
            words = response_text.split()
            chunk_size = 8

            for i in range(0, len(words), chunk_size):
                chunk = " ".join(words[i:i + chunk_size])
                yield f"event: chunk\ndata: {json.dumps({'text': chunk + ' ', 'type': 'chunk'})}\n\n"

            sources = []
            if company_context:
                sources.append({"type": "predator_db", "title": f"PREDATOR DB: {query}", "relevance": 1.0})
            sources.append({"type": "ai_analysis", "title": "AI Deep Analysis", "relevance": 0.9})

            yield f"event: sources\ndata: {json.dumps(sources)}\n\n"
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


@router.get("/sessions")
async def list_sessions(
    user: dict = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Список всіх copilot сесій."""
    redis = get_valkey_service()
    user_id = user.get("sub")
    sessions = await redis.list_sessions(user_id) if hasattr(redis, "list_sessions") else []
    return {"sessions": sessions or []}

class AgentQueryRequest(BaseModel):
    query: str

@router.post("/react-agent/query", summary="ReAct Agent Query (Chain of Thought)")
async def react_agent_query(
    payload: AgentQueryRequest,
    user: dict = Depends(get_current_active_user),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Mock endpoint for Sovereign Command Center.
    Returns thought process and answer.
    """
    import asyncio
    # Simulate processing delay
    await asyncio.sleep(1)
    
    # In a real scenario, this would use LangChain or native LLM ReAct loop.
    return {
        "thought_process": [
            "Агент аналізує запит...",
            f"Викликано інструмент: search_graph_anomaly(pattern='{payload.query}')",
            "Отримано результати. Виявлено підозрілі зв'язки.",
            "Формування фінального звіту..."
        ],
        "answer": "За результатами аналізу виявлено потенційні ризики. Компанія має ознаки фіктивності та приховані зв'язки з офшорними юрисдикціями. Рекомендується провести додаткову перевірку бенефіціарів."
    }
