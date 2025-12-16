import json
import logging
import uuid
from typing import List, Dict, Any
from sqlalchemy import select, and_, or_, text
from libs.core.database import async_session_maker
from libs.core.models import GraphNode, GraphEdge, Document
from app.services.llm.service import llm_service

logger = logging.getLogger(__name__)

GRAPH_EXTRACTION_PROMPT = """
You are an expert Knowledge Graph extractor. Analyze the provided text and extract entities and relationships.
Focus on identifying key people, organizations, projects, locations, and their connections.

Required JSON Structure:
{
  "nodes": [
    {"name": "Entity Name", "label": "TYPE", "properties": {"role": "CEO", "sentiment": "positive"}}
  ],
  "edges": [
    {"source": "Entity Name", "target": "Entity Name", "relation": "RELATION_TYPE", "weight": 0.8}
  ]
}

Entity Types: PERSON, ORGANIZATION, LOCATION, PROJECT, EVENT, CONCEPT.
Relation Types: WORKS_AT, LEADS, LOCATED_IN, PARTNER_WITH, COMPETES_WITH, INVESTED_IN, MENTIONED_IN.

Rules:
1. De-duplicate entities (e.g., "Google" and "Google Inc." should be one node).
2. Relationships must be directed.
3. Return ONLY valid JSON.
"""

