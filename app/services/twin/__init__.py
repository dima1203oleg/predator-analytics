from functools import lru_cache
from .ontology_manager import OntologyManager
from .digital_twin_simulator import DigitalTwinSimulator

@lru_cache()
def get_ontology_manager() -> OntologyManager:
    return OntologyManager()

@lru_cache()
def get_digital_twin_simulator() -> DigitalTwinSimulator:
    return DigitalTwinSimulator()

__all__ = [
    "OntologyManager", "get_ontology_manager",
    "DigitalTwinSimulator", "get_digital_twin_simulator"
]
