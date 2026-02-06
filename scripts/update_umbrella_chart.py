
import os
import yaml

HELM_ROOT = "/Users/dima-mac/Documents/Predator_21/helm/predator"
CHARTS_DIR = os.path.join(HELM_ROOT, "charts")

COMPONENTS = {
    "api": [
        "gateway", "auth", "search", "analytics", "ingestion",
        "datasets", "ai", "reports", "notifications", "admin"
    ],
    "workers": [
        "ingestion", "embedding", "ocr", "stt", "analytics",
        "reports", "notifications", "sync", "cleanup", "backup"
    ],
    "orchestration": [
        "beat", "flower", "airflow", "airflow-worker", "airflow-web"
    ],
    "connectors": [
        "telegram", "excel", "pdf", "docx", "images", "api",
        "database", "sftp", "s3", "gcs", "email", "websocket",
        "kafka", "customs", "registry"
    ],
    "ai": [
        "ollama", "llm-router", "council", "prompts", "context",
        "validator", "hallucination", "token-optimizer", "registry", "cache",
        "embedding", "indexer", "search", "ranker", "collections", "backup", "compaction",
        "rag-orchestrator", "retriever", "reranker", "chunk-processor", "knowledge-graph", "citation-generator", "answer-synthesizer",
        "ocr", "stt", "ner", "sentiment", "anomaly", "risk", "classification", "summarizer", "translator", "graph"
    ],
    "data": [
        "postgres", "postgres-replica", "pgbouncer", "postgres-backup", "postgres-monitor",
        "opensearch", "opensearch-data", "opensearch-ingest", "dashboards", "curator", "opensearch-backup",
        "kafka", "zookeeper", "connect", "schema-registry", "kafka-ui", "kafka-exporter",
        "redis", "redis-replica", "redis-sentinel", "redis-exporter",
        "minio", "minio-console", "minio-gateway", "minio-lifecycle"
    ],
    "pipelines": [
        "orchestrator", "ingestion", "transform", "enrichment", "validation", "loading", "dbt", "data-quality", "lineage", "catalog"
    ],
    "datasets": [
        "registry", "versioning", "validation", "generator", "activator"
    ],
    "vector": [
        "qdrant", "indexer", "search"
    ],
    "ui": [
        "web", "storybook"
    ],
    "auth": [
        "keycloak", "keycloak-db", "oauth-proxy", "jwt-validator", "session", "mfa"
    ],
    "authz": [
        "opa", "policy", "rbac", "permissions"
    ],
    "secrets": [
        "vault", "external-secrets", "sealed-secrets", "cert-manager"
    ],
    "security": [
        "trivy", "falco", "trufflehog", "netpol", "audit", "ids"
    ],
    "observability": [
        "prometheus", "thanos-query", "thanos-store", "alertmanager", "pushgateway", "node-exporter", "ksm",
        "loki", "promtail", "fluent-bit", "aggregator", "parser", "log-alerter",
        "tempo", "otel", "jaeger", "sampler",
        "grafana", "dashboards", "datasources", "alerting",
        "argusdb", "argusdb-writer", "argusdb-reader", "argusdb-gc"
    ],
    "azr": [
        "orchestrator", "scheduler", "executor", "evaluator", "policy", "state",
        "agents/mistral", "agents/gemini", "agents/aider", "agents/github", "agents/test-runner", "agents/security",
        "pipelines/diagnose", "pipelines/augment", "pipelines/train", "pipelines/promote",
        "ui", "api", "webhook", "notifier"
    ],
    "gitops": [
        "argocd", "argocd-repo", "argocd-controller", "argocd-appset", "argocd-notifications"
    ],
    "ci": [
        "github-runner", "tekton", "kaniko", "harbor", "sonarqube", "renovate", "semantic-release", "changelog", "docs", "notifier"
    ],
    "jobs": [
        "db-migration", "index-rebuild", "cache-warmup", "reports", "cleanup", "backup", "health", "metrics", "certs", "log-rotation"
    ]
}

def main():
    dependencies = []
    for category, components in COMPONENTS.items():
        for name in components:
            # Handle components with slashes (e.g., agents/mistral)
            chart_name = name.replace("/", "-")
            dependencies.append({
                "name": chart_name,
                "version": "0.1.0",
                "repository": f"file://./charts/{category}/{name}"
            })

    chart_yaml = {
        "apiVersion": "v2",
        "name": "predator",
        "description": "Predator Analytics v30.0 - Sovereign Intelligence Platform",
        "type": "application",
        "version": "30.0.0",
        "appVersion": "30.0.0",
        "dependencies": dependencies
    }

    with open(os.path.join(HELM_ROOT, "Chart.yaml"), 'w') as f:
        yaml.dump(chart_yaml, f, sort_keys=False)

if __name__ == "__main__":
    main()
