"""🧠 GRAPH RAG MEMORY - Knowledge Graph with Semantic Reasoning.
===============================================================
Core component for AZR v40 Sovereign Architecture.

This module provides:
- Knowledge Graph for storing relationships
- Semantic embeddings for similarity search
- Reasoning chain reconstruction
- Context-aware decision making
- "Why did you do that?" explanations

Constitutional Enforcement:
- Axiom 4: Transparency (All decisions are traceable)
- Axiom 16: Autonomous Evolution (Learning from experience)

Python 3.12 | Ukrainian Documentation
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from enum import Enum
import hashlib
import json
import math
from pathlib import Path
import threading
import time
from typing import Any


def simple_hash(text: str) -> str:
    """Simple hash for IDs."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


# ============================================================================
# 📊 KNOWLEDGE GRAPH TYPES
# ============================================================================


class NodeType(Enum):
    """Types of nodes in the knowledge graph."""

    DECISION = "decision"  # AZR decision node
    ACTION = "action"  # Executed action
    OBSERVATION = "observation"  # System observation
    CONTEXT = "context"  # Contextual information
    OUTCOME = "outcome"  # Result of action
    RULE = "rule"  # Constitutional rule
    PATTERN = "pattern"  # Learned pattern
    ENTITY = "entity"  # System entity


class EdgeType(Enum):
    """Types of edges in the knowledge graph."""

    TRIGGERED_BY = "triggered_by"  # A was triggered by B
    RESULTED_IN = "resulted_in"  # A resulted in B
    OBSERVED_DURING = "observed_during"  # A observed during B
    LEARNED_FROM = "learned_from"  # Pattern learned from experience
    VIOLATES = "violates"  # Action violates rule
    COMPLIES_WITH = "complies_with"  # Action complies with rule
    SIMILAR_TO = "similar_to"  # Semantic similarity
    PRECEDED_BY = "preceded_by"  # Temporal ordering
    CAUSED = "caused"  # Causal relationship


@dataclass
class KnowledgeNode:
    """Node in the knowledge graph."""

    node_id: str
    node_type: NodeType
    label: str
    properties: dict[str, Any] = field(default_factory=dict)
    embedding: list[float] | None = None
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["node_type"] = self.node_type.value
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> KnowledgeNode:
        data["node_type"] = NodeType(data["node_type"])
        return cls(**data)


@dataclass
class KnowledgeEdge:
    """Edge in the knowledge graph."""

    edge_id: str
    source_id: str
    target_id: str
    edge_type: EdgeType
    properties: dict[str, Any] = field(default_factory=dict)
    weight: float = 1.0
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["edge_type"] = self.edge_type.value
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> KnowledgeEdge:
        data["edge_type"] = EdgeType(data["edge_type"])
        return cls(**data)


@dataclass
class ReasoningChain:
    """Chain of reasoning for a decision."""

    decision_id: str
    steps: list[dict[str, Any]]
    confidence: float
    explanation: str
    supporting_evidence: list[str]
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ============================================================================
# 🧮 SIMPLE EMBEDDING (No external dependencies)
# ============================================================================


