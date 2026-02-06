
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

def create_chart(category, component_path):
    # component_path can be "agents/mistral"
    # flattened_name will be "agents-mistral"
    flattened_name = component_path.replace("/", "-")

    chart_dir = os.path.join(CHARTS_DIR, category, component_path)
    os.makedirs(chart_dir, exist_ok=True)
    os.makedirs(os.path.join(chart_dir, "templates"), exist_ok=True)

    # Chart.yaml
    chart_yaml = {
        "apiVersion": "v2",
        "name": flattened_name,
        "description": f"Predator {category} {flattened_name} component",
        "type": "application",
        "version": "0.1.0",
        "appVersion": "30.0.0"
    }
    with open(os.path.join(chart_dir, "Chart.yaml"), 'w') as f:
        yaml.dump(chart_yaml, f)

    # values.yaml
    values_yaml = {
        "replicaCount": 1,
        "image": {
            "repository": f"predator/{category}-{flattened_name}",
            "pullPolicy": "IfNotPresent",
            "tag": "v30.0.0"
        },
        "service": {
            "type": "ClusterIP",
            "port": 80
        },
        "resources": {
            "limits": {"cpu": "100m", "memory": "128Mi"},
            "requests": {"cpu": "100m", "memory": "128Mi"}
        }
    }
    with open(os.path.join(chart_dir, "values.yaml"), 'w') as f:
        yaml.dump(values_yaml, f)

    # _helpers.tpl
    helpers_tpl = f"""
{{{{- define "{flattened_name}.name" -}}}}
{{{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}}}
{{{{- end }}}}

{{{{- define "{flattened_name}.fullname" -}}}}
{{{{- if .Values.fullnameOverride }}}}
{{{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}}}
{{{{- else }}}}
{{{{- $name := default .Chart.Name .Values.nameOverride }}}}
{{{{- if contains $name .Release.Name }}}}
{{{{- .Release.Name | trunc 63 | trimSuffix "-" }}}}
{{{{- else }}}}
{{{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}}}
{{{{- end }}}}
{{{{- end }}}}
{{{{- end }}}}

{{{{- define "{flattened_name}.chart" -}}}}
{{{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}}}
{{{{- end }}}}

{{{{- define "{flattened_name}.labels" -}}}}
helm.sh/chart: {{{{ include "{flattened_name}.chart" . }}}}
{{{{ include "{flattened_name}.selectorLabels" . }}}}
{{{{- if .Chart.AppVersion }}}}
app.kubernetes.io/version: {{{{ .Chart.AppVersion | quote }}}}
{{{{- end }}}}
app.kubernetes.io/managed-by: {{{{ .Release.Service }}}}
{{{{- end }}}}

{{{{- define "{flattened_name}.selectorLabels" -}}}}
app.kubernetes.io/name: {{{{ include "{flattened_name}.name" . }}}}
app.kubernetes.io/instance: {{{{ .Release.Name }}}}
{{{{- end }}}}
"""
    with open(os.path.join(chart_dir, "templates/_helpers.tpl"), 'w') as f:
        f.write(helpers_tpl)

    # templates/deployment.yaml
    deployment_yaml = f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{{{ include "{flattened_name}.fullname" . }}}}
  labels:
    {{{{- include "{flattened_name}.labels" . | nindent 4 }}}}
spec:
  replicas: {{{{ .Values.replicaCount }}}}
  selector:
    matchLabels:
      {{{{- include "{flattened_name}.selectorLabels" . | nindent 6 }}}}
  template:
    metadata:
      labels:
        {{{{- include "{flattened_name}.selectorLabels" . | nindent 8 }}}}
    spec:
      containers:
        - name: {{{{ .Chart.Name }}}}
          image: "{{{{ .Values.image.repository }}}}:{{{{ .Values.image.tag | default .Chart.AppVersion }}}}"
          imagePullPolicy: {{{{ .Values.image.pullPolicy }}}}
          ports:
            - name: http
              containerPort: {{{{ .Values.service.port }}}}
              protocol: TCP
          resources:
            {{{{- toYaml .Values.resources | nindent 12 }}}}
"""
    with open(os.path.join(chart_dir, "templates/deployment.yaml"), 'w') as f:
        f.write(deployment_yaml)

    # templates/service.yaml
    service_yaml = f"""
apiVersion: v1
kind: Service
metadata:
  name: {{{{ include "{flattened_name}.fullname" . }}}}
  labels:
    {{{{- include "{flattened_name}.labels" . | nindent 4 }}}}
spec:
  type: {{{{ .Values.service.type }}}}
  ports:
    - port: {{{{ .Values.service.port }}}}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{{{- include "{flattened_name}.selectorLabels" . | nindent 4 }}}}
"""
    with open(os.path.join(chart_dir, "templates/service.yaml"), 'w') as f:
        f.write(service_yaml)

def main():
    for category, components in COMPONENTS.items():
        for component_path in components:
            print(f"Creating chart: {category}/{component_path}")
            create_chart(category, component_path)

if __name__ == "__main__":
    main()
