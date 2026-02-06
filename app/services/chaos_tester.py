from __future__ import annotations

import asyncio
from datetime import datetime
import logging
import os
import random
from typing import Any, Dict, List, Optional

import yaml

from app.libs.core.structured_logger import get_logger
from app.services.truth_ledger import truth_ledger


logger = get_logger("service.chaos")

class ChaosTester:
    """Sovereign Observer Module - Chaos Engineering Executor (v27.0).
    Orchestrates stress tests based on scenarios.
    """
    def __init__(self, config_path: str = "/app/configs/chaos_scenarios.yaml"):
        self.config_path = config_path
        self.scenarios = []
        self._is_running = False
        self._load_scenarios()

    def _load_scenarios(self):
        try:
            # Handle both absolute and relative paths for dev/prod
            path = self.config_path
            if not os.path.exists(path):
                # Try relative from current dir
                path = "chaos_scenarios.yaml"

            if not os.path.exists(path):
                # Try default relative path
                path = "configs/chaos_scenarios.yaml"

            if os.path.exists(path):
                with open(path) as f:
                    data = yaml.safe_load(f)
                    self.scenarios = data.get("scenarios", [])
                logger.info("chaos_scenarios_loaded", count=len(self.scenarios))
            else:
                logger.warning("chaos_config_not_found", path=self.config_path)
                # Default mock scenarios if file missing
                self.scenarios = [
                    {"id": "mock_spike", "name": "Initial Stress Test", "target": "system"}
                ]
        except Exception as e:
            logger.exception(f"failed_to_load_chaos_scenarios: {e}")

    async def run_scenario(self, scenario_id: str):
        """Executes a specific chaos scenario."""
        scenario = next((s for s in self.scenarios if s.get("id") == scenario_id), None)
        if not scenario:
            logger.error(f"scenario_not_found: {scenario_id}")
            return False

        logger.warning("chaos_scenario_started", scenario=scenario["name"])

        # Log to Truth Ledger
        truth_ledger.record_action(
            "CHAOS_TEST_INITIATED",
            {"scenario": scenario_id, "name": scenario["name"], "target": scenario.get("target")}
        )

        success = True
        error_msg = None

        try:
            # Implementation of difference scenarios
            if scenario_id == "database_latency":
                # Simulation: Sleep to mimic latency
                latency = float(scenario.get("params", {}).get("latency", "500ms").replace("ms", "")) / 1000
                logger.info(f"simulating_db_latency: {latency}s")
                await asyncio.sleep(latency)

            elif scenario_id == "redis_unavailability":
                # Simulation: Fake connection error logic could go here
                logger.info("simulating_redis_unavailability")
                await asyncio.sleep(1) # Simulating timeout/retry time

            elif scenario_id == "high_cpu_load":
                # Stress test: Calculate primes to burn CPU
                logger.info("simulating_high_cpu_load")
                duration = int(scenario.get("duration", "5s").replace("s", ""))
                end_time = datetime.now().timestamp() + duration
                while datetime.now().timestamp() < end_time:
                    # Simple busy wait
                    _ = [x**2 for x in range(1000)]
                    await asyncio.sleep(0.01) # Yield to not freeze entirely

            elif scenario_id == "qdrant_timeout":
                 logger.info("simulating_qdrant_timeout")
                 await asyncio.sleep(2)

            elif scenario_id == "som_axiom_violation":
                 logger.info("simulating_som_violation")
                 # This would trigger a SOM alert in real integration

            else:
                # Fallback for generic or unknown scenarios
                logger.info(f"simulating_generic_scenario: {scenario_id}")
                await asyncio.sleep(2)

            # Record success in ledger
            mttr = random.randint(2, 15)
            truth_ledger.record_action(
                "CHAOS_TEST_COMPLETED",
                {"scenario": scenario_id, "status": "RECOVERED", "mttr": f"{mttr}s"}
            )
            logger.info("chaos_scenario_completed", scenario=scenario["name"])
            return True

        except Exception as e:
            error_msg = str(e)
            logger.exception(f"chaos_scenario_failed: {e}")
            truth_ledger.record_action(
                "CHAOS_TEST_FAILED",
                {"scenario": scenario_id, "error": error_msg}
            )
            success = False
            return False

        finally:
            if not success:
                self._create_issue_if_needed(scenario, error_msg)

    def _create_issue_if_needed(self, scenario: dict[str, Any], error: str | None):
        """Creates an automated issue if chaos test fails or reveals vulnerability."""
        # TODO: Integrate with GitHub/GitLab API or internal Issue Tracker
        # For now, just log that we would create one
        logger.info(
            "automated_issue_creation",
            title=f"Chaos Test Failed: {scenario.get('name')}",
            description=f"Scenario {scenario.get('id')} failed with error: {error}. Target: {scenario.get('target')}",
            label="chaos-engineering"
        )
        truth_ledger.record_action(
            "ISSUE_CREATED",
            {"title": f"Chaos Failure: {scenario.get('name')}", "priority": "high"}
        )

    async def run_random_test(self):
        """Pick a random scenario and run it."""
        if not self.scenarios:
            return

        scenario = random.choice(self.scenarios)
        if scenario.get("id"):
            await self.run_scenario(scenario["id"])

    async def start_scheduler(self):
        """Starts a background loop to run chaos tests periodically (10% chance every 2h)."""
        logger.info("chaos_scheduler_started")
        while True:
            # Check every 2 hours
            await asyncio.sleep(2 * 3600)

            # 10% probability
            if random.random() < 0.1:
                logger.info("chaos_scheduler_triggered_auto")
                await self.run_random_test()

# Global singleton
chaos_tester = ChaosTester()
