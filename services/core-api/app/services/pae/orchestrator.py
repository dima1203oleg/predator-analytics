import asyncio
import logging
from typing import Dict, Any

from .transpiler import transpiler

logger = logging.getLogger(__name__)

class HybridContextOrchestrator:
    """
    Паралельно виконує запити до Qdrant, Neo4j та OpenSearch, збираючи єдиний контекст.
    """
    
    async def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Обробляє намір і повертає композитний PredatorEntityProfile."""
        
        opensearch_dsl = transpiler.transpile_to_opensearch(intent)
        cypher_query = transpiler.transpile_to_cypher(intent)
        
        # Паралельне виконання (з моками для fallback-режиму)
        results = await asyncio.gather(
            self._query_opensearch(opensearch_dsl),
            self._query_neo4j(cypher_query),
            self._query_qdrant(intent.get("query", ""))
        )
        
        os_data, graph_data, vector_data = results
        
        # Зшиваємо результати в PredatorEntityProfile
        return {
            "intent_processed": True,
            "query": intent.get("query"),
            "documents": os_data,
            "graph": graph_data,
            "semantic_similar": vector_data,
            "status": "ready",
            "pulse_latency_ms": 42  # Для UI візуалізації The Pulse
        }
        
    async def _query_opensearch(self, dsl: Dict[str, Any]) -> list:
        """Мок запиту до OpenSearch."""
        # У реальному середовищі тут буде виклик AsyncOpenSearch
        await asyncio.sleep(0.05)
        
        query_text = dsl.get("query", {}).get("bool", {}).get("must", [])
        if not query_text:
            # Check if there's a match_phrase query in the DSL for Persona
            match_phrase = dsl.get("query", {}).get("bool", {}).get("should", [])
            if str(match_phrase).find("Кізима Дмитро Миколайович") != -1:
                return [
                    {"id": "doc_person_1", "title": "Паспортні дані: Кізима Дмитро Миколайович", "relevance": 0.99},
                    {"id": "doc_person_2", "title": "Витяг з ЄДР: ФОП Кізима Д.М.", "relevance": 0.97},
                    {"id": "doc_person_3", "title": "Реєстр Нерухомості: с. Угерсько", "relevance": 0.95}
                ]
            return []
            
        return [
            {"id": "doc1", "title": "Митна декларація #A12", "relevance": 0.95},
            {"id": "doc2", "title": "Судове рішення 2026", "relevance": 0.88}
        ]

    async def _query_neo4j(self, query: str) -> Dict[str, list]:
        """Мок запиту до Neo4j."""
        # У реальному середовищі тут буде AsyncGraphDatabase.driver
        await asyncio.sleep(0.07)
        
        if "Кізима Дмитро Миколайович" in query:
             return {
                "nodes": [
                    {"id": "n1", "label": "Person", "name": "Кізима Дмитро Миколайович", "dob": "12.03.1985", "address": "с. Угерсько"},
                    {"id": "n2", "label": "Company", "name": "ТОВ КОМПАНІЯ 38294012"},
                    {"id": "n3", "label": "Alert", "name": "Breach Forum Dump 2023"}
                ],
                "edges": [
                    {"source": "n1", "target": "n2", "type": "OWNER"},
                    {"source": "n1", "target": "n3", "type": "HAS_LEAK"}
                ]
            }
        
        return {
            "nodes": [
                {"id": "n1", "label": "Person", "name": "Target"},
                {"id": "n2", "label": "Company", "name": "Offshore Corp"}
            ],
            "edges": [
                {"source": "n1", "target": "n2", "type": "OWNER"}
            ]
        }
        
    async def _query_qdrant(self, text: str) -> list:
        """Мок векторного пошуку."""
        await asyncio.sleep(0.03)
        return ["Similar Entity A", "Similar Entity B"]

orchestrator = HybridContextOrchestrator()
