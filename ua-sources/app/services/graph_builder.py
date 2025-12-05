"""
Graph Builder Service - Entity relationship mapping
Builds connection graphs between entities
"""
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class GraphNode:
    id: str
    type: str  # company, person, tender, etc.
    name: str
    properties: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    source: str
    target: str
    type: str  # owns, related_to, participated_in, etc.
    weight: float = 1.0
    properties: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EntityGraph:
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    root_entity: str
    depth: int
    created_at: datetime


class GraphBuilderService:
    """
    Entity Graph Builder
    Creates relationship graphs from Ukrainian data sources
    """
    
    def __init__(self):
        self.max_depth = 3
        self.max_nodes = 100
    
    async def build_graph(
        self,
        root_entity: str,
        entity_type: str = "company",
        depth: int = 2
    ) -> EntityGraph:
        """
        Build entity relationship graph
        
        Args:
            root_entity: Starting entity (EDRPOU or name)
            entity_type: Type of root entity
            depth: How many levels deep to explore
        """
        depth = min(depth, self.max_depth)
        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []
        visited: Set[str] = set()
        
        # Add root node
        root_node = GraphNode(
            id=root_entity,
            type=entity_type,
            name=root_entity,
            properties={"level": 0}
        )
        nodes[root_entity] = root_node
        
        # Explore connections
        await self._explore_entity(
            entity_id=root_entity,
            current_depth=0,
            max_depth=depth,
            nodes=nodes,
            edges=edges,
            visited=visited
        )
        
        return EntityGraph(
            nodes=list(nodes.values()),
            edges=edges,
            root_entity=root_entity,
            depth=depth,
            created_at=datetime.utcnow()
        )
    
    async def _explore_entity(
        self,
        entity_id: str,
        current_depth: int,
        max_depth: int,
        nodes: Dict[str, GraphNode],
        edges: List[GraphEdge],
        visited: Set[str]
    ):
        """Recursively explore entity connections"""
        if current_depth >= max_depth or entity_id in visited:
            return
        
        if len(nodes) >= self.max_nodes:
            return
        
        visited.add(entity_id)
        
        # Would query real data sources for connections
        # For now, return empty to avoid infinite loops
        connections = await self._get_connections(entity_id)
        
        for conn in connections:
            target_id = conn["id"]
            
            if target_id not in nodes:
                nodes[target_id] = GraphNode(
                    id=target_id,
                    type=conn.get("type", "unknown"),
                    name=conn.get("name", target_id),
                    properties={"level": current_depth + 1}
                )
            
            edges.append(GraphEdge(
                source=entity_id,
                target=target_id,
                type=conn.get("relation", "related_to"),
                weight=conn.get("weight", 1.0)
            ))
            
            # Recursively explore
            await self._explore_entity(
                entity_id=target_id,
                current_depth=current_depth + 1,
                max_depth=max_depth,
                nodes=nodes,
                edges=edges,
                visited=visited
            )
    
    async def _get_connections(self, entity_id: str) -> List[Dict[str, Any]]:
        """Get connections for an entity"""
        # Would query actual data sources
        return []
    
    def to_cytoscape(self, graph: EntityGraph) -> Dict[str, Any]:
        """Convert graph to Cytoscape.js format"""
        elements = []
        
        for node in graph.nodes:
            elements.append({
                "data": {
                    "id": node.id,
                    "label": node.name,
                    "type": node.type,
                    **node.properties
                }
            })
        
        for edge in graph.edges:
            elements.append({
                "data": {
                    "source": edge.source,
                    "target": edge.target,
                    "label": edge.type,
                    "weight": edge.weight
                }
            })
        
        return {"elements": elements}


# Singleton instance
graph_builder = GraphBuilderService()