class GraphBuilderService:
    def __init__(self):
        pass

    async def extract_and_build(self, doc_id: str, text: str, tenant_id: str):
        """
        Extract entities/edges via LLM and store in Postgres Graph tables.
        """
        if not text or len(text) < 50:
            logger.warning(f"Text too short for graph extraction: {doc_id}")
            return

        try:
            # 1. Call LLM
            response = await llm_service.generate(
                prompt=text,
                system=GRAPH_EXTRACTION_PROMPT,
                provider="gemini", # Prefer cheap/fast model or default
                temperature=0.0,
                format="json" # If provider supports it, otherwise prompt instructions imply it
            )

            if not response.success:
                logger.error(f"LLM failed to extract graph: {response.error}")
                return

            graph_data = self._parse_llm_json(response.content)
            if not graph_data:
                return

            # 2. Store in DB
            await self._persist_graph(graph_data, doc_id, tenant_id)

            return graph_data

        except Exception as e:
            logger.error(f"Graph extraction error: {e}")

    def _parse_llm_json(self, content: str) -> Dict[str, Any]:
        """Clean and parse JSON from LLM response"""
        try:
            # Extract JSON block if wrapped in ```json ... ```
            clean_content = content
            if "```json" in content:
                clean_content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                clean_content = content.split("```")[0].strip()

            return json.loads(clean_content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e} - Content: {content[:100]}...")
            return None

    async def _persist_graph(self, data: Dict, doc_id: str, tenant_id: str):
        """Save nodes and edges to Postgres, handling deduplication"""

        nodes_map = {} # Name -> UUID

        async with async_session_maker() as session:
            try:
                # --- PROCESS NODES ---
                for node_data in data.get("nodes", []):
                    name = node_data.get("name")
                    label = node_data.get("label", "CONCEPT")
                    if not name: continue

                    # Check existence by name + tenant
                    stmt = select(GraphNode).where(
                        and_(GraphNode.name == name, GraphNode.tenant_id == uuid.UUID(tenant_id))
                    )
                    result = await session.execute(stmt)
                    existing_node = result.scalar_one_or_none()

                    if existing_node:
                        # Update usage/timestamp if needed?
                        nodes_map[name] = existing_node.id
                    else:
                        new_node = GraphNode(
                            tenant_id=uuid.UUID(tenant_id),
                            name=name,
                            label=label,
                            properties=node_data.get("properties", {})
                        )
                        session.add(new_node)
                        await session.flush() # Get ID
                        nodes_map[name] = new_node.id

                # --- PROCESS EDGES ---
                for edge_data in data.get("edges", []):
                    source_name = edge_data.get("source")
                    target_name = edge_data.get("target")

                    if source_name not in nodes_map or target_name not in nodes_map:
                        continue # Skip if node creation failed

                    source_id = nodes_map[source_name]
                    target_id = nodes_map[target_name]
                    relation = edge_data.get("relation", "RELATED_TO")

                    # Check existence
                    stmt = select(GraphEdge).where(
                        and_(
                            GraphEdge.source_id == source_id,
                            GraphEdge.target_id == target_id,
                            GraphEdge.relation == relation
                        )
                    )
                    result = await session.execute(stmt)
                    existing_edge = result.scalar_one_or_none()

                    if not existing_edge:
                        new_edge = GraphEdge(
                            source_id=source_id,
                            target_id=target_id,
                            relation=relation,
                            weight=edge_data.get("weight", 1.0),
                            doc_id=uuid.UUID(doc_id),
                            properties=edge_data.get("properties", {})
                        )
                        session.add(new_edge)

                await session.commit()
                logger.info(f"Graph persisted for doc {doc_id}: {len(data['nodes'])} nodes, {len(data['edges'])} edges")

            except Exception as e:
                await session.rollback()
                logger.error(f"DB persistence failed: {e}")
                raise

    async def search_graph(self, query: str, tenant_id: str, depth: int = 1) -> Dict[str, Any]:
        """
        Search the Knowledge Graph for entities matching the query and return the subgraph.
        """
        if not query:
            return {"nodes": [], "edges": []}

        async with async_session_maker() as session:
            try:
                # 1. Find Seed Nodes (Fuzzy Match / Trigram)
                # Using simple ILIKE for portability, but trigram (similar_to) is better if extension enabled
                stmt = select(GraphNode).where(
                    and_(
                        GraphNode.tenant_id == uuid.UUID(tenant_id),
                        GraphNode.name.ilike(f"%{query}%")
                    )
                ).limit(5)

                result = await session.execute(stmt)
                seed_nodes = result.scalars().all()

                if not seed_nodes:
                    return {"nodes": [], "edges": []}

                message = f"Found {len(seed_nodes)} seed nodes for query '{query}'"
                logger.debug(message)

                # 2. Traverse Graph (BFS up to depth)
                collected_node_ids = {n.id for n in seed_nodes}
                collected_nodes = {str(n.id): n for n in seed_nodes}
                collected_edges = {}

                current_layer_ids = list(collected_node_ids)

                for _ in range(depth):
                    if not current_layer_ids:
                        break

                    # Find edges where current nodes are source OR target
                    stmt = select(GraphEdge).where(
                        or_(
                            GraphEdge.source_id.in_(current_layer_ids),
                            GraphEdge.target_id.in_(current_layer_ids)
                        )
                    )
                    result = await session.execute(stmt)
                    edges = result.scalars().all()

                    next_layer_ids = set()

                    for edge in edges:
                        if str(edge.id) in collected_edges:
                            continue

                        collected_edges[str(edge.id)] = edge

                        # Identify neighbor
                        neighbor_id = edge.target_id if edge.source_id in collected_node_ids else edge.source_id

                        if neighbor_id not in collected_node_ids:
                            next_layer_ids.add(neighbor_id)
                            collected_node_ids.add(neighbor_id)

                    if not next_layer_ids:
                        break

                    # Fetch neighbor nodes
                    if next_layer_ids:
                        stmt = select(GraphNode).where(GraphNode.id.in_(list(next_layer_ids)))
                        result = await session.execute(stmt)
                        neighbors = result.scalars().all()
                        for n in neighbors:
                            collected_nodes[str(n.id)] = n

                    current_layer_ids = list(next_layer_ids)

                # 3. Format Response
                nodes_list = [
                    {
                        "id": str(n.id),
                        "name": n.name,
                        "label": n.label,
                        "properties": n.properties
                    }
                    for n in collected_nodes.values()
                ]

                edges_list = [
                    {
                        "id": str(e.id),
                        "source": str(e.source_id),
                        "target": str(e.target_id),
                        "relation": e.relation,
                        "weight": e.weight,
                        "doc_id": str(e.doc_id) if e.doc_id else None
                    }
                    for e in collected_edges.values()
                ]

                return {
                    "nodes": nodes_list,
                    "edges": edges_list,
                    "stats": {
                        "nodes_count": len(nodes_list),
                        "edges_count": len(edges_list)
                    }
                }

            except Exception as e:
                logger.error(f"Graph search failed: {e}")
                return {"error": str(e)}

graph_builder = GraphBuilderService()
