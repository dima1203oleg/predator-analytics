"""Unit tests for upgraded StorageRouter."""
import unittest
from unittest.mock import AsyncMock, patch
from app.services.storage_router import StorageRouter


class TestStorageRouter(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        with patch("app.services.storage_router.Neo4jClient"), \
             patch("app.services.storage_router.OpenSearchClient"), \
             patch("app.services.storage_router.QdrantVectorClient"):
            self.router = StorageRouter()

    def test_deterministic_fallback_vector(self):
        vec1 = self.router._deterministic_fallback_vector("Україна", dimension=1536)
        vec2 = self.router._deterministic_fallback_vector("Україна", dimension=1536)
        vec3 = self.router._deterministic_fallback_vector("Київ", dimension=1536)

        self.assertEqual(len(vec1), 1536)
        self.assertEqual(vec1, vec2)
        self.assertNotEqual(vec1, vec3)
        self.assertTrue(-1.0 <= vec1[0] <= 1.0)

    async def test_route_data_flow(self):
        data = {
            "ueid": "UKR-COMPANY-12345678",
            "entity_type": "Company",
            "name": "ТОВ Тест Сервіс",
            "searchable_text": "ТОВ Тест Сервіс Компанія",
        }

        self.router.neo4j_client.save_entity = AsyncMock()
        self.router.opensearch_client.index_document = AsyncMock()
        self.router.qdrant_client.save_embedding = AsyncMock()

        res = await self.router.route_data(data)
        self.assertTrue(res["postgres"])
        self.assertTrue(res["neo4j"])
        self.assertTrue(res["opensearch"])
        self.assertTrue(res["qdrant"])


if __name__ == "__main__":
    unittest.main()
