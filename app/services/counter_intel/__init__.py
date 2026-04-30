from functools import lru_cache

from .competitive_attack_radar import CompetitiveAttackRadar
from .darknet_monitor import DarknetMonitor
from .psyops_detector import PsyopsDetector


@lru_cache
def get_darknet_monitor() -> DarknetMonitor:
    return DarknetMonitor()

@lru_cache
def get_competitive_attack_radar() -> CompetitiveAttackRadar:
    return CompetitiveAttackRadar()

@lru_cache
def get_psyops_detector() -> PsyopsDetector:
    return PsyopsDetector()

__all__ = [
    "CompetitiveAttackRadar",
    "DarknetMonitor",
    "PsyopsDetector",
    "get_competitive_attack_radar",
    "get_darknet_monitor",
    "get_psyops_detector"
]
