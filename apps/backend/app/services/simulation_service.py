
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
        sim_id = f"sim_{int(datetime.utcnow().timestamp())}"
        self.active_simulations[sim_id] = {
            "status": "running",
            "target": target_service,
            "intensity": intensity,
            "start_time": datetime.utcnow().isoformat()
        }

        # Simulation logic: in a real app, this might inject delays or noise
        logger.warning(f"🚀 Started Stress Test Simulation [{sim_id}] on {target_service} at {intensity*100}% intensity")

        # Async background task to complete simulation
        asyncio.create_task(self._complete_simulation(sim_id))

        return {
            "simulation_id": sim_id,
            "message": f"Simulation on {target_service} initiated.",
            "mode": "digital_twin"
        }

    async def _complete_simulation(self, sim_id: str):
        await asyncio.sleep(15) # Simulation duration
        if sim_id in self.active_simulations:
            self.active_simulations[sim_id]["status"] = "completed"
            self.active_simulations[sim_id]["result"] = {
                "resilience_score": random.uniform(0.85, 0.99),
                "anomalies_detected": random.randint(0, 5),
                "bottleneck": "I/O bound" if random.random() > 0.5 else "CPU bound"
            }
            logger.info(f"✅ Simulation {sim_id} finished.")

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
