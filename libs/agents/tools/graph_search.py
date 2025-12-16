from libs.agents.tools.registry import registry
from libs.core.database import async_session_maker
from libs.core.models import GraphNode, GraphEdge
from sqlalchemy import select, or_, and_
import uuid
import logging

logger = logging.getLogger(__name__)

@registry.register(name="search_knowledge_graph", description="Search the knowledge graph for entities and relationships")
async def search_knowledge_graph(query: str, tenant_id: str, depth: int = 1):
    """
    Search key entities and their relationships in the Knowledge Graph.
    Useful for answering questions about connections between people, companies, and events.
    """
    if not query:
        return "Please provide a query string."

    async with async_session_maker() as session:
        try:
            # 1. Find Seed Nodes
            stmt = select(GraphNode).where(
                and_(
                    GraphNode.tenant_id == uuid.UUID(tenant_id),
                    GraphNode.name.ilike(f"%{query}%")
                )
            ).limit(5)

            result = await session.execute(stmt)
            seed_nodes = result.scalars().all()

            if not seed_nodes:
                return f"No entities found matching '{query}'"

            # 2. Traverse
            collected_nodes = {str(n.id): n for n in seed_nodes}
            collected_edges = {}
            current_layer_ids = list(collected_nodes.keys())

            for _ in range(depth):
                if not current_layer_ids:
                    break

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
                    eid = str(edge.id)
                    if eid in collected_edges: continue

                    collected_edges[eid] = edge

                    sid = str(edge.source_id)
                    tid = str(edge.target_id)

                    # Add missing nodes to fetch list
                    if sid not in collected_nodes: next_layer_ids.add(sid)
                    if tid not in collected_nodes: next_layer_ids.add(tid)

                if not next_layer_ids:
                    break

                # Fetch new nodes
                if next_layer_ids:
                    stmt = select(GraphNode).where(GraphNode.id.in_(list(next_layer_ids)))
                    result = await session.execute(stmt)
                    neighbors = result.scalars().all()
                    for n in neighbors:
                        collected_nodes[str(n.id)] = n

                current_layer_ids = list(next_layer_ids)

            # 3. Format Validation
            # LLMs prefer text summaries or simplified JSON
            summary = []
            summary.append(f"Found {len(collected_nodes)} entities and {len(collected_edges)} relationships.")

            for edge in collected_edges.values():
                source = collected_nodes.get(str(edge.source_id))
                target = collected_nodes.get(str(edge.target_id))
                if source and target:
                    summary.append(f"- {source.name} [{source.label}] --{edge.relation}--> {target.name} [{target.label}]")

            return "\n".join(summary)

        except Exception as e:
            logger.error(f"Graph search error: {e}")
            return f"Error querying graph: {str(e)}"
