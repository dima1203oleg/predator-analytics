"""
Knowledge Graph - Semantic Relationships Between System Components
Enables intelligent reasoning about system architecture
"""
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Set, Any, Optional, Tuple
from collections import defaultdict
import logging

logger = logging.getLogger("knowledge.graph")


@dataclass
class Node:
    """A node in the knowledge graph"""
    id: str
    type: str  # file, function, class, api, service, agent
    name: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "type": self.type,
            "name": self.name,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat()
        }


@dataclass
class Edge:
    """A relationship between nodes"""
    source_id: str
    target_id: str
    relation: str  # imports, calls, depends_on, produces, consumes
    weight: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return {
            "source": self.source_id,
            "target": self.target_id,
            "relation": self.relation,
            "weight": self.weight,
            "metadata": self.metadata
        }


class KnowledgeGraph:
    """
    Graph-based knowledge representation for the system

    Features:
    - Component dependency tracking
    - Impact analysis
    - Path finding
    - Clustering detection
    - Change propagation prediction
    """

    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.edges: List[Edge] = []
        self.adjacency: Dict[str, List[Tuple[str, str, float]]] = defaultdict(list)
        self.reverse_adjacency: Dict[str, List[Tuple[str, str, float]]] = defaultdict(list)

        # Relation types
        self.relation_types = [
            "imports",      # A imports B
            "calls",        # A calls B
            "depends_on",   # A depends on B
            "produces",     # A produces B
            "consumes",     # A consumes B
            "inherits",     # A inherits from B
            "implements",   # A implements B
            "tested_by",    # A is tested by B
            "documented_by" # A is documented by B
        ]

    def add_node(self, node_id: str, node_type: str, name: str, metadata: Dict = None) -> Node:
        """Add a node to the graph"""
        node = Node(
            id=node_id,
            type=node_type,
            name=name,
            metadata=metadata or {}
        )
        self.nodes[node_id] = node
        return node

    def add_edge(self, source_id: str, target_id: str, relation: str, weight: float = 1.0, metadata: Dict = None):
        """Add an edge between nodes"""
        edge = Edge(
            source_id=source_id,
            target_id=target_id,
            relation=relation,
            weight=weight,
            metadata=metadata or {}
        )
        self.edges.append(edge)
        self.adjacency[source_id].append((target_id, relation, weight))
        self.reverse_adjacency[target_id].append((source_id, relation, weight))

    def get_node(self, node_id: str) -> Optional[Node]:
        """Get a node by ID"""
        return self.nodes.get(node_id)

    def get_dependencies(self, node_id: str) -> List[Tuple[str, str]]:
        """Get all nodes this node depends on"""
        deps = []
        for target, relation, weight in self.adjacency.get(node_id, []):
            if relation in ["imports", "depends_on", "calls"]:
                deps.append((target, relation))
        return deps

    def get_dependents(self, node_id: str) -> List[Tuple[str, str]]:
        """Get all nodes that depend on this node"""
        deps = []
        for source, relation, weight in self.reverse_adjacency.get(node_id, []):
            if relation in ["imports", "depends_on", "calls"]:
                deps.append((source, relation))
        return deps

    def impact_analysis(self, node_id: str, max_depth: int = 3) -> Dict[str, List[str]]:
        """
        Analyze impact of changing a node
        Returns nodes that might be affected, organized by depth
        """
        affected = {}
        visited = {node_id}
        current_level = [node_id]

        for depth in range(1, max_depth + 1):
            next_level = []
            level_nodes = []

            for current in current_level:
                dependents = self.get_dependents(current)
                for dep_id, relation in dependents:
                    if dep_id not in visited:
                        visited.add(dep_id)
                        next_level.append(dep_id)
                        level_nodes.append(dep_id)

            if level_nodes:
                affected[f"depth_{depth}"] = level_nodes

            current_level = next_level
            if not current_level:
                break

        return affected

    def find_path(self, source_id: str, target_id: str) -> Optional[List[str]]:
        """Find path between two nodes using BFS"""
        if source_id not in self.nodes or target_id not in self.nodes:
            return None

        queue = [(source_id, [source_id])]
        visited = {source_id}

        while queue:
            current, path = queue.pop(0)

            if current == target_id:
                return path

            for neighbor, relation, weight in self.adjacency.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return None

    def find_clusters(self) -> List[Set[str]]:
        """Find connected components (clusters) in the graph"""
        visited = set()
        clusters = []

        for node_id in self.nodes:
            if node_id not in visited:
                cluster = set()
                self._dfs(node_id, visited, cluster)
                if cluster:
                    clusters.append(cluster)

        return clusters

    def _dfs(self, node_id: str, visited: Set[str], cluster: Set[str]):
        """DFS helper for clustering"""
        visited.add(node_id)
        cluster.add(node_id)

        # Follow both directions
        for neighbor, _, _ in self.adjacency.get(node_id, []):
            if neighbor not in visited:
                self._dfs(neighbor, visited, cluster)

        for neighbor, _, _ in self.reverse_adjacency.get(node_id, []):
            if neighbor not in visited:
                self._dfs(neighbor, visited, cluster)

    def get_node_importance(self, node_id: str) -> float:
        """
        Calculate node importance based on connections
        (Simple PageRank-like score)
        """
        if node_id not in self.nodes:
            return 0.0

        # Incoming connections
        incoming = len(self.reverse_adjacency.get(node_id, []))
        # Outgoing connections
        outgoing = len(self.adjacency.get(node_id, []))

        # More incoming = more important (other things depend on it)
        importance = incoming * 2 + outgoing

        # Normalize
        max_connections = max(
            len(self.adjacency.get(n, [])) + len(self.reverse_adjacency.get(n, []))
            for n in self.nodes
        ) if self.nodes else 1

        return importance / max(max_connections * 2, 1)

    def get_critical_nodes(self, top_n: int = 10) -> List[Tuple[str, float]]:
        """Get most critical nodes by importance"""
        scores = [(node_id, self.get_node_importance(node_id)) for node_id in self.nodes]
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]

    def suggest_refactoring(self) -> List[Dict]:
        """
        Suggest refactoring based on graph analysis
        """
        suggestions = []

        # Find highly coupled components
        for node_id in self.nodes:
            deps = len(self.adjacency.get(node_id, []))
            if deps > 10:
                suggestions.append({
                    "type": "reduce_coupling",
                    "node": node_id,
                    "reason": f"High coupling: {deps} dependencies",
                    "priority": "high"
                })

        # Find nodes with no dependents (dead code?)
        for node_id, node in self.nodes.items():
            if node.type == "function":
                dependents = len(self.reverse_adjacency.get(node_id, []))
                if dependents == 0 and "test" not in node_id.lower():
                    suggestions.append({
                        "type": "potential_dead_code",
                        "node": node_id,
                        "reason": "No dependents found",
                        "priority": "low"
                    })

        # Find circular dependencies
        for node_id in self.nodes:
            path = self.find_path(node_id, node_id)
            if path and len(path) > 1:
                suggestions.append({
                    "type": "circular_dependency",
                    "nodes": path,
                    "reason": "Circular dependency detected",
                    "priority": "high"
                })
                break  # Only report one

        return suggestions

    def to_dict(self) -> Dict:
        """Export graph to dictionary"""
        return {
            "nodes": [n.to_dict() for n in self.nodes.values()],
            "edges": [e.to_dict() for e in self.edges],
            "stats": {
                "node_count": len(self.nodes),
                "edge_count": len(self.edges),
                "clusters": len(self.find_clusters())
            }
        }

    def from_codebase(self, root_path: str):
        """
        Build graph from codebase analysis
        (Placeholder - would need AST parsing)
        """
        import os
        import re

        # Scan Python files
        for root, dirs, files in os.walk(root_path):
            # Skip pycache
            dirs[:] = [d for d in dirs if d != "__pycache__"]

            for file in files:
                if file.endswith(".py"):
                    filepath = os.path.join(root, file)
                    rel_path = os.path.relpath(filepath, root_path)

                    # Add file as node
                    file_id = f"file:{rel_path}"
                    self.add_node(file_id, "file", file, {"path": rel_path})

                    # Parse imports (simplified)
                    try:
                        with open(filepath, 'r') as f:
                            content = f.read()

                        # Find imports
                        imports = re.findall(r'^(?:from|import)\s+(\S+)', content, re.MULTILINE)
                        for imp in imports:
                            imp_id = f"module:{imp}"
                            if imp_id not in self.nodes:
                                self.add_node(imp_id, "module", imp)
                            self.add_edge(file_id, imp_id, "imports")

                        # Find class definitions
                        classes = re.findall(r'^class\s+(\w+)', content, re.MULTILINE)
                        for cls in classes:
                            cls_id = f"class:{rel_path}:{cls}"
                            self.add_node(cls_id, "class", cls, {"file": rel_path})
                            self.add_edge(file_id, cls_id, "contains")

                        # Find function definitions
                        functions = re.findall(r'^(?:async\s+)?def\s+(\w+)', content, re.MULTILINE)
                        for func in functions:
                            func_id = f"function:{rel_path}:{func}"
                            self.add_node(func_id, "function", func, {"file": rel_path})
                            self.add_edge(file_id, func_id, "contains")

                    except Exception as e:
                        logger.debug(f"Failed to parse {filepath}: {e}")

        logger.info(f"📊 Knowledge Graph: {len(self.nodes)} nodes, {len(self.edges)} edges")


# Singleton
_knowledge_graph: Optional[KnowledgeGraph] = None

def get_knowledge_graph() -> KnowledgeGraph:
    """Get or create knowledge graph singleton"""
    global _knowledge_graph
    if _knowledge_graph is None:
        _knowledge_graph = KnowledgeGraph()
    return _knowledge_graph
