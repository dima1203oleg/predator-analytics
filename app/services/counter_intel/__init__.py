from functools import lru_cache
from .darknet_monitor import DarknetMonitor
from .competitive_attack_radar import CompetitiveAttackRadar
from .psyops_detector import PsyopsDetector

@lru_cache()
def get_darknet_monitor() -> DarknetMonitor:
    return DarknetMonitor()

@lru_cache()
def get_competitive_attack_radar() -> CompetitiveAttackRadar:
    return CompetitiveAttackRadar()

@lru_cache()
def get_psyops_detector() -> PsyopsDetector:
    return PsyopsDetector()

__all__ = [
    "DarknetMonitor", "get_darknet_monitor",
    "CompetitiveAttackRadar", "get_competitive_attack_radar",
    "PsyopsDetector", "get_psyops_detector"
]
