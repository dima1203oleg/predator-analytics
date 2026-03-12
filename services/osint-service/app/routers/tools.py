"""Tools Router — управління OSINT інструментами."""
from fastapi import APIRouter

from app.tools import get_tool_registry

router = APIRouter(prefix="/tools", tags=["OSINT Tools"])


@router.get("/")
async def list_tools():
    """Список всіх доступних OSINT інструментів.

    Returns:
        Список інструментів з метаданими
    """
    registry = get_tool_registry()
    return {
        "tools": registry.list_tools(),
        "total": len(registry.tool_names),
    }


@router.get("/availability")
async def check_tools_availability():
    """Перевірка доступності всіх інструментів.

    Returns:
        Словник {tool_name: is_available}
    """
    registry = get_tool_registry()
    availability = await registry.check_availability()

    available_count = sum(1 for v in availability.values() if v)
    total_count = len(availability)

    return {
        "availability": availability,
        "available_count": available_count,
        "total_count": total_count,
        "status": "healthy" if available_count > total_count // 2 else "degraded",
    }


@router.get("/{tool_name}")
async def get_tool_info(tool_name: str):
    """Інформація про конкретний інструмент.

    Args:
        tool_name: Назва інструменту

    Returns:
        Метадані інструменту
    """
    registry = get_tool_registry()
    tool = registry.get(tool_name)

    if not tool:
        return {"error": f"Інструмент '{tool_name}' не знайдено"}

    is_available = await tool.is_available()

    return {
        **tool.get_info(),
        "is_available": is_available,
    }


@router.get("/category/{category}")
async def get_tools_by_category(category: str):
    """Інструменти за категорією.

    Args:
        category: Категорія (domain, person, file, etc.)

    Returns:
        Список інструментів
    """
    registry = get_tool_registry()
    tools = registry.get_by_category(category)

    return {
        "category": category,
        "tools": [t.get_info() for t in tools],
        "count": len(tools),
    }


@router.get("/target/{target_type}")
async def get_tools_by_target(target_type: str):
    """Інструменти за типом цілі.

    Args:
        target_type: Тип цілі (domain, username, email, file, etc.)

    Returns:
        Список інструментів
    """
    registry = get_tool_registry()
    tools = registry.get_by_target(target_type)

    return {
        "target_type": target_type,
        "tools": [t.get_info() for t in tools],
        "count": len(tools),
    }