class SimpleEmbedder:
    """Simple TF-IDF-like embedder without external dependencies.
    For production, replace with sentence-transformers or similar.
    """

    def __init__(self, dim: int = 128):
        self.dim = dim
        self.vocabulary: dict[str, int] = {}
        self.idf: dict[str, float] = {}
        self.doc_count = 0

    def _tokenize(self, text: str) -> list[str]:
        """Simple tokenization."""
        import re

        return re.findall(r"\w+", text.lower())

    def fit(self, texts: list[str]) -> None:
        """Build vocabulary from texts."""
        doc_freq: dict[str, int] = defaultdict(int)

        for text in texts:
            tokens = set(self._tokenize(text))
            for token in tokens:
                doc_freq[token] += 1

        self.doc_count = len(texts)

        # Top words by frequency, limited to dim
        sorted_words = sorted(doc_freq.items(), key=lambda x: -x[1])[: self.dim]
        self.vocabulary = {word: i for i, (word, _) in enumerate(sorted_words)}

        # IDF calculation
        for word, freq in doc_freq.items():
            if word in self.vocabulary:
                self.idf[word] = math.log(self.doc_count / (1 + freq))

    def embed(self, text: str) -> list[float]:
        """Generate embedding for text."""
        tokens = self._tokenize(text)

        # Term frequency
        tf: dict[str, int] = defaultdict(int)
        for token in tokens:
            tf[token] += 1

        # TF-IDF vector
        vector = [0.0] * self.dim

        for word, count in tf.items():
            if word in self.vocabulary:
                idx = self.vocabulary[word]
                tfidf = count * self.idf.get(word, 1.0)
                vector[idx] = tfidf

        # Normalize
        norm = math.sqrt(sum(x * x for x in vector)) or 1.0
        return [x / norm for x in vector]

    def similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Cosine similarity between vectors."""
        if len(vec1) != len(vec2):
            return 0.0

        return sum(a * b for a, b in zip(vec1, vec2, strict=False))


# ============================================================================
# 🧠 KNOWLEDGE GRAPH
# ============================================================================


class KnowledgeGraph:
    """🏛️ Граф Знань для Когнітивного Контексту.

    Зберігає:
    - Рішення та їх причини
    - Зв'язки між подіями
    - Патерни успіху/невдачі
    - Reasoning chains для пояснень

    Можливості:
    - "Чому ти прийняв це рішення?"
    - Пошук схожих ситуацій
    - Виведення причинно-наслідкових зв'язків
    """

    def __init__(self, storage: Any):
        from app.libs.core.storage import FileStorageProvider, StorageProvider

        if isinstance(storage, (str, Path)):
            self.storage = FileStorageProvider(Path(storage))
        elif isinstance(storage, StorageProvider):
            self.storage = storage
        else:
            raise TypeError(f"Invalid storage type: {type(storage)}")

        # Relative paths for abstraction
        self.nodes_rel_path = "knowledge/knowledge_nodes.jsonl"
        self.edges_rel_path = "knowledge/knowledge_edges.jsonl"

        self._lock = threading.Lock()

        # Graph storage
        self._nodes: dict[str, KnowledgeNode] = {}
        self._edges: dict[str, KnowledgeEdge] = {}

        # Indexes for fast lookup
        self._outgoing: dict[str, list[str]] = defaultdict(list)  # node_id -> edge_ids
        self._incoming: dict[str, list[str]] = defaultdict(list)  # node_id -> edge_ids
        self._by_type: dict[NodeType, list[str]] = defaultdict(list)  # type -> node_ids

        # Embedder
        self.embedder = SimpleEmbedder()
        self._embedding_texts: list[str] = []

        self._load()

    def _load(self) -> None:
        """Load graph from storage."""
        nodes_content = self.storage.read_text(self.nodes_rel_path)
        if nodes_content:
            for line in nodes_content.splitlines():
                if line.strip():
                    try:
                        node = KnowledgeNode.from_dict(json.loads(line))
                        self._nodes[node.node_id] = node
                        self._by_type[node.node_type].append(node.node_id)
                        if node.properties.get("text"):
                            self._embedding_texts.append(node.properties["text"])
                    except Exception:
                        pass

        edges_content = self.storage.read_text(self.edges_rel_path)
        if edges_content:
            for line in edges_content.splitlines():
                if line.strip():
                    try:
                        edge = KnowledgeEdge.from_dict(json.loads(line))
                        self._edges[edge.edge_id] = edge
                        self._outgoing[edge.source_id].append(edge.edge_id)
                        self._incoming[edge.target_id].append(edge.edge_id)
                    except Exception:
                        pass

        # Fit embedder on existing texts
        if self._embedding_texts:
            self.embedder.fit(self._embedding_texts)

    def add_node(
        self,
        node_type: NodeType,
        label: str,
        properties: dict[str, Any] | None = None,
        node_id: str | None = None,
    ) -> KnowledgeNode:
        """Add node to graph."""
        with self._lock:
            if node_id is None:
                node_id = f"{node_type.value}_{simple_hash(f'{label}:{time.time_ns()}')}"

            properties = properties or {}

            # Generate embedding if text available
            text = properties.get("text", label)
            self._embedding_texts.append(text)

            # Refit embedder periodically
            if len(self._embedding_texts) % 100 == 0:
                self.embedder.fit(self._embedding_texts)

            embedding = self.embedder.embed(text)

            node = KnowledgeNode(
                node_id=node_id,
                node_type=node_type,
                label=label,
                properties=properties,
                embedding=embedding,
            )

            self._nodes[node_id] = node
            self._by_type[node_type].append(node_id)

            # Persist
            self.storage.append_line(self.nodes_rel_path, node.to_dict())

            return node

    def add_edge(
        self,
        source_id: str,
        target_id: str,
        edge_type: EdgeType,
        properties: dict[str, Any] | None = None,
        weight: float = 1.0,
    ) -> KnowledgeEdge | None:
        """Add edge between nodes."""
        if source_id not in self._nodes or target_id not in self._nodes:
            return None

        with self._lock:
            edge_id = (
                f"edge_{simple_hash(f'{source_id}:{target_id}:{edge_type.value}:{time.time_ns()}')}"
            )

            edge = KnowledgeEdge(
                edge_id=edge_id,
                source_id=source_id,
                target_id=target_id,
                edge_type=edge_type,
                properties=properties or {},
                weight=weight,
            )

            self._edges[edge_id] = edge
            self._outgoing[source_id].append(edge_id)
            self._incoming[target_id].append(edge_id)

            # Persist
            self.storage.append_line(self.edges_rel_path, edge.to_dict())

            return edge

    def get_node(self, node_id: str) -> KnowledgeNode | None:
        """Get node by ID."""
        return self._nodes.get(node_id)

    def get_neighbors(self, node_id: str, direction: str = "outgoing") -> list[KnowledgeNode]:
        """Get neighboring nodes."""
        neighbors = []

        if direction in ["outgoing", "both"]:
            for edge_id in self._outgoing.get(node_id, []):
                edge = self._edges.get(edge_id)
                if edge:
                    neighbor = self._nodes.get(edge.target_id)
                    if neighbor:
                        neighbors.append(neighbor)

        if direction in ["incoming", "both"]:
            for edge_id in self._incoming.get(node_id, []):
                edge = self._edges.get(edge_id)
                if edge:
                    neighbor = self._nodes.get(edge.source_id)
                    if neighbor:
                        neighbors.append(neighbor)

        return neighbors

    def find_similar(self, text: str, limit: int = 5) -> list[tuple[KnowledgeNode, float]]:
        """Find nodes similar to given text."""
        query_embedding = self.embedder.embed(text)

        similarities = []
        for node in self._nodes.values():
            if node.embedding:
                sim = self.embedder.similarity(query_embedding, node.embedding)
                similarities.append((node, sim))

        # Sort by similarity descending
        similarities.sort(key=lambda x: -x[1])
        return similarities[:limit]

    def get_reasoning_chain(self, decision_id: str) -> ReasoningChain | None:
        """Reconstruct reasoning chain for a decision.
        Traverses graph backward to find causes.
        """
        decision_node = self._nodes.get(decision_id)
        if not decision_node:
            return None

        steps = []
        evidence = []
        visited = set()

        def traverse_backward(node_id: str, depth: int = 0):
            if node_id in visited or depth > 10:
                return
            visited.add(node_id)

            node = self._nodes.get(node_id)
            if not node:
                return

            step = {
                "depth": depth,
                "node_id": node_id,
                "type": node.node_type.value,
                "label": node.label,
                "properties": node.properties,
            }
            steps.append(step)

            # Find causes (incoming edges with causal types)
            for edge_id in self._incoming.get(node_id, []):
                edge = self._edges.get(edge_id)
                if edge and edge.edge_type in [
                    EdgeType.TRIGGERED_BY,
                    EdgeType.CAUSED,
                    EdgeType.OBSERVED_DURING,
                ]:
                    evidence.append(f"{edge.edge_type.value}: {edge.source_id} → {edge.target_id}")
                    traverse_backward(edge.source_id, depth + 1)

        traverse_backward(decision_id)

        # Generate explanation
        if len(steps) <= 1:
            explanation = f"Рішення '{decision_node.label}' було прийнято автономно."
        else:
            causes = [s["label"] for s in steps[1:4]]
            explanation = (
                f"Рішення '{decision_node.label}' було прийнято через: {', '.join(causes)}"
            )

        return ReasoningChain(
            decision_id=decision_id,
            steps=steps,
            confidence=min(1.0, len(evidence) * 0.2),
            explanation=explanation,
            supporting_evidence=evidence,
        )

    def record_decision(
        self,
        decision_label: str,
        context: dict[str, Any],
        observations: list[str],
        outcome: str | None = None,
    ) -> str:
        """Record a decision with full context.
        Creates nodes for decision, context, observations, and links them.
        """
        # Create decision node
        decision = self.add_node(
            NodeType.DECISION, decision_label, {"text": decision_label, **context}
        )

        # Create observation nodes and link
        for obs_text in observations:
            obs_node = self.add_node(NodeType.OBSERVATION, obs_text[:100], {"text": obs_text})
            self.add_edge(obs_node.node_id, decision.node_id, EdgeType.TRIGGERED_BY)

        # Create outcome node if provided
        if outcome:
            outcome_node = self.add_node(NodeType.OUTCOME, outcome, {"text": outcome})
            self.add_edge(decision.node_id, outcome_node.node_id, EdgeType.RESULTED_IN)

        return decision.node_id

    def explain_decision(self, decision_id: str) -> str:
        """Generate human-readable explanation for decision."""
        chain = self.get_reasoning_chain(decision_id)

        if not chain:
            return "Рішення не знайдено."

        lines = [
            f"📋 Пояснення рішення: {decision_id}",
            "",
            f"🎯 {chain.explanation}",
            "",
            f"📊 Ланцюг причин ({len(chain.steps)} кроків):",
        ]

        for step in chain.steps[:5]:
            indent = "  " * step["depth"]
            lines.append(f"{indent}→ [{step['type']}] {step['label']}")

        if chain.supporting_evidence:
            lines.append("\n📎 Докази:")
            for ev in chain.supporting_evidence[:5]:
                lines.append(f"  • {ev}")

        lines.append(f"\n🔮 Впевненість: {chain.confidence:.0%}")

        return "\n".join(lines)

    def get_stats(self) -> dict[str, Any]:
        """Get graph statistics."""
        {t.value: len(ids) for t, ids in self._by_type.items()}

        return {
            "nodes": len(self._nodes),
            "edges": len(self._edges),
            "by_type": {t.value: len(ids) for t, ids in self._by_type.items()},
            "storage": str(self.storage.base_path),
        }


# ============================================================================
# ============================================================================

_knowledge_graph_instance: KnowledgeGraph | None = None
_kg_lock = threading.Lock()


def get_knowledge_graph(storage: Any = "/tmp/azr_logs") -> KnowledgeGraph:
    """Get or create global Knowledge Graph instance."""
    global _knowledge_graph_instance

    with _kg_lock:
        if _knowledge_graph_instance is None:
            _knowledge_graph_instance = KnowledgeGraph(storage)
        return _knowledge_graph_instance


# ============================================================================
# 🧪 SELF-TEST
# ============================================================================

if __name__ == "__main__":

    # Create knowledge graph
    kg = KnowledgeGraph("/tmp/azr_kg_test")

    # Record some decisions

    decision1 = kg.record_decision(
        "Масштабування API Gateway",
        {"reason": "high_load", "health_score": 45.0},
        ["Навантаження CPU 95%", "Час відповіді API > 2s", "Черга запитів переповнена"],
        "Успішне масштабування, латентність знижена на 60%",
    )

    decision2 = kg.record_decision(
        "Запуск очищення кешу",
        {"reason": "memory_pressure", "health_score": 70.0},
        ["Використання RAM 85%", "GC паузи > 100ms"],
        "Звільнено 2GB пам'яті",
    )

    decision3 = kg.record_decision(
        "Блокування підозрілого запиту",
        {"reason": "security_alert", "source_ip": "192.168.1.100"},
        ["SQL injection спроба", "Аномальна частота запитів"],
        "Запит заблоковано, IP додано в blacklist",
    )


    # Link decisions
    kg.add_edge(decision1, decision2, EdgeType.PRECEDED_BY)

    # Find similar situations
    similar = kg.find_similar("high CPU usage memory", limit=3)
    for _node, _sim in similar:
        pass

    # Get explanation

    # Stats
