# Predator Data Layer Architecture

## 1. Data Layer Map (Mermaid)

```mermaid
flowchart TD
    %% Subgraphs for Logical Layers
    subgraph Ingest_Layer [Ingest & Data Lake]
        User[User / Parsing Bot]
        MinIO[("MinIO (S3)\nRaw Files & ML Artifacts")]
    end

    subgraph Operational_Layer [System of Record]
        PG[("PostgreSQL\nMetadata & Structures")]
        Timescale[("TimescaleDB\nMetrics & Events")]
    end

    subgraph Intelligence_Layer [Search & semantics]
        OS[("OpenSearch\nFull-Text & Analytics")]
        Qdrant[("Qdrant\nVector Embeddings")]
    end

    subgraph Speed_Layer [Cache & Control]
        Redis[("Redis\nCache & Queues")]
    end

    %% Data Flows
    User -->|Upload| MinIO
    MinIO -->|ETL Processing| PG
    
    PG -->|Sync/CDC| OS
    PG -->|Vectorization| Qdrant
    PG -->|Telemetry| Timescale
    
    %% Feedback Loops
    OS -->|Analytics Signals| PG
    Qdrant -->|Similarity Search| User
    OS -->|Text Search| User
    
    %% Cache interactions
    User -.->|Check| Redis
    Redis -.->|Hit/Miss| PG
    
    classDef storage fill:#1f2937,stroke:#3b82f6,stroke-width:2px,color:white;
    class MinIO,PG,Timescale,OS,Qdrant,Redis storage;
```

## 2. Component Roles

| System | Role | Specific Usage in Predator |
|--------|------|----------------------------|
| **PostgreSQL** | **Truth Source** | Data Gold Layer, Users, Document Metadata, Job States |
| **TimescaleDB** | **Time Intelligence** | System Latency, Search Quality Metrics, SLA Tracking |
| **OpenSearch** | **Search Engine** | Text Search, Log Aggregation, Query Analytics |
| **Qdrant** | **Semantic Brain** | Vector Embeddings, Hybrid Search, Multi-modal Assets |
| **Redis** | **Speed Layer** | Hot Cache, Rate Limiting, Celery Queues |
| **MinIO** | **Data Lake** | Raw Datasets, ML Models, Backups, DVC Storage |

## 3. Truth Chain Logic

1. **Ingest**: File -> MinIO (Bucket: `raw-imports`)
2. **Record**: Parser -> PostgreSQL (Table: `ua_customs_imports`)
3. **Index**: PostgreSQL -> OpenSearch (Index: `customs-v1`) & Qdrant (Collection: `customs_vectors`)
4. **Retrieval**: API -> Fusion(OS + Qdrant) -> User

## 4. Environment Strategy

*   **Mac (Dev)**: Single instances, Local MinIO, Mock ML Signals.
*   **Oracle (Staging)**: Light replicas, A/B testing, Policy Checks.
*   **NVIDIA (Compute)**: GPU Inference, Batch Embeddings, Heavy Lifting.
