from __future__ import annotations

import asyncio
import sys
from unittest.mock import MagicMock, patch

# Adjust path to find app
# We need to add the parent of 'app' to sys.path
sys.path.append("/Users/dima-mac/Documents/Predator_21/services/api_gateway")

# Mock things before importing chaos_tester
# We need to mock 'app.services.truth_ledger' and 'libs.core.structured_logger'
sys.modules["app.services.truth_ledger"] = MagicMock()
sys.modules["libs"] = MagicMock()
sys.modules["libs.core"] = MagicMock()
sys.modules["libs.core.structured_logger"] = MagicMock()

# Now import
try:
    from app.services.chaos_tester import ChaosTester
except ImportError:
    sys.exit(1)

async def test_chaos_logic():
    tester = ChaosTester(config_path="/Users/dima-mac/Documents/Predator_21/chaos_scenarios.yaml")

    for _s in tester.scenarios:
        pass

    # Let's mock asyncio.sleep to be instant
    with patch('asyncio.sleep', return_value=None):
        await tester.run_scenario("database_latency")

        await tester.run_random_test()

if __name__ == "__main__":
    asyncio.run(test_chaos_logic())
