"""Darknet Collector — Моніторинг даркнету.

Джерела: Tor-проксі, paste-сайти, форуми, маркетплейси.
Класифікація: BLACK.
"""
import os

import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class DarknetCollector(BaseCollector):
    name = "darknet"
    display_name = "Darknet Monitor (Tor)"
    classification = Classification.BLACK
    description = "Моніторинг продажу даних, форумів, paste-сайтів через Tor"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY, EntityType.EMAIL, EntityType.PHONE]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Сканування даркнет-ресурсів.
        
        Потребує запущений Tor SOCKS5 проксі (socks5h://localhost:9050).
        Наразі — структурований mock.
        """
        fragments: list[DataFragment] = []
        search_term = query.name or query.email or query.identifier

        tor_proxy = os.getenv("TOR_SOCKS_PROXY", "socks5h://localhost:9050")
        tor_available = False

        # Перевірка доступності Tor
        try:
            async with httpx.AsyncClient(
                timeout=10,
                proxy=tor_proxy,
            ) as client:
                resp = await client.get("http://check.torproject.org/api/ip")
                if resp.status_code == 200:
                    data = resp.json()
                    tor_available = data.get("IsTor", False)
        except Exception:
            self._logger.warning("Tor проксі недоступний. Використовую mock-дані.")

        if tor_available:
            # Реальне сканування через Tor (базова імплементація)
            fragments.append(DataFragment(
                category="darknet",
                source_name="Darknet Scanner (Tor)",
                classification=Classification.BLACK,
                data={
                    "tor_connected": True,
                    "search_term": search_term,
                    "note": "Tor підключений. Реальне сканування потребує налаштування конкретних .onion адрес.",
                },
                confidence=0.3,
            ))
        else:
            # Mock-дані для демонстрації
            mock_findings = {
                "tor_connected": False,
                "search_term": search_term,
                "dark_web_mentions": [
                    {
                        "source": "RaidForums Archive",
                        "type": "database_dump",
                        "date": "2025-11-20",
                        "description": f"Можливий збіг: '{search_term}' знайдено у дампі корпоративної пошти",
                        "risk_level": "HIGH",
                    },
                    {
                        "source": "Paste-сайт (deepweb)",
                        "type": "paste",
                        "date": "2026-01-15",
                        "description": f"Документ з згадкою '{search_term}' на анонімному paste-сервісі",
                        "risk_level": "MEDIUM",
                    },
                ],
                "marketplace_listings": [
                    {
                        "marketplace": "Genesis Market (archived)",
                        "type": "credentials_for_sale",
                        "last_seen": "2025-08-10",
                        "price_usd": 15.0,
                        "note": "Бот-профіль з cookies та fingerprints",
                    },
                ],
                "forums_mentioned": 2,
                "paste_sites_mentioned": 1,
            }

            links = []
            for mention in mock_findings.get("dark_web_mentions", []):
                links.append({
                    "source_id": query.identifier,
                    "target_id": f"darknet_{mention['source'].replace(' ', '_').lower()}",
                    "target_name": f"🌑 {mention['source']}",
                    "relation_type": "FOUND_ON_DARKNET",
                    "risk": "HIGH",
                })

            fragments.append(DataFragment(
                category="darknet",
                source_name="Darknet Intelligence (mock)",
                classification=Classification.BLACK,
                data=mock_findings,
                discovered_links=links,
                confidence=0.0,
                metadata={"note": "Mock. Встановіть TOR_SOCKS_PROXY для реального сканування."},
            ))

        return fragments
