# 🔍 Hybrid Search with RRF (Reciprocal Rank Fusion)

Implementation details for Predator Analytics v21.0.

## Overview

We use **Reciprocal Rank Fusion (RRF)** to combine results from two disparate search engines without requiring normalized scores. This provides a robust "best of both worlds" ranking.

### Components
1. **OpenSearch**: BM25 (Keyword search) - Best for exact matches, acronyms, and specific IDs.
2. **Qdrant**: Vector Similarity (Semantic search) - Best for conceptual matches and meaning.

## Algorithm

RRF score is calculated for each document $d$ as:

$$ score(d) = \sum_{r \in R} \frac{1}{k + rank_r(d)} $$

where:
- $R$ is the set of rank lists (one from OpenSearch, one from Qdrant).
- $k$ is a constant (set to **60**), which mitigates the impact of high rankings by outliers.
- $rank_r(d)$ is the position of document in list $r$.

The implementation is located in: `ua-sources/app/services/search_fusion.py`.

## Usage API

### Hybrid Search (Recommended)
Combines both engines using RRF.

```http
GET /api/v1/search?q=your query&mode=hybrid
```

Response includes `combinedScore` calculated via RRF.

### Text Only
Uses only OpenSearch (BM25).

```http
GET /api/v1/search?q=your query&mode=text
```

### Semantic Only
Uses only Qdrant (Vector).

```http
GET /api/v1/search?q=your query&mode=semantic
```

## Performance & Optimization

### Lazy Loading and OOM Prevention
To prevent Out-Of-Memory (OOM) kills on constrained environments (like standard Dev/Staging servers with <8GB RAM), we implement **Lazy Loading** for ML models.

- **Behavior**: Models (BERT, Cross-Encoder) are NOT loaded at startup.
- **Trigger**: Models are loaded into RAM only upon the first request that explicitly requires them.
- **Configuration**: Controlled via `PRELOAD_MODELS` environment variable.

| Env Var | Value | Description |
|---------|-------|-------------|
| `PRELOAD_MODELS` | `false` | (Default) Lazy load. Fast startup, low initial RAM. |
| `PRELOAD_MODELS` | `true` | Preload all models. Slower startup, higher instant readiness. |

### Reranking
After RRF fusion, we optionally apply a **Cross-Encoder Reranker** (ms-marco-MiniLM-L-12-v2) to the top 20 candidates to refine the order based on query-document relevance.

This is the most computationally expensive step, but offers the highest precision.
