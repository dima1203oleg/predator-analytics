from functools import lru_cache

from .digital_twin_simulator import DigitalTwinSimulator
from .ontology_manager import OntologyManager


@lru_cache
def get_ontology_manager() -> OntologyManager:
    return OntologyManager()

@lru_cache
def get_digital_twin_simulator() -> DigitalTwinSimulator:
    return DigitalTwinSimulator()

__all__ = [
    "DigitalTwinSimulator",
    "OntologyManager",
    "get_digital_twin_simulator",
    "get_ontology_manager"
]
