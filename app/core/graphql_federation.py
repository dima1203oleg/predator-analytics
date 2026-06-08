"""GraphQL Federation v63.0-ELITE — Apollo Router.

Єдиний GraphQL endpoint замість REST chaos:
  - Apollo Router для federation
  - DataLoader для автоматичного batching N+1 queries
  - Persisted queries (-80% мережевого трафіку)
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.settings import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# ── GraphQL Schema (SDL) ─────────────────────────────────────

PREDATOR_GRAPHQL_SCHEMA = """
# PREDATOR Analytics GraphQL Federation Schema v63.0-ELITE

scalar DateTime
scalar JSON

# ── Core Types ──────────────────────────────────────────────

type Company @key(fields: "id") {
  id: ID!
  name: String!
  edrpou: String
  country: String
  riskScore: Float
  connections: [CompanyConnection!]!
  imports: [ImportDeclaration!]!
  similarCompanies(limit: Int = 10): [SimilarCompany!]!
}

type CompanyConnection {
  target: Company!
  transactionCount: Int!
  totalValue: Float!
  relationshipType: String!
}

type ImportDeclaration @key(fields: "id") {
  id: ID!
  company: Company!
  declaredValueUsd: Float!
  weightKg: Float!
  hsCode: String!
  originCountry: String!
  riskScore: Float!
  timestamp: DateTime!
  riskFactors: [RiskFactor!]!
}

type RiskFactor {
  name: String!
  impact: Float!
  description: String!
}

type SimilarCompany {
  company: Company!
  similarity: Float!
  sharedConnections: Int!
}

# ── Risk Types ──────────────────────────────────────────────

type RiskAssessment {
  declaration: ImportDeclaration!
  riskScore: Float!
  isHighRisk: Boolean!
  topFactors: [RiskFactor!]!
  modelVersion: String!
  timestamp: DateTime!
}

# ── Graph Types ─────────────────────────────────────────────

type Community {
  id: Int!
  size: Int!
  members: [Company!]!
  avgRiskScore: Float!
  dominantCountry: String
}

type FraudChain {
  target: Company!
  hops: Int!
  totalRisk: Float!
  chain: [String!]!
}

# ── Analytics Types ─────────────────────────────────────────

type AnalyticsSummary {
  totalImports: Int!
  totalValueUsd: Float!
  avgRiskScore: Float!
  highRiskCount: Int!
  topCountries: [CountryStats!]!
  riskTrend: [RiskTrendPoint!]!
}

type CountryStats {
  country: String!
  importCount: Int!
  totalValue: Float!
  avgRisk: Float!
}

type RiskTrendPoint {
  date: DateTime!
  avgRisk: Float!
  importCount: Int!
}

# ── AI Types ────────────────────────────────────────────────

type AIInsight {
  id: ID!
  type: String!
  title: String!
  description: String!
  confidence: Float!
  entities: [Entity!]!
  timestamp: DateTime!
}

union Entity = Company | ImportDeclaration

# ── Search Types ────────────────────────────────────────────

type SearchResult {
  docId: String!
  score: Float!
  bm25Score: Float!
  vectorScore: Float!
  content: JSON!
  highlights: [String!]!
}

type SearchResponse {
  results: [SearchResult!]!
  total: Int!
  queryRewritten: String
  latencyMs: Float!
}

# ── Queries ─────────────────────────────────────────────────

type Query {
  # Company
  company(id: ID!): Company
  companies(
    search: String
    country: String
    minRisk: Float
    limit: Int = 20
    offset: Int = 0
  ): [Company!]!

  # Import
  importDeclaration(id: ID!): ImportDeclaration
  importDeclarations(
    companyId: ID
    country: String
    hsCode: String
    minRisk: Float
    startDate: DateTime
    endDate: DateTime
    limit: Int = 20
    offset: Int = 0
  ): [ImportDeclaration!]!

  # Risk
  assessRisk(declarationId: ID!): RiskAssessment!

  # Graph
  communities(minSize: Int = 3): [Community!]!
  fraudChains(companyId: ID!, maxDepth: Int = 5): [FraudChain!]!
  topRiskyCompanies(limit: Int = 100): [Company!]!

  # Analytics
  analyticsSummary(
    startDate: DateTime
    endDate: DateTime
  ): AnalyticsSummary!

  # AI
  aiInsights(
    type: String
    minConfidence: Float = 0.7
    limit: Int = 10
  ): [AIInsight!]!

  # Search
  hybridSearch(
    query: String!
    filters: JSON
    limit: Int = 20
    rewrite: Boolean = true
  ): SearchResponse!

  # Health
  health: HealthStatus!
}

# ── Mutations ───────────────────────────────────────────────

type Mutation {
  # Risk
  triggerRiskAssessment(declarationId: ID!): RiskAssessment!

  # Graph
  refreshGraphStats: GraphStats!

  # AI
  generateInsight(type: String!, context: JSON): AIInsight!
}

# ── Health ──────────────────────────────────────────────────

type HealthStatus {
  status: String!
  uptime: Float!
  version: String!
  databases: DatabaseHealth!
  services: ServiceHealth!
}

type DatabaseHealth {
  postgresql: String!
  neo4j: String!
  clickhouse: String!
  opensearch: String!
  redis: String!
  qdrant: String!
}

type ServiceHealth {
  coreApi: String!
  graphService: String!
  osintService: String!
  litellm: String!
}

type GraphStats {
  totalCompanies: Int!
  totalConnections: Int!
  avgRisk: Float!
}
"""


# ── DataLoader (N+1 batching) ────────────────────────────────


class PredatorDataLoader:
    """DataLoader для автоматичного batching N+1 queries."""

    def __init__(self) -> None:
        self._cache: dict[str, Any] = {}

    async def load_companies(self, ids: list[str]) -> dict[str, Any]:
        """Batch load companies by IDs."""
        cached = {id_: self._cache.get(f"company:{id_}") for id_ in ids}
        missing = [id_ for id_, v in cached.items() if v is None]

        if missing:
            # Batch query
            loaded = await self._batch_load("companies", missing)
            for id_, data in loaded.items():
                self._cache[f"company:{id_}"] = data
                cached[id_] = data

        return cached

    async def _batch_load(
        self, entity_type: str, ids: list[str]
    ) -> dict[str, Any]:
        """Виконує batch query до БД."""
        logger.debug("Batch loading %d %s", len(ids), entity_type)
        # Реалізація залежить від конкретного resolver'а
        return {}


# ── Apollo Router Config ─────────────────────────────────────


APOLLO_ROUTER_CONFIG = """
# Apollo Router YAML config for PREDATOR Analytics
supergraph:
  listen: 0.0.0.0:4000
  introspection: true

sandbox:
  enabled: true

homepage:
  enabled: false

cors:
  origins:
    - http://localhost:3030
    - https://app.predator.ua
  methods:
    - GET
    - POST
    - OPTIONS

limits:
  max_depth: 10
  max_height: 50
  max_root_fields: 20

telemetry:
  tracing:
    otlp:
      endpoint: http://predator-otel-collector:4317
      protocol: grpc

persisted_queries:
  enabled: true
  log_unknown: true
"""


def get_graphql_schema() -> str:
    """Повертає GraphQL SDL схему."""
    return PREDATOR_GRAPHQL_SCHEMA


def get_apollo_config() -> str:
    """Повертає Apollo Router конфігурацію."""
    return APOLLO_ROUTER_CONFIG
