# PREDATOR v56.0 — Streaming Module (Kafka/Redpanda + Redis)
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    helm       = { source = "hashicorp/helm", version = "~> 2.12.0" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.27.0" }
  }
}

variable "environment" { type = string }
variable "namespace" { type = string }

# Redpanda (Kafka-compatible)
resource "helm_release" "redpanda" {
  name       = "redpanda"
  namespace  = var.namespace
  repository = "https://charts.redpanda.com"
  chart      = "redpanda"
  version    = "5.7.35"

  values = [yamlencode({
    statefulset = {
      replicas = var.environment == "prod" ? 3 : 1
    }
    resources = {
      cpu    = { cores = var.environment == "prod" ? 2 : 1 }
      memory = { container = { max = var.environment == "prod" ? "4Gi" : "1Gi" } }
    }
    storage = {
      persistentVolume = {
        enabled = true
        size    = var.environment == "prod" ? "50Gi" : "10Gi"
      }
    }
    monitoring = {
      enabled = true
    }
  })]
}

output "kafka_brokers" {
  value = "redpanda.${var.namespace}.svc.cluster.local:9092"
}
