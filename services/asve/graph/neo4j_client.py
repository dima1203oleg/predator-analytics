import os
import logging
from neo4j import GraphDatabase, AsyncGraphDatabase
from typing import Dict, Any

logger = logging.getLogger(__name__)

class Neo4jClient:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URL", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        try:
            self.driver = AsyncGraphDatabase.driver(self.uri, auth=(self.user, self.password))
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None

    async def close(self):
        if self.driver:
            await self.driver.close()

    async def record_system_state(self, infra: Dict, data: Dict, dom: Dict, flow: Dict) -> Dict[str, Any]:
        """
        Builds and records the current system state as a graph.
        Returns a simplified representation of the graph.
        """
        if not self.driver:
            logger.warning("Neo4j driver not initialized. Skipping graph update.")
            return {"status": "SKIPPED", "reason": "No DB connection"}

        query = """
        MERGE (sys:System {name: 'PREDATOR_ASVE'})
        SET sys.last_check = timestamp()
        
        // Infra
        MERGE (infra:Layer {name: 'Infrastructure'})
        MERGE (sys)-[:HAS_LAYER]->(infra)
        SET infra.status = $infra_status
        
        // Data
        MERGE (data:Layer {name: 'DataFlow'})
        MERGE (sys)-[:HAS_LAYER]->(data)
        SET data.status = $data_status
        
        // DOM
        MERGE (dom:Layer {name: 'Frontend_DOM'})
        MERGE (sys)-[:HAS_LAYER]->(dom)
        SET dom.status = $dom_status
        
        // Flow
        MERGE (flow:Layer {name: 'E2E_Flow'})
        MERGE (sys)-[:HAS_LAYER]->(flow)
        SET flow.status = $flow_status
        
        RETURN sys.last_check as last_check
        """
        
        params = {
            "infra_status": infra.get("status", "UNKNOWN"),
            "data_status": data.get("consistency", "UNKNOWN"),
            "dom_status": dom.get("status", "UNKNOWN"),
            "flow_status": flow.get("status", "UNKNOWN")
        }

        try:
            async with self.driver.session() as session:
                result = await session.run(query, params)
                record = await result.single()
                
            return {
                "status": "RECORDED",
                "last_check": record["last_check"] if record else None,
                "nodes_updated": 5
            }
        except Exception as e:
            logger.error(f"Failed to execute Neo4j query: {e}")
            return {"status": "FAIL", "error": str(e)}
