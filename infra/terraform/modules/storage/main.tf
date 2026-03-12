# PREDATOR v56.0 — Storage Module (MinIO, OpenSearch, Qdrant)
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    helm       = { source = "hashicorp/helm", version = "~> 2.12.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.27.0" }
  }
}

variable "environment" { type = string }
variable "namespace" { type = string }

# MinIO (S3-compatible object storage)
resource "helm_release" "minio" {
  name       = "minio"
  namespace  = var.namespace
  repository = "https://charts.min.io/"
  chart      = "minio"
  version    = "5.2.0"

  values = [yamlencode({
    mode      = var.environment == "prod" ? "distributed" : "standalone"
    replicas  = var.environment == "prod" ? 4 : 1

    resources = {
      requests = { cpu = "100m", memory = "256Mi" }
      limits   = { cpu = "500m", memory = "1Gi" }
    }

    persistence = {
      enabled = true
      size    = var.environment == "prod" ? "100Gi" : "10Gi"
    }

    buckets = [
      { name = "predator-uploads", policy = "none" },
      { name = "predator-etl-staging", policy = "none" },
      { name = "predator-backups", policy = "none" },
      { name = "predator-ml-models", policy = "none" },
    ]

    metrics = {
      serviceMonitor = { enabled = true }
    }
  })]
}

# OpenSearch
resource "helm_release" "opensearch" {
  name       = "opensearch"
  namespace  = var.namespace
  repository = "https://opensearch-project.github.io/helm-charts"
  chart      = "opensearch"
  version    = "2.19.0"

  values = [yamlencode({
    replicas = var.environment == "prod" ? 3 : 1
    resources = {
      requests = { cpu = "500m", memory = "1Gi" }
      limits   = { cpu = "1", memory = "2Gi" }
    }
    persistence = {
      enabled = true
      size    = var.environment == "prod" ? "50Gi" : "10Gi"
    }
  })]
}

# Qdrant (Vector DB)
resource "helm_release" "qdrant" {
  name       = "qdrant"
  namespace  = var.namespace
  repository = "https://qdrant.github.io/qdrant-helm"
  chart      = "qdrant"
  version    = "0.9.1"

  values = [yamlencode({
    replicaCount = var.environment == "prod" ? 3 : 1
    resources = {
      requests = { cpu = "100m", memory = "256Mi" }
      limits   = { cpu = "500m", memory = "1Gi" }
    }
    persistence = {
      enabled = true
      size    = var.environment == "prod" ? "20Gi" : "5Gi"
    }
  })]
}

output "minio_endpoint" { value = "minio.${var.namespace}:9000" }
output "opensearch_host" { value = "opensearch-cluster-master.${var.namespace}:9200" }
output "qdrant_host" { value = "qdrant.${var.namespace}:6333" }
