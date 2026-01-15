
import asyncio
import os
import sys
import unittest.mock
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock

# Add project root and api-gateway
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "services/api-gateway"))

# Mock database and configuration BEFORE importing services that use them
sys.modules['libs.core.database'] = MagicMock()
sys.modules['libs.core.database'].get_db_ctx = MagicMock()
sys.modules['libs.core.models'] = MagicMock()
sys.modules['libs.core.models.entities'] = MagicMock()
sys.modules['libs.core.som'] = MagicMock() # Block SOM initialization
sys.modules['libs.core.axioms'] = MagicMock() # Block Axioms


# Mock settings
config_mock = MagicMock()
config_mock.settings.LOG_LEVEL = "INFO"
config_mock.settings.ENVIRONMENT = "development"
sys.modules['libs.core.config'] = config_mock

# Mock other services
sys.modules['app.services.llm.service'] = MagicMock()
sys.modules['app.services.training_status_service'] = MagicMock()

# Now import the services to test
from libs.core.structured_logger import setup_structured_logging
from app.services.autonomous_optimizer import autonomous_optimizer
from app.services.training_service import self_improvement_service

# Configure logging
setup_structured_logging(log_level="INFO", use_json=True)

class AsyncContextManagerMock:
    def __init__(self, *args, **kwargs):
        self.mock_session = AsyncMock()
        # Setup db.execute return value (Result object)
        result_mock = MagicMock()
        result_mock.scalars.return_value.all.return_value = []
        # Making sure scalar() also works (used for count)
        result_mock.scalar.return_value = 0

        self.mock_session.execute.return_value = result_mock
        self.mock_session.scalar.return_value = 0
        self.mock_session.add = MagicMock()
        self.mock_session.commit = AsyncMock()

    async def __aenter__(self):
        return self.mock_session
    async def __aexit__(self, exc_type, exc, tb):
        pass

async def verify_auto_improvement():
    print("--- 🧠 Testing Auto-Improvement Systems ---")

    # 1. Verify Autonomous Optimizer
    print("\n[1] Testing Autonomous Optimizer...")

    # Mock DB Context for Optimizer
    with unittest.mock.patch('app.services.autonomous_optimizer.get_db_ctx', side_effect=AsyncContextManagerMock), \
         unittest.mock.patch('app.services.autonomous_optimizer.select') as mock_select, \
         unittest.mock.patch('app.services.autonomous_optimizer.update') as mock_update, \
         unittest.mock.patch('app.services.autonomous_optimizer.text') as mock_text, \
         unittest.mock.patch('app.services.autonomous_optimizer.func') as mock_func:

        # Setup mocks for sqlalchemy queries
        # select(...).where(...) returns a query object, executing it returns result
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [] # No drift initially

        # We need the db.execute to return this result
        # The db context returns a session-like object (AsyncMock from AsyncContextManagerMock)
        # But we don't have reference to that specific instance here easily unless we capture it.
        # However, the code calls await db.execute(...)

        # Let's mock db.execute return value on the instance created by get_db_ctx
        # Since get_db_ctx returns a context manager that yields an AsyncMock:
        pass # The logic below will struggle because our patching of get_db_ctx is top-level side_effect

        # Force a check
        drift_status = await autonomous_optimizer.check_and_optimize()
        print(f"✅ Optimizer Drift Check: {drift_status}")

        status = autonomous_optimizer.get_status()
        print(f"📊 Optimizer Status: {status['optimization_level']} (Running: {status['is_running']})")
        print(f"Metrics: {status['metrics']}")

    # 2. Verify Self-Improvement Service
    print("\n[2] Testing Self-Improvement Service...")

    # Mock DB Context for Training Service
    with unittest.mock.patch('app.services.training_service.get_db_ctx', side_effect=AsyncContextManagerMock), \
         unittest.mock.patch('app.services.training_service.select') as mock_select_ts, \
         unittest.mock.patch('app.services.training_service.func') as mock_func_ts:

        # Mock select().select_from() chain to return a query that executes to 0 (default)
        mock_select_ts.return_value.select_from.return_value = "MOCKED_QUERY"

        # Mock LLM generation
        self_improvement_service.llm.generate = AsyncMock(return_value=MagicMock(success=True, content='{"qa": "test"}'))

        # Mock Orchestrator in sys.modules because it's imported inside the method
        orchestrator_mock = MagicMock()
        orchestrator_mock.sovereign_orchestrator.execute_comprehensive_cycle = AsyncMock(return_value={"status": "optimized"})
        sys.modules['orchestrator.agents.v25_sovereign_registry'] = orchestrator_mock

        # Run single cycle
        try:
           # We verify it doesn't crash
           print("▶️ Starting single training cycle (simulated)...")
           # We mock the specific method that has the import
           # Actually, the import is inside run_single_cycle.
           # so patching sys.modules above should work.

           # Need to mock training_status_service calls
           ts_mock = sys.modules['app.services.training_status_service'].training_status_service
           ts_mock.update_status = AsyncMock()

           result = await self_improvement_service.run_single_cycle()
           print(f"✅ Training Cycle Completed. Result: {result}")

        except Exception as e:
            print(f"❌ Training Cycle Failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_auto_improvement())
