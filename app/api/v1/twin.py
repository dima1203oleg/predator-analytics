from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.twin import (
    OntologyManager, get_ontology_manager,
    DigitalTwinSimulator, get_digital_twin_simulator
)

router = APIRouter(prefix="/twin", tags=["Digital Twin & Ontology"])

class SimulationRequest(BaseModel):
    entity_id: str
    scenarios: List[str]
    iterations: int = 100

@router.get("/ontology/summary")
async def get_ontology_summary(
    manager: OntologyManager = Depends(get_ontology_manager)
) -> Dict[str, Any]:
    """
    Returns a summary of the current semantic ontology (COMP-229).
    """
    return manager.get_ontology_summary()

@router.post("/simulate")
async def run_entity_simulation(
    data: SimulationRequest,
    simulator: DigitalTwinSimulator = Depends(get_digital_twin_simulator)
) -> Dict[str, Any]:
    """
    Runs an agent-based digital twin simulation for a specific entity (COMP-231).
    """
    return simulator.run_simulation(data.entity_id, data.scenarios, data.iterations)
