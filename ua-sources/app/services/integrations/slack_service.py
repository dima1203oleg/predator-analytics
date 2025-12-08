
import os
import logging
from typing import Dict, List, Any, Optional

try:
    from slack_sdk import WebClient
    from slack_sdk.errors import SlackApiError
    SLACK_AVAILABLE = True
except ImportError:
    SLACK_AVAILABLE = False
    class WebClient:
        def __init__(self, token=None): pass
    class SlackApiError(Exception): pass

logger = logging.getLogger("service.slack")

class SlackService:
    """
    Service for integrating with Slack API.
    Handles OAuth flow via 'Bot User OAuth Token' usually, 
    but can support full OAuth handshake if needed.
    """
    
    def __init__(self):
        self.bot_token = os.getenv("SLACK_BOT_TOKEN")
        if SLACK_AVAILABLE and self.bot_token:
            self.client = WebClient(token=self.bot_token)
        else:
            self.client = None
            if self.bot_token and not SLACK_AVAILABLE:
                logger.warning("SLACK_BOT_TOKEN is set but slack_sdk is not installed.")

    def is_configured(self) -> bool:
        return self.client is not None and SLACK_AVAILABLE

    async def list_channels(self) -> List[Dict[str, Any]]:
        """List public channels that the bot has access to."""
        if not self.client or not SLACK_AVAILABLE:
            return []
            
        try:
            response = self.client.conversations_list(types="public_channel", limit=100)
            channels = []
            for ch in response["channels"]:
                channels.append({
                    "id": ch["id"],
                    "name": ch["name"],
                    "members_count": ch["num_members"],
                    "topic": ch["topic"]["value"]
                })
            return channels
        except SlackApiError as e:
            logger.error(f"Slack API error: {e}")
            raise Exception(str(e))

    async def fetch_history(self, channel_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch message history from a channel."""
        if not self.client or not SLACK_AVAILABLE:
            raise Exception("Slack not configured or sdk missing")
            
        try:
            response = self.client.conversations_history(channel=channel_id, limit=limit)
            messages = []
            for msg in response["messages"]:
                if "subtype" in msg:
                    continue # Skip system messages
                
                messages.append({
                    "ts": msg["ts"],
                    "user": msg.get("user", "unknown"),
                    "text": msg.get("text", "")
                })
            return messages
        except SlackApiError as e:
            logger.error(f"Failed to fetch history: {e}")
            raise Exception(str(e))
            
    async def index_channel(self, channel_id: str):
        """
        Ingest channel history into Predator's knowledge base.
        """
        # 1. Fetch messages
        messages = await self.fetch_history(channel_id, limit=100)
        
        # 2. Convert to Predator Documents format
        documents = []
        for msg in messages:
            if len(msg["text"]) < 10: continue
            
            documents.append({
                "title": f"Slack Message in #{channel_id}",
                "content": msg["text"],
                "source": "slack",
                "category": "communication",
                "created_at": msg["ts"], # Needs conversion logic
                "metadata": {
                    "channel_id": channel_id,
                    "user_id": msg["user"]
                }
            })
            
        if not documents:
            return 0
            
        # 3. Index via OpenSearchIndexer (Lazy import to avoid circular dep)
        from app.services.opensearch_indexer import OpenSearchIndexer
        from app.services.qdrant_service import QdrantService
        from app.services.embedding_service import EmbeddingService
        
        indexer = OpenSearchIndexer()
        qdrant = QdrantService()
        embedder = EmbeddingService()
        
        await indexer.index_documents(
            index_name="documents_safe",
            documents=documents,
            pii_safe=True,
            embedding_service=embedder,
            qdrant_service=qdrant
        )
        
        return len(documents)

# Singleton
slack_service = SlackService()

def get_slack_service():
    return slack_service
