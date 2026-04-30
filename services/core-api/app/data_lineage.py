import os
from typing import Any

# Simple data lineage collector for Predator Analytics
# Scans known pipeline components and builds a directed graph of data flow.

class DataLineage:
    def __init__(self) -> None:
        self.nodes: dict[str, dict[str, Any]] = {}
        self.edges: list[dict[str, str]] = []

    def add_node(self, name: str, details: dict[str, Any] | None = None) -> None:
        if name not in self.nodes:
            self.nodes[name] = details or {}

    def add_edge(self, src: str, dst: str) -> None:
        self.edges.append({"source": src, "target": dst})

    def export_dot(self) -> str:
        lines = ["digraph DataLineage {", "rankdir=LR;"]
        for node, attrs in self.nodes.items():
            label = attrs.get('label', node)
            lines.append(f'    "{node}" [label="{label}"];')
        for edge in self.edges:
            lines.append(f'    "{edge["source"]}" -> "{edge["target"]}";')
        lines.append("}")
        return "\n".join(lines)

    def export_md(self) -> str:
        md = ["# Data Lineage Overview", ""]
        md.append("## Nodes")
        for n, a in self.nodes.items():
            md.append(f"- **{n}**: {a.get('description', '')}")
        md.append("\n## Edges")
        for e in self.edges:
            md.append(f"- {e['source']} → {e['target']}")
        return "\n".join(md)

def collect_lineage() -> DataLineage:
    dl = DataLineage()
    # Define sources
    dl.add_node('PostgreSQL', {'label': 'PostgreSQL', 'description': 'Transactional DB'})
    dl.add_node('ClickHouse', {'label': 'ClickHouse', 'description': 'Analytical DB'})
    dl.add_node('Kafka', {'label': 'Kafka', 'description': 'Event bus'})
    dl.add_node('MinIO', {'label': 'MinIO', 'description': 'Object storage'})
    dl.add_node('Neo4j', {'label': 'Neo4j', 'description': 'Graph DB'})
    dl.add_node('OpenSearch', {'label': 'OpenSearch', 'description': 'Search engine'})
    dl.add_node('Qdrant', {'label': 'Qdrant', 'description': 'Vector DB'})
    dl.add_node('ML Pipeline', {'label': 'ML Pipeline', 'description': 'Model training & inference'})
    dl.add_node('API', {'label': 'API', 'description': 'FastAPI services'})
    # Define edges (simplified example)
    dl.add_edge('PostgreSQL', 'Kafka')
    dl.add_edge('Kafka', 'MinIO')
    dl.add_edge('MinIO', 'Neo4j')
    dl.add_edge('Neo4j', 'OpenSearch')
    dl.add_edge('OpenSearch', 'Qdrant')
    dl.add_edge('Qdrant', 'ML Pipeline')
    dl.add_edge('ML Pipeline', 'API')
    dl.add_edge('API', 'PostgreSQL')
    return dl

def main() -> None:
    lineage = collect_lineage()
    out_dir = os.getenv('LINEAGE_OUTPUT_DIR', 'lineage_output')
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'lineage.dot'), 'w') as f:
        f.write(lineage.export_dot())
    with open(os.path.join(out_dir, 'lineage.md'), 'w') as f:
        f.write(lineage.export_md())

if __name__ == '__main__':
    main()
