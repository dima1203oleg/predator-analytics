"""
Person Dossier Aggregator — PREDATOR Core API
Збирає повний граф зв'язків фізичної особи з Neo4j.
"""
import logging
from typing import Dict, Any, List
import os

logger = logging.getLogger(__name__)

class PersonDossierAggregator:
    def __init__(self):
        # Інтеграція клієнта Neo4j з core-api
        from app.services.neo4j_service import Neo4jService
        self.neo4j = Neo4jService()
        
        # Ініціалізація OSINT-колекторів
        from app.services.osint.collectors.edr_collector import EdrCollector
        from app.services.osint.collectors.leak_collector import LeakCollector
        from app.services.osint.collectors.blockchain_collector import BlockchainCollector
        from app.services.osint.collectors.document_collector import DocumentCollector
        from app.services.osint.collectors.social_media_collector import SocialMediaCollector
        from app.services.osint.collectors.sanctions_collector import SanctionsCollector
        from app.services.osint.collectors.darknet_collector import DarknetCollector
        
        self.edr_collector = EdrCollector()
        self.collectors = [
            EdrCollector(),
            LeakCollector(),
            BlockchainCollector(),
            DocumentCollector(),
            SocialMediaCollector(),
            SanctionsCollector(),
            DarknetCollector()
        ]
        
        logger.info("Initialized PersonDossierAggregator with Neo4jService and OSINT Collectors")

    async def compile_full_profile(self, identifier: str) -> Dict[str, Any]:
        """
        Збирає повне досьє на людину, обходячи граф вглиб на 2-3 рівні.
        """
        logger.info(f"Compiling Deep Profile for Person: {identifier}")
        
        # Cypher Query to get all connected assets, companies, relatives
        query = """
        MATCH (p:Person {ueid: $identifier})
        OPTIONAL MATCH (p)-[r_comp:FOUNDER_OF|DIRECTOR_OF|BENEFICIARY_OF]->(c:Company)
        OPTIONAL MATCH (p)-[r_asset:OWNS_ASSET]->(a:Asset)
        OPTIONAL MATCH (p)-[r_veh:OWNS_VEHICLE]->(v:Vehicle)
        OPTIONAL MATCH (p)-[r_rel:RELATIVE_OF]-(rel:Person)
        OPTIONAL MATCH (p)-[r_pep:IS_PEP]->(pep:PEP_Declaration)
        OPTIONAL MATCH (p)-[r_wallet:OWNS_WALLET]->(w:CryptoWallet)
        OPTIONAL MATCH (p)-[r_email:OWNS_EMAIL]->(e:Email)-[r_leak:COMPROMISED_IN]->(l:DataLeak)
        OPTIONAL MATCH (p)-[r_sanc:HAS_SANCTION]->(s:SanctionedEntity)
        RETURN p, 
               collect(DISTINCT c) as companies,
               collect(DISTINCT a) as real_estate,
               collect(DISTINCT v) as vehicles,
               collect(DISTINCT rel) as relatives,
               collect(DISTINCT pep) as pep_declarations,
               collect(DISTINCT w) as crypto_wallets,
               collect(DISTINCT {email: e, leak: l}) as leaks,
               collect(DISTINCT s) as sanctions
        """
        
        # TODO: Execute query via Neo4j Driver
        # Mock Response for now
        
        logger.info(f"Збираємо дані для особи: {identifier}")

        # Симуляція запиту до графу та інших джерел
        # Виклик реального методу пошуку прихованих активів
        hidden_assets_result = await self.neo4j.find_hidden_assets(f"person_{identifier}", max_depth=3)
        hidden_assets = []
        if hidden_assets_result.success:
            hidden_assets = hidden_assets_result.data.get("hidden_assets", [])
            logger.info(f"Знайдено {len(hidden_assets)} прихованих активів для {identifier}")
        
        # Запуск OSINT колекторів конкурентно
        import asyncio
        tasks = [collector.run_pipeline(identifier, identifier) for collector in self.collectors]
        results = await asyncio.gather(*tasks)

        graph_data = {"nodes": [], "edges": []}
        
        # Базова персона
        person_node_id = f"person_{identifier}"
        graph_data["nodes"].append({
            "node_id": person_node_id,
            "labels": ["Person", "Target"],
            "properties": {
                "name": identifier,
                "type": "physical_person"
            }
        })

        # Функція для мерджу результатів колекторів
        def merge_collector_data(collector_data: Dict[str, Any]):
            graph_data["nodes"].extend(collector_data.get("nodes", []))
            # Додаємо джерело зв'язку від персони
            for edge in collector_data.get("edges", []):
                edge["source"] = person_node_id
                graph_data["edges"].append(edge)
        for collector_data in results:
            merge_collector_data(collector_data)

        # Додаємо знайдені приховані активи до профілю (Neo4j Search)
        formatted_hidden_assets = []
        for ha in hidden_assets:
            formatted_hidden_assets.append({
                "type": ha["type"],
                "chain": " -> ".join(ha["connection_chain"]),
                "relations": " -> ".join(ha["relation_chain"]),
                "depth": ha["depth"],
                "properties": ha["asset"].get("properties", {})
            })

        # Формування підсумкового JSON-досьє
        profile = {
            "basic_info": {
                "name": identifier,
                "identifier": identifier,
                "citizenship": "UA"
            },
            "business_assets": [],
            "property": {},
            "hidden_assets": formatted_hidden_assets,
            "relatives": [],
            "digital_footprint": {
                "social_media": [],
                "crypto_wallets": [],
                "leaks": [],
                "darknet_mentions": []
            },
            "legal_status": {
                "sanctions": [],
                "interpol": False
            }
        }
        
        # Merge all dossier_updates from all results into the final profile
        for res in results:
            updates = res.get("dossier_updates", {})
            if "business_assets" in updates:
                profile["business_assets"].extend(updates["business_assets"])
            if "property" in updates:
                if "property" not in profile:
                    profile["property"] = {}
                # merge dicts like real_estate, vehicles
                for k, v in updates["property"].items():
                    if k not in profile["property"]:
                        profile["property"][k] = []
                    profile["property"][k].extend(v)
            if "relatives" in updates:
                profile["relatives"].extend(updates["relatives"])
            if "digital_footprint" in updates:
                df = updates["digital_footprint"]
                for key in ["social_media", "crypto_wallets", "leaks", "darknet_mentions"]:
                    if key in df:
                        profile["digital_footprint"][key].extend(df[key])
            if "legal_status" in updates:
                ls = updates["legal_status"]
                if "sanctions" in ls:
                    profile["legal_status"]["sanctions"].extend(ls["sanctions"])
        
        return {
            "profile": profile,
            "graph_data": graph_data
        }
