# Data Lineage Overview

## Nodes
- **PostgreSQL**: Transactional DB
- **ClickHouse**: Analytical DB
- **Kafka**: Event bus
- **MinIO**: Object storage
- **Neo4j**: Graph DB
- **OpenSearch**: Search engine
- **Qdrant**: Vector DB
- **ML Pipeline**: Model training & inference
- **API**: FastAPI services

## Edges
- PostgreSQL → Kafka
- Kafka → MinIO
- MinIO → Neo4j
- Neo4j → OpenSearch
- OpenSearch → Qdrant
- Qdrant → ML Pipeline
- ML Pipeline → API
- API → PostgreSQL