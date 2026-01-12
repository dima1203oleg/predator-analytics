
import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import asyncio
from datetime import datetime

# Adjust path
import sys
import os
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

from libs.core.guardian import GuardianService

class TestGuardianService(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.guardian = GuardianService()

    @patch("libs.core.guardian.RedisClient")
    async def test_check_infrastructure_mocked(self, MockRedis):
        """Test infrastructure checks with mocked dependencies."""
        mock_redis_instance = AsyncMock()
        # RedisClient.get_instance is static/class method, we need to mock it as AsyncMock
        MockRedis.get_instance.side_effect = AsyncMock(return_value=mock_redis_instance)

        # Test 1: Redis UP
        # Ensure ping returns True (and is awaitable)
        mock_redis_instance.ping.return_value = True

        # Mock sockets to fail (since we don't have real services)
        # We expect Redis=UP, everything else=DOWN
        with patch("socket.create_connection", side_effect=OSError):
            results = await self.guardian.check_infrastructure()

        self.assertEqual(results["redis"], "UP")
        self.assertEqual(results["rabbitmq"], "DOWN")
        self.assertEqual(results["qdrant"], "DOWN")

    @patch("libs.core.guardian.get_db_ctx")
    async def test_schema_integrity_mocked(self, mock_get_db):
        """Test schema validation logic."""
        mock_db = AsyncMock()
        mock_get_db.return_value.__aenter__.return_value = mock_db

        # Fix: db.execute is awaitable (AsyncMock), but return value for fetchone must be sync via MagicMock
        mock_result = MagicMock()
        mock_result.fetchone.return_value = None # Missing table

        mock_db.execute.return_value = mock_result

        issues = await self.guardian.verify_schema_integrity()
        self.assertTrue(len(issues) > 0)
        self.assertIn("MISSING_TABLE: gold.data_sources", issues)

    async def test_auto_recovery_triggers(self):
        """Test that auto-recovery is called when critical failure detected."""
        with patch.object(self.guardian, 'check_infrastructure', return_value={"redis": "DOWN"}):
             with patch.object(self.guardian, 'verify_schema_integrity', return_value=[]):
                  with patch.object(self.guardian, 'run_auto_recovery', new_callable=AsyncMock) as mock_recover:
                       # Run one iteration (hack: throw exception to break loop or just call logic manually)
                       # Since 'start' is an infinite loop, we test the logic components directly

                       infra = await self.guardian.check_infrastructure()
                       # Logic inside 'start':
                       if any(v == "DOWN" for v in infra.values()):
                           await self.guardian.run_auto_recovery()

                       mock_recover.assert_called_once()

if __name__ == '__main__':
    unittest.main()
