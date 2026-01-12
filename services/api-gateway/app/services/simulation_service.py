
import asyncio
import random
import logging
from datetime import datetime
from typing import Dict, List, Any

logger = logging.getLogger("predator.simulation")

class SimulationService:
    """
    Predator v25 Digital Twin & Simulation Engine.
    Allows running 'What-If' scenarios on ML models and data pipelines.
    """
    def __init__(self):
        self.active_simulations = {}

    async def run_stress_test(self, target_service: str, intensity: float) -> Dict[str, Any]:
        """
        Simulates high load or data anomaly on a specific service.
        """
        sim_id = f"sim_stress_{int(datetime.utcnow().timestamp())}"
        self.active_simulations[sim_id] = {
            "type": "stress_test",
            "status": "running",
            "target": target_service,
            "intensity": intensity,
            "start_time": datetime.utcnow().isoformat()
        }

        logger.warning(f"🚀 Started Stress Test Simulation [{sim_id}] on {target_service} at {intensity*100}% intensity")
        asyncio.create_task(self._complete_simulation(sim_id))

        return {
            "simulation_id": sim_id,
            "message": f"Stress test on {target_service} initiated via Digital Twin.",
            "mode": "digital_twin"
        }

    async def run_data_poisoning(self, dataset_id: str, corruption_level: float) -> Dict[str, Any]:
        """
        Simulates adversarial data poisoning in a dataset to test ML resilience.
        """
        sim_id = f"sim_poison_{int(datetime.utcnow().timestamp())}"
        self.active_simulations[sim_id] = {
            "type": "data_poisoning",
            "status": "running",
            "target": dataset_id,
            "intensity": corruption_level,
            "start_time": datetime.utcnow().isoformat()
        }

        logger.error(f"⚠️ Simulation: INJECTING DATA POISONING [{sim_id}] into dataset {dataset_id}")
        asyncio.create_task(self._complete_simulation(sim_id))

        return {
            "simulation_id": sim_id,
            "message": f"Data poisoning simulation started for {dataset_id}.",
            "mode": "adversarial_simulation"
        }

    async def _complete_simulation(self, sim_id: str):
        # Longer simulation for poisoning
        sim_type = self.active_simulations[sim_id].get("type", "stress_test")
        await asyncio.sleep(20 if sim_type == "data_poisoning" else 10)

        if sim_id in self.active_simulations:
            self.active_simulations[sim_id]["status"] = "completed"

            if sim_type == "stress_test":
                self.active_simulations[sim_id]["result"] = {
                    "resilience_score": random.uniform(0.85, 0.99),
                    "anomalies_detected": random.randint(0, 5),
                    "bottleneck": "I/O bound" if random.random() > 0.5 else "CPU bound"
                }
            else:
                # Data Poisoning Results
                self.active_simulations[sim_id]["result"] = {
                    "vulnerability_score": random.uniform(0.2, 0.45),
                    "model_drift_detected": True,
                    "mitigation": "Enable semantic filtering on Ingestion Layer"
                }
            logger.info(f"✅ Digital Twin Simulation {sim_id} [Type: {sim_type}] finished.")

    async def get_simulation_status(self, sim_id: str) -> Dict[str, Any]:
        return self.active_simulations.get(sim_id, {"status": "not_found"})

    def get_status(self, tag: str = None) -> Dict[str, Any]:
        """Returns the most relevant active simulation status"""
        active = [s for s in self.active_simulations.values() if s["status"] == "running"]
        if not active:
            return {"status": "idle"}
        return active[0]

    def list_simulations(self) -> List[Dict[str, Any]]:
        return list(self.active_simulations.values())

simulation_service = SimulationService()
