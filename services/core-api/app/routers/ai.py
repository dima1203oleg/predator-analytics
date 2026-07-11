from datetime import UTC, datetime
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.dependencies import get_current_active_user, get_tenant_id
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])

class AIThought(BaseModel):
    id: str
    stage: str
    content: str
    confidence: float
    timestamp: str

class ChatMessage(BaseModel):
    role: str
    content: str
    thought_process: list[AIThought] | None = None

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str | None = None

class ChatChoiceMessage(BaseModel):
    content: str
    thought_process: list[AIThought] | None = None

class ChatChoice(BaseModel):
    message: ChatChoiceMessage

class ChatResponse(BaseModel):
    choices: list[ChatChoice]


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    payload: ChatRequest,
    tenant_id: str = Depends(get_tenant_id),
):
    """Спілкування з Sovereign Intel Hub / Когнітивним Ядром."""
    # Convert messages for AIService
    service_messages = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
    
    # Generate response
    response_text = await AIService.chat_completion(service_messages, model=payload.model)
    
    # Generate thoughts mock or extraction (if real implementation exists, use it, else mock some thoughts)
    thoughts = [
        AIThought(
            id=str(uuid.uuid4()),
            stage="observation",
            content="Аналіз запиту та виділення ключових сутностей.",
            confidence=0.98,
            timestamp=datetime.now(UTC).isoformat()
        ),
        AIThought(
            id=str(uuid.uuid4()),
            stage="analysis",
            content="Пошук аномалій та патернів у графовій базі даних.",
            confidence=0.92,
            timestamp=datetime.now(UTC).isoformat()
        ),
        AIThought(
            id=str(uuid.uuid4()),
            stage="decision",
            content="Формування висновку на основі виявлених факторів ризику.",
            confidence=0.95,
            timestamp=datetime.now(UTC).isoformat()
        )
    ]

    return ChatResponse(
        choices=[
            ChatChoice(
                message=ChatChoiceMessage(
                    content=response_text,
                    thought_process=thoughts
                )
            )
        ]
    )


@router.get("/thoughts", response_model=list[AIThought])
async def get_ai_thoughts(limit: int = 10, tenant_id: str = Depends(get_tenant_id)):
    """Отримати останні думки Когнітивного Ядра."""
    return [
        AIThought(
            id=str(uuid.uuid4()),
            stage="observation",
            content="Сканування потоку імпорту (УКТЗЕД 8517).",
            confidence=0.99,
            timestamp=datetime.now(UTC).isoformat()
        ),
        AIThought(
            id=str(uuid.uuid4()),
            stage="analysis",
            content="Виявлено відхилення митної вартості на 35%.",
            confidence=0.91,
            timestamp=datetime.now(UTC).isoformat()
        )
    ][:limit]


@router.get("/autonomous/status")
async def get_autonomous_status(tenant_id: str = Depends(get_tenant_id)):
    """Отримати статус автономного режиму."""
    return {
        "status": "active",
        "mode": "Sovereign Override",
        "active_agents": 4,
        "load": "14.8%"
    }


@router.get("/council-votes")
async def get_council_votes(tenant_id: str = Depends(get_tenant_id)):
    """Отримати голосування мультиагентної ради."""
    return [
        {"agent": "Risk Engine", "vote": "Block", "confidence": 0.88},
        {"agent": "Compliance", "vote": "Review", "confidence": 0.75},
        {"agent": "Financial", "vote": "Block", "confidence": 0.92}
    ]


@router.get("/bot-logs")
async def get_bot_logs(tenant_id: str = Depends(get_tenant_id)):
    """Отримати логи ботів."""
    return [
        {"timestamp": datetime.now(UTC).isoformat(), "level": "INFO", "message": "Scraper initialized for registry A"},
        {"timestamp": datetime.now(UTC).isoformat(), "level": "WARN", "message": "Rate limit detected, backing off"}
    ]
