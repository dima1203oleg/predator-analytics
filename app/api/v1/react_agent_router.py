"""
ReAct Agent Router для PREDATOR Analytics v56.5-ELITE
API endpoint для взаємодії з ReAct агентом.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger("predator.react_agent")

router = APIRouter(prefix="/api/v1/react-agent", tags=["ReAct Agent"])


class AgentQueryRequest(BaseModel):
    """Запит до ReAct агента."""
    query: str = Field(description="Запит користувача природною мовою")
    max_iterations: Optional[int] = Field(default=5, description="Максимальна кількість ітерацій самокорекції")


class AgentQueryResponse(BaseModel):
    """Відповідь від ReAct агента."""
    answer: str
    thought_process: list[str]
    cypher_queries: list[str]
    iterations: int
    status: str
    timestamp: str


@router.post("/query", response_model=AgentQueryResponse)
async def agent_query(request: AgentQueryRequest):
    """
    Обробка запиту через ReAct агента.
    
    Args:
        request: Запит до агента
        
    Returns:
        AgentQueryResponse: Відповідь від агента
    """
    try:
        # Імпорт та ініціалізація агента
        from libs.core.autonomy.react_agent import ReActAgent, create_react_agent, ReAgentConfig
        from app.core.settings import get_settings
        
        settings = get_settings()
        
        # Конфігурація агента
        config = ReAgentConfig(
            neo4j_uri=settings.NEO4J_URI,
            neo4j_user=settings.NEO4J_USER,
            neo4j_password=settings.NEO4J_PASSWORD,
            llm_model_path=settings.LLM_MODEL_PATH,
            max_iterations=request.max_iterations
        )
        
        # Створення агента
        agent = await create_react_agent(config)
        
        # Виконання ReAct Loop
        result = await agent.react_loop(request.query)
        
        return AgentQueryResponse(**result)
        
    except Exception as e:
        logger.error(f"Помилка виконання запиту агента: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tools")
async def list_tools():
    """
    Отримання списку доступних інструментів агента.
    
    Returns:
        dict: Список доступних інструментів
    """
    try:
        from libs.core.autonomy.tool_calling import get_tool_registry
        
        registry = get_tool_registry()
        tools = registry.list_tools()
        
        return {
            "tools": tools,
            "count": len(tools)
        }
        
    except Exception as e:
        logger.error(f"Помилка отримання списку інструментів: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ToolCallRequest(BaseModel):
    """Запит для виклику інструмента."""
    tool_name: str = Field(description="Назва інструмента")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Параметри інструмента")


@router.post("/tools/call")
async def call_tool(request: ToolCallRequest):
    """
    Виклик інструмента агента.
    
    Args:
        request: Запит для виклику інструмента
        
    Returns:
        dict: Результат виконання інструмента
    """
    try:
        from libs.core.autonomy.tool_calling import get_tool_registry
        from app.core.settings import get_settings
        from libs.core.autonomy.neo4j_client import get_neo4j_client
        from app.core.database import get_postgres_client
        
        settings = get_settings()
        
        registry = get_tool_registry()
        
        # Отримання клієнтів
        neo4j_client = await get_neo4j_client(settings)
        postgres_client = await get_postgres_client(settings)
        
        # Виклик інструмента
        result = await registry.call_tool(
            tool_name=request.tool_name,
            parameters=request.parameters,
            neo4j_client=neo4j_client,
            postgres_client=postgres_client
        )
        
        return {
            "tool_name": request.tool_name,
            "result": result,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Помилка виклику інструмента: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class VectorRouterRequest(BaseModel):
    """Запит для Vector Semantic Router."""
    query: str = Field(description="Запит користувача")
    limit: Optional[int] = Field(default=5, description="Кількість схожих розслідувань")
    score_threshold: Optional[float] = Field(default=0.7, description="Поріг схожості")


@router.post("/vector-router/route")
async def vector_route(request: VectorRouterRequest):
    """
    Пошук схожих розслідувань через Vector Semantic Router.
    
    Args:
        request: Запит для маршрутизації
        
    Returns:
        dict: Контекст з найбільш схожими розслідуваннями
    """
    try:
        from libs.core.autonomy.vector_router import create_vector_router, LocalEmbeddingModel
        from app.core.settings import get_settings
        from libs.core.autonomy.qdrant_client import get_qdrant_client
        
        settings = get_settings()
        
        # Ініціалізація клієнтів
        qdrant_client = await get_qdrant_client(settings)
        embedding_model = LocalEmbeddingModel(settings.EMBEDDING_MODEL_PATH)
        
        # Створення router
        router = create_vector_router(
            qdrant_client=qdrant_client,
            embedding_model=embedding_model,
            collection_name="investigations"
        )
        
        # Виконання маршрутизації
        result = await router.route(
            query=request.query,
            limit=request.limit,
            score_threshold=request.score_threshold
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Помилка маршрутизації: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SaveInvestigationRequest(BaseModel):
    """Запит для збереження розслідування."""
    query: str = Field(description="Запит користувача")
    cypher_query: str = Field(description="Cypher запит")
    result: Any = Field(description="Результат виконання")
    pattern: Optional[str] = Field(default=None, description="Використаний патерн")


@router.post("/vector-router/save")
async def save_investigation(request: SaveInvestigationRequest):
    """
    Збереження контексту розслідування в Qdrant.
    
    Args:
        request: Запит для збереження
        
    Returns:
        dict: Результат збереження
    """
    try:
        from libs.core.autonomy.vector_router import create_vector_router, LocalEmbeddingModel
        from app.core.settings import get_settings
        from libs.core.autonomy.qdrant_client import get_qdrant_client
        
        settings = get_settings()
        
        # Ініціалізація клієнтів
        qdrant_client = await get_qdrant_client(settings)
        embedding_model = LocalEmbeddingModel(settings.EMBEDDING_MODEL_PATH)
        
        # Створення router
        router = create_vector_router(
            qdrant_client=qdrant_client,
            embedding_model=embedding_model,
            collection_name="investigations"
        )
        
        # Збереження розслідування
        await router.save_investigation(
            query=request.query,
            cypher_query=request.cypher_query,
            result=request.result,
            pattern=request.pattern
        )
        
        return {
            "status": "success",
            "message": "Розслідування успішно збережено"
        }
        
    except Exception as e:
        logger.error(f"Помилка збереження розслідування: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vector-router/history")
async def get_investigation_history(limit: int = 10):
    """
    Отримання історії розслідувань.
    
    Args:
        limit: Кількість розслідувань для повернення
        
    Returns:
        dict: Історія розслідувань
    """
    try:
        from libs.core.autonomy.vector_router import create_vector_router, LocalEmbeddingModel
        from app.core.settings import get_settings
        from libs.core.autonomy.qdrant_client import get_qdrant_client
        
        settings = get_settings()
        
        # Ініціалізація клієнтів
        qdrant_client = await get_qdrant_client(settings)
        embedding_model = LocalEmbeddingModel(settings.EMBEDDING_MODEL_PATH)
        
        # Створення router
        router = create_vector_router(
            qdrant_client=qdrant_client,
            embedding_model=embedding_model,
            collection_name="investigations"
        )
        
        # Отримання історії
        history = await router.get_investigation_history(limit=limit)
        
        return {
            "history": history,
            "count": len(history)
        }
        
    except Exception as e:
        logger.error(f"Помилка отримання історії: {e}")
        raise HTTPException(status_code=500, detail=str(e))
