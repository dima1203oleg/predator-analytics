"""[DEPRECATED] Harvesters — Модулі автоматизованого збору відкритих даних України.

УВАГА: Цей пакет містить застарілі (legacy) ручні краулери. 
Згідно з архітектурою AI Factory, всі нові інтеграції генеруються 
автономно через ConnectorAgent та зберігаються в `auto_generated/`.

Цей пакет містить краулери та синхронізатори для:
- data.gov.ua (CKAN API)
- Prozorro (Open Contracting Feed API)
- ЄДР / Агрегатори (YouControl, Clarity, відкриті реєстри)
"""

from app.harvesters.ckan_harvester import CKANHarvester
from app.harvesters.prozorro_sync import ProzorroSynchronizer
from app.harvesters.edr_aggregator import EDRAggregator

__all__ = [
    "CKANHarvester",
    "ProzorroSynchronizer",
    "EDRAggregator",
]
