import json
import logging
import os
from typing import Any, Dict
from litellm import acompletion

logger = logging.getLogger("autonomous_agents.schema_intelligence")

LITELLM_URL = os.getenv("LITELLM_URL", "http://litellm:4000")
LITELLM_KEY = os.getenv("LITELLM_KEY", "sk-predator")

# Using Nemotron-Cascade-2 (Logic Specialist) for structural and graph logic as per AGENTS.md
MODEL_NAME = "openai/Nemotron-Cascade-2"

class SchemaIntelligenceAgent:
    """Agent that analyzes data payloads and generates Cypher schemas for the Knowledge Graph."""

    async def analyze_schema(self, payload: Any, source_url: str) -> Dict[str, Any]:
        """
        Analyzes a JSON/XML payload and determines the core entities, relationships,
        and generates a generic MERGE Cypher query to insert this data.
        """
        logger.info(f"SchemaIntelligenceAgent: Analyzing schema for {source_url}")
        
        # Convert payload to a small sample string to save context window
        if isinstance(payload, list):
            sample_data = json.dumps(payload[:2], ensure_ascii=False, indent=2)
        else:
            sample_data = json.dumps(payload, ensure_ascii=False, indent=2)[:2000]

        prompt = f"""
        You are a Graph Database (Neo4j) Architect AI.
        Analyze this JSON payload fetched from {source_url}:
        
        {sample_data}
        
        Tasks:
        1. Identify the primary entity type (e.g. Company, Person, Tender, CustomResource).
        2. Extract key attributes.
        3. Write a parameterized Cypher query using `MERGE` to insert this entity into the graph.
        
        Return ONLY valid JSON with this exact structure:
        {{
            "entity_label": "NodeLabel",
            "attributes": ["attr1", "attr2"],
            "cypher_query": "MERGE (n:NodeLabel {{id: $id}}) SET n.attr1 = $attr1..."
        }}
        """

        try:
            response = await acompletion(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                api_base=LITELLM_URL,
                api_key=LITELLM_KEY,
                temperature=0.0
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Clean markdown JSON codeblocks if present
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            
            parsed_result = json.loads(result_text)
            
            logger.info(f"SchemaIntelligenceAgent: Schema analyzed. Entity: {parsed_result.get('entity_label')}")
            return parsed_result
            
        except json.JSONDecodeError as e:
            logger.error(f"SchemaIntelligenceAgent: Failed to parse LLM JSON response: {e}\nResponse: {result_text}")
            return {"error": "JSON parse error"}
        except Exception as e:
            logger.error(f"SchemaIntelligenceAgent: Error analyzing schema: {e}", exc_info=True)
            return {"error": str(e)}
