import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class DigitalSystemGraph:
    """
    Система будується як граф:
    * nodes = services
    * edges = data flow / API / events
    """
    def __init__(self):
        self.nodes = {}
        self.edges = []
        
    def add_node(self, name: str, node_type: str, status: str = "unknown"):
        self.nodes[name] = {"type": node_type, "status": status}
        logger.info(f"Додано вузол графа: {name} ({node_type})")
        
    def add_edge(self, source: str, target: str, edge_type: str):
        self.edges.append({"source": source, "target": target, "type": edge_type})
        logger.info(f"Додано зв'язок: {source} -> {target} [{edge_type}]")
        
    def build_initial_graph(self):
        """Побудова базового графа PREDATOR ANALYTICS"""
        # Infrastructure / Services
        self.add_node("excel_source", "data_source")
        self.add_node("core_api", "service")
        self.add_node("ingestion_worker", "service")
        self.add_node("graph_service", "service")
        self.add_node("frontend_ui", "ui")
        
        # Databases
        self.add_node("postgres", "database")
        self.add_node("clickhouse", "database")
        self.add_node("neo4j", "database")
        self.add_node("qdrant", "database")
        self.add_node("opensearch", "database")
        self.add_node("redis", "database")
        self.add_node("redpanda", "message_broker")
        
        # ML / AI
        self.add_node("deepseek_r1", "model")
        
        # Edges
        self.add_edge("excel_source", "core_api", "upload")
        self.add_edge("core_api", "redpanda", "publish_event")
        self.add_edge("redpanda", "ingestion_worker", "consume_event")
        self.add_edge("ingestion_worker", "postgres", "write_ssot")
        self.add_edge("ingestion_worker", "clickhouse", "write_olap")
        self.add_edge("ingestion_worker", "neo4j", "build_graph")
        self.add_edge("ingestion_worker", "qdrant", "write_vectors")
        self.add_edge("ingestion_worker", "opensearch", "index_text")
        self.add_edge("core_api", "frontend_ui", "websocket_sync")
        
    def update_node_status(self, name: str, status: str):
        if name in self.nodes:
            self.nodes[name]["status"] = status
            
    def get_snapshot(self) -> Dict[str, Any]:
        return {
            "nodes": self.nodes,
            "edges": self.edges,
            "healthy_nodes": sum(1 for n in self.nodes.values() if n["status"] == "healthy"),
            "total_nodes": len(self.nodes)
        }
