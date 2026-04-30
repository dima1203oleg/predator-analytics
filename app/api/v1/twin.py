from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.twin import (
    DigitalTwinSimulator,
    OntologyManager,
    get_digital_twin_simulator,
    get_ontology_manager,
)

router = APIRouter(prefix="/twin", tags=["Digital Twin & Ontology"])

class SimulationRequest(BaseModel):
    entity_id: str
    scenarios: list[str]
    iterations: int = 100

@router.get("/ontology/summary")
async def get_ontology_summary(
    manager: OntologyManager = Depends(get_ontology_manager)
) -> dict[str, Any]:
    """Returns a summary of the current semantic ontology (COMP-229).
    """
    return manager.get_ontology_summary()

@router.post("/simulate")
async def run_entity_simulation(
    data: SimulationRequest,
    simulator: DigitalTwinSimulator = Depends(get_digital_twin_simulator)
) -> dict[str, Any]:
    """Runs an agent-based digital twin simulation for a specific entity (COMP-231).
    """
    return simulator.run_simulation(data.entity_id, data.scenarios, data.iterations)
