"""Мінімальний FastAPI web-сервер для health/ready probes та API."""
from __future__ import annotations

import os
from typing import Any, Dict, Optional
from dataclasses import dataclass
from enum import Enum

try:
    from fastapi import FastAPI
    from fastapi.responses import PlainTextResponse
except ImportError:
    FastAPI = None


class APIError(Exception):
    """Помилка API."""

    pass


@dataclass
class APIResponse:
    """Відповідь API."""

    status: str
    data: Any | None = None
    error: str | None = None
    metadata: dict[str, Any] | None = None


class APIServer:
    """REST API сервер для MCP Platform."""

    def __init__(self, host: str = "0.0.0.0", port: int = 8000) -> None:
        """Ініціалізувати API Server.

        Args:
            host: Хост для запуску
            port: Порт для запуску
        """
        self.host = host
        self.port = port
        self.running = False
        self.routes: dict[str, dict[str, Any]] = {}

    async def start(self) -> None:
        """Запустити API сервер."""
        self.running = True
        print(f"[API] Запущено на {self.host}:{self.port}")

    async def stop(self) -> None:
        """Зупинити API сервер."""
        self.running = False
        print("[API] Зупинено")

    def register_route(
        self, path: str, method: str, handler: Any, description: str | None = None
    ) -> None:
        """Зареєструвати маршрут.

        Args:
            path: Шлях маршруту
            method: HTTP метод
            handler: Функція-обробник
            description: Опис маршруту
        """
        key = f"{method.upper()} {path}"
        self.routes[key] = {
            "path": path,
            "method": method,
            "handler": handler,
            "description": description,
        }

    def get_routes(self) -> list[dict[str, Any]]:
        """Отримати список всіх маршрутів.

        Returns:
            Список маршрутів
        """
        return list(self.routes.values())

    def get_health(self) -> dict[str, str]:
        """Отримати стан сервера.

        Returns:
            Стан сервера
        """
        return {
            "status": "healthy" if self.running else "down",
            "host": self.host,
            "port": self.port,
        }

    async def handle_request(
        self, path: str, method: str, body: Any = None
    ) -> APIResponse:
        """Обробити HTTP запит.

        Args:
            path: Шлях запиту
            method: HTTP метод
            body: Тіло запиту

        Returns:
            Відповідь API

        Raises:
            APIError: Якщо маршрут не знайдено
        """
        key = f"{method.upper()} {path}"
        if key not in self.routes:
            raise APIError(f"Маршрут не знайдено: {key}")
        
        route = self.routes[key]
        handler = route["handler"]
        
        # Викликаємо handler з або без body
        if body:
            result = await handler(body) if callable(handler) else await handler()
        else:
            result = await handler() if callable(handler) else None
        
        return APIResponse(
            status="success",
            data=result,
            metadata={"path": path, "method": method},
        )


class APIDocumentation:
    """Документація API у форматі OpenAPI/Swagger."""

    def __init__(self, title: str, version: str) -> None:
        """Ініціалізувати документацію API.

        Args:
            title: Назва API
            version: Версія API
        """
        self.title = title
        self.version = version
        self.endpoints: list[dict[str, Any]] = []

    def add_endpoint(
        self,
        path: str,
        method: str,
        description: str,
        parameters: list[dict[str, Any]] | None = None,
        response_schema: dict[str, Any] | None = None,
    ) -> None:
        """Додати endpoint до документації.

        Args:
            path: Шлях endpoint'а
            method: HTTP метод
            description: Опис endpoint'а
            parameters: Параметри
            response_schema: Schema відповіді
        """
        self.endpoints.append({
            "path": path,
            "method": method,
            "description": description,
            "parameters": parameters or [],
            "response_schema": response_schema or {},
        })

    def generate_openapi(self) -> dict[str, Any]:
        """Генерувати OpenAPI специфікацію.

        Returns:
            OpenAPI специфікація
        """
        paths = {}
        
        for endpoint in self.endpoints:
            path = endpoint["path"]
            method = endpoint["method"].lower()
            
            if path not in paths:
                paths[path] = {}
            
            paths[path][method] = {
                "summary": endpoint["description"],
                "parameters": endpoint["parameters"],
                "responses": {
                    "200": {
                        "description": "Успішна відповідь",
                        "schema": endpoint["response_schema"],
                    }
                },
            }
        
        return {
            "openapi": "3.0.0",
            "info": {
                "title": self.title,
                "version": self.version,
            },
            "paths": paths,
        }

    def generate_markdown(self) -> str:
        """Генерувати Markdown документацію.

        Returns:
            Markdown документація
        """
        lines = [f"# {self.title}", f"**Version: {self.version}**", ""]
        
        for endpoint in self.endpoints:
            lines.append(f"## {endpoint['method']} {endpoint['path']}")
            lines.append(f"\n{endpoint['description']}\n")
            
            if endpoint["parameters"]:
                lines.append("### Parameters")
                for param in endpoint["parameters"]:
                    lines.append(f"- `{param.get('name')}`: {param.get('type')}")
                lines.append("")
        
        return "\n".join(lines)


# FastAPI app (якщо доступна)
if FastAPI:
    app = FastAPI(title="MCP Platform Health API", version="0.1.0")

    @app.get("/healthz", response_class=PlainTextResponse)
    async def healthz() -> str:
        return "OK"

    @app.get("/readyz", response_class=PlainTextResponse)
    async def readyz() -> str:
        return "OK"

    @app.get("/info")
    async def info() -> Dict[str, str]:
        return {
            "service": "mcp-platform",
            "version": "0.1.0",
            "python": os.getenv("PYTHON_VERSION", "3.12"),
        }

