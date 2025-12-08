
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from app.api.v1 import integrations

from app.main_v21 import app

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

class TestSlackIntegration:
    
    @pytest.fixture
    def mock_slack_service(self):
        with patch("app.api.v1.integrations.get_slack_service") as mock_get:
            service = MagicMock()
            service.is_configured.return_value = True
            service.list_channels = AsyncMock(return_value=[
                {"id": "C1", "name": "general", "members_count": 10, "topic": "General chat"}
            ])
            service.index_channel = AsyncMock(return_value=5)
            mock_get.return_value = service
            yield service

    def test_slack_status(self, client, mock_slack_service):
        response = client.get("/api/v1/integrations/slack/status")
        assert response.status_code == 200
        assert response.json()["configured"] is True

    def test_list_channels(self, client, mock_slack_service):
        response = client.get("/api/v1/integrations/slack/channels")
        assert response.status_code == 200
        channels = response.json()
        assert len(channels) == 1
        assert channels[0]["name"] == "general"

    def test_sync_channel(self, client, mock_slack_service):
        response = client.post("/api/v1/integrations/slack/sync", json={
            "source": "slack",
            "target_id": "C1"
        })
        assert response.status_code == 200
        assert response.json()["status"] == "started"
        # Since it's a background task, we can't easily await the task execution here without more complex setup,
        # but we verified the endpoint returns success.


class TestNotionIntegration:
    
    @pytest.fixture
    def mock_notion_service(self):
        with patch("app.api.v1.integrations.get_notion_service") as mock_get:
            service = MagicMock()
            service.is_configured.return_value = True
            service.search = AsyncMock(return_value=[
                {"id": "P1", "title": "Meeting Notes", "url": "http://notion.so/p1", "type": "page"}
            ])
            service.index_page = AsyncMock(return_value=True)
            mock_get.return_value = service
            yield service

    def test_notion_status(self, client, mock_notion_service):
        response = client.get("/api/v1/integrations/notion/status")
        assert response.status_code == 200
        assert response.json()["configured"] is True

    def test_notion_search(self, client, mock_notion_service):
        response = client.get("/api/v1/integrations/notion/search?query=test")
        assert response.status_code == 200
        results = response.json()
        assert len(results) == 1
        assert results[0]["title"] == "Meeting Notes"

    def test_sync_page(self, client, mock_notion_service):
        response = client.post("/api/v1/integrations/notion/sync", json={
            "source": "notion",
            "target_id": "P1"
        })
        assert response.status_code == 200
        assert response.json()["status"] == "started"
