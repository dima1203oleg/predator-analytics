import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SemanticQueryTranspiler:
    """
    Перетворює природний намір (Intent) з UI на технічні запити (OpenSearch DSL, Neo4j Cypher).
    """

    def transpile_to_opensearch(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Генерує OpenSearch Query DSL на основі наміру."""
        query_text = intent.get("query", "")
        action = intent.get("action", "search")
        
        # Базовий DSL
        dsl = {
            "query": {
                "bool": {
                    "must": [],
                    "should": [],
                    "filter": []
                }
            },
            "highlight": {
                "fields": {
                    "*": {}
                }
            }
        }
        
        if action == "search":
            if query_text:
                dsl["query"]["bool"]["must"].append({
                    "multi_match": {
                        "query": query_text,
                        "fields": ["name^3", "description", "content", "tags"],
                        "fuzziness": "AUTO"
                    }
                })
            else:
                dsl["query"]["bool"]["must"].append({"match_all": {}})
                
        elif action == "timeline_bind":
            entity_id = intent.get("entity_id")
            if entity_id:
                dsl["query"]["bool"]["filter"].append({
                    "term": {"related_entities": entity_id}
                })
                
        logger.debug(f"Transpiled OpenSearch DSL: {json.dumps(dsl)}")
        return dsl

    def transpile_to_cypher(self, intent: Dict[str, Any]) -> str:
        """Генерує базовий Neo4j Cypher запит."""
        query_text = intent.get("query", "")
        
        # Спрощений приклад транспіляції
        if query_text:
            # Шукаємо сутність і 1 ступінь зв'язків
            return f"MATCH (n)-[r]-(m) WHERE n.name =~ '(?i).*{query_text}.*' RETURN n, r, m LIMIT 50"
        
        return "MATCH (n) RETURN n LIMIT 10"

transpiler = SemanticQueryTranspiler()
