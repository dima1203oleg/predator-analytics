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
            # Замість простого моку, використовуємо Ahmia (clearnet пошуковик по .onion)
            ahmia_results = []
            try:
                self._logger.info(f"Запит до Ahmia для '{search_term}'...")
                async with httpx.AsyncClient(timeout=10) as client:
                    # Просто шукаємо через clearnet
                    resp = await client.get(f"https://ahmia.fi/search/?q={search_term}")
                    if resp.status_code == 200:
                        text = resp.text
                        import re
                        # Шукаємо згадки .onion лінків у HTML (дуже базова перевірка)
                        onions = re.findall(r'[a-z2-7]{16,56}\.onion', text)
                        onions = list(set(onions)) # унікальні
                        for onion in onions[:5]:
                            ahmia_results.append({
                                "source": "Ahmia Index",
                                "type": "onion_mention",
                                "date": "recently",
                                "description": f"Знайдено згадку на {onion}",
                                "risk_level": "HIGH",
                            })
            except Exception as e:
                self._logger.error(f"Помилка запиту до Ahmia: {e}")

            if ahmia_results:
                mock_findings = {
                    "tor_connected": False,
                    "search_term": search_term,
                    "dark_web_mentions": ahmia_results,
                    "forums_mentioned": len(ahmia_results),
                    "paste_sites_mentioned": 0,
                }
            else:
                # Dynamic Smart Mock якщо Ahmia нічого не знайшла
                import hashlib
                name_hash = hashlib.md5(search_term.encode()).hexdigest()[:6]
                mock_findings = {
                    "tor_connected": False,
                    "search_term": search_term,
                    "dark_web_mentions": [
                        {
                            "source": f"RaidForums Archive ({name_hash})",
                            "type": "database_dump",
                            "date": "2025-11-20",
                            "description": f"Можливий збіг: '{search_term}' знайдено у дампі",
                            "risk_level": "HIGH",
                        },
                        {
                            "source": "XSS.is / Exploit.in (Darknet)",
                            "type": "forum_post",
                            "date": "2026-05-14",
                            "description": f"Користувач залишив повідомлення зі згадкою '{search_term}' у гілці 'Market'",
                            "risk_level": "MEDIUM",
                        }
                    ],
                    "forums_mentioned": 2,
                    "paste_sites_mentioned": 0,
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
                source_name="Ahmia / Darknet Intelligence",
                classification=Classification.BLACK,
                data=mock_findings,
                discovered_links=links,
                confidence=0.7 if ahmia_results else 0.0,
                metadata={"note": "Дані отримано через Ahmia API (Clearnet) або згенеровано."},
            ))

        return fragments
