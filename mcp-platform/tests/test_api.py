"""Тести для Testing & Documentation (API та Docs)."""

import pytest

from mcp.web import APIDocumentation, APIServer


class TestAPIServer:
    """Тести APIServer."""

    @pytest.fixture
    def api_server(self):
        """Фікстура APIServer."""
        return APIServer(host="localhost", port=8000)

    def test_init(self, api_server):
        """Тест ініціалізації."""
        assert api_server.host == "localhost"
        assert api_server.port == 8000
        assert not api_server.running

    @pytest.mark.asyncio
    async def test_start(self, api_server):
        """Тест запуску сервера."""
        await api_server.start()

        assert api_server.running

    @pytest.mark.asyncio
    async def test_stop(self, api_server):
        """Тест зупинення сервера."""
        await api_server.start()
        await api_server.stop()

        assert not api_server.running

    def test_register_route(self, api_server):
        """Тест реєстрації маршруту."""
        async def handler():
            return {"message": "test"}

        api_server.register_route("/test", "GET", handler, "Test endpoint")

        assert "GET /test" in api_server.routes

    def test_register_multiple_routes(self, api_server):
        """Тест реєстрації кількох маршрутів."""
        async def handler1():
            return {"message": "test1"}

        async def handler2():
            return {"message": "test2"}

        api_server.register_route("/test1", "GET", handler1)
        api_server.register_route("/test2", "POST", handler2)

        assert len(api_server.routes) == 2

    def test_get_routes(self, api_server):
        """Тест отримання списку маршрутів."""
        async def handler():
            return {"message": "test"}

        api_server.register_route("/test", "GET", handler, "Test endpoint")
        routes = api_server.get_routes()

        assert len(routes) == 1
        assert routes[0]["path"] == "/test"
        assert routes[0]["description"] == "Test endpoint"

    @pytest.mark.asyncio
    async def test_handle_request(self, api_server):
        """Тест обробки запиту."""
        async def handler():
            return {"result": "success"}

        api_server.register_route("/test", "GET", handler)
        response = await api_server.handle_request("/test", "GET")

        assert response.status == "success"
        assert response.data == {"result": "success"}

    @pytest.mark.asyncio
    async def test_handle_request_with_body(self, api_server):
        """Тест обробки запиту з тілом."""
        async def handler(body):
            return {"received": body}

        api_server.register_route("/test", "POST", handler)
        response = await api_server.handle_request(
            "/test", "POST", body={"input": "data"}
        )

        assert response.status == "success"
        assert response.data == {"received": {"input": "data"}}

    def test_get_health(self, api_server):
        """Тест отримання стану."""
        health = api_server.get_health()

        assert health["status"] == "down"
        assert health["host"] == "localhost"
        assert health["port"] == 8000


class TestAPIDocumentation:
    """Тести APIDocumentation."""

    @pytest.fixture
    def api_docs(self):
        """Фікстура APIDocumentation."""
        return APIDocumentation("MCP API", "1.0.0")

    def test_init(self, api_docs):
        """Тест ініціалізації."""
        assert api_docs.title == "MCP API"
        assert api_docs.version == "1.0.0"
        assert len(api_docs.endpoints) == 0

    def test_add_endpoint(self, api_docs):
        """Тест додавання endpoint'а."""
        api_docs.add_endpoint(
            "/test",
            "GET",
            "Test endpoint",
            parameters=[{"name": "id", "type": "integer"}],
        )

        assert len(api_docs.endpoints) == 1

    def test_add_multiple_endpoints(self, api_docs):
        """Тест додавання кількох endpoint'ів."""
        api_docs.add_endpoint("/test1", "GET", "Test 1")
        api_docs.add_endpoint("/test2", "POST", "Test 2")
        api_docs.add_endpoint("/test3", "PUT", "Test 3")

        assert len(api_docs.endpoints) == 3

    def test_generate_openapi(self, api_docs):
        """Тест генерування OpenAPI."""
        api_docs.add_endpoint(
            "/test",
            "GET",
            "Test endpoint",
            response_schema={"type": "object", "properties": {"id": {"type": "integer"}}},
        )

        openapi = api_docs.generate_openapi()

        assert openapi["openapi"] == "3.0.0"
        assert openapi["info"]["title"] == "MCP API"
        assert "/test" in openapi["paths"]

    def test_generate_markdown(self, api_docs):
        """Тест генерування Markdown документації."""
        api_docs.add_endpoint(
            "/users",
            "GET",
            "Get list of users",
            parameters=[{"name": "limit", "type": "integer"}],
        )

        markdown = api_docs.generate_markdown()

        assert "# MCP API" in markdown
        assert "## GET /users" in markdown
        assert "Get list of users" in markdown

    def test_openapi_with_parameters(self, api_docs):
        """Тест OpenAPI з параметрами."""
        api_docs.add_endpoint(
            "/items/{id}",
            "GET",
            "Get item by ID",
            parameters=[
                {"name": "id", "type": "integer", "required": True},
                {"name": "format", "type": "string", "required": False},
            ],
        )

        openapi = api_docs.generate_openapi()

        assert len(openapi["paths"]["/items/{id}"]["get"]["parameters"]) == 2
