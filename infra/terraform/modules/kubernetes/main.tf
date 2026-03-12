# ═══════════════════════════════════════════════════════════════
# 🏗️ Terraform — Kubernetes Module
# PREDATOR Analytics v56.0
# Namespace, RBAC, PriorityClasses, ServiceAccounts
# ═══════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12.0"
    }
  }
}

# ── Змінні ────────────────────────────────────────────────────

variable "environment" {
  type = string
}

variable "project_name" {
  type    = string
  default = "predator-analytics"
}

variable "namespace" {
  type    = string
  default = "predator-v55"
}

variable "services" {
  description = "Список мікросервісів"
  type = list(object({
    name       = string
    port       = number
    has_gpu    = optional(bool, false)
    replicas   = optional(number, 1)
  }))
  default = [
    { name = "core-api",          port = 8000 },
    { name = "graph-service",     port = 8002 },
    { name = "cerebro",           port = 8003 },
    { name = "rtb-engine",        port = 8004 },
    { name = "mcp-router",        port = 8080 },
    { name = "ingestion-worker",  port = 8080 },
    { name = "frontend",          port = 3030 },
  ]
}

# ── Локальні змінні ───────────────────────────────────────────

locals {
  common_labels = {
    "predator.io/managed"     = "terraform"
    "predator.io/environment" = var.environment
    "predator.io/project"     = var.project_name
  }
}

# ── Namespace ─────────────────────────────────────────────────

resource "kubernetes_namespace" "predator" {
  metadata {
    name = var.namespace

    labels = merge(local.common_labels, {
      "istio-injection" = "enabled"
    })

    annotations = {
      "predator.io/description" = "PREDATOR Analytics ${var.environment} namespace"
    }
  }
}

# ── Priority Classes ──────────────────────────────────────────

resource "kubernetes_priority_class" "critical" {
  metadata {
    name   = "predator-critical"
    labels = local.common_labels
  }
  value          = 1000000
  global_default = false
  description    = "Критичні сервіси (core-api, postgres)"
}

resource "kubernetes_priority_class" "high" {
  metadata {
    name   = "predator-high"
    labels = local.common_labels
  }
  value          = 500000
  global_default = false
  description    = "Високий пріоритет (graph-service, cerebro)"
}

resource "kubernetes_priority_class" "gpu_heavy" {
  metadata {
    name   = "predator-gpu-heavy"
    labels = local.common_labels
  }
  value          = 1000000
  global_default = false
  description    = "GPU ETL та ML training jobs"
}

resource "kubernetes_priority_class" "batch" {
  metadata {
    name   = "predator-batch"
    labels = local.common_labels
  }
  value          = 100000
  global_default = false
  description    = "Batch jobs (ETL, reports)"
}

# ── Service Accounts ──────────────────────────────────────────

resource "kubernetes_service_account" "services" {
  for_each = { for s in var.services : s.name => s }

  metadata {
    name      = each.value.name
    namespace = kubernetes_namespace.predator.metadata[0].name

    labels = merge(local.common_labels, {
      "app.kubernetes.io/name" = each.value.name
    })

    annotations = {
      # Vault Kubernetes Auth integration
      "vault.hashicorp.com/agent-inject" = "true"
      "vault.hashicorp.com/role"         = each.value.name
    }
  }
}

# ── RBAC: Cluster Roles ───────────────────────────────────────

# Read-only role для моніторингу
resource "kubernetes_cluster_role" "monitoring_reader" {
  metadata {
    name   = "predator-monitoring-reader"
    labels = local.common_labels
  }

  rule {
    api_groups = [""]
    resources  = ["nodes", "pods", "services", "endpoints"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["apps"]
    resources  = ["deployments", "statefulsets", "daemonsets"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["batch"]
    resources  = ["jobs", "cronjobs"]
    verbs      = ["get", "list", "watch"]
  }
}

# Operator role для ETL jobs
resource "kubernetes_cluster_role" "etl_operator" {
  metadata {
    name   = "predator-etl-operator"
    labels = local.common_labels
  }

  rule {
    api_groups = ["batch"]
    resources  = ["jobs"]
    verbs      = ["get", "list", "watch", "create", "delete"]
  }

  rule {
    api_groups = [""]
    resources  = ["pods", "pods/log"]
    verbs      = ["get", "list", "watch"]
  }
}

# AZR Agent role (з існуючого infrastructure/main.tf)
resource "kubernetes_cluster_role" "azr_agent" {
  metadata {
    name   = "predator-azr-agent"
    labels = local.common_labels
  }

  rule {
    api_groups = [""]
    resources  = ["nodes", "pods", "services"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["batch"]
    resources  = ["jobs"]
    verbs      = ["get", "list", "watch", "create", "delete"]
  }

  rule {
    api_groups = ["apps"]
    resources  = ["deployments"]
    verbs      = ["get", "list", "watch", "update"]
  }
}

# ── RBAC: Role Bindings ───────────────────────────────────────

resource "kubernetes_cluster_role_binding" "azr_binding" {
  metadata {
    name   = "predator-azr-binding"
    labels = local.common_labels
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.azr_agent.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = "core-api"
    namespace = kubernetes_namespace.predator.metadata[0].name
  }
}

# ── Resource Quotas ───────────────────────────────────────────

resource "kubernetes_resource_quota" "predator_quota" {
  metadata {
    name      = "predator-resource-quota"
    namespace = kubernetes_namespace.predator.metadata[0].name
    labels    = local.common_labels
  }

  spec {
    hard = {
      "requests.cpu"    = var.environment == "prod" ? "16" : "8"
      "requests.memory" = var.environment == "prod" ? "32Gi" : "16Gi"
      "limits.cpu"      = var.environment == "prod" ? "32" : "16"
      "limits.memory"   = var.environment == "prod" ? "64Gi" : "32Gi"
      "pods"            = var.environment == "prod" ? "100" : "50"
    }
  }
}

# ── Limit Ranges ──────────────────────────────────────────────

resource "kubernetes_limit_range" "predator_limits" {
  metadata {
    name      = "predator-limit-range"
    namespace = kubernetes_namespace.predator.metadata[0].name
    labels    = local.common_labels
  }

  spec {
    limit {
      type = "Container"

      default = {
        cpu    = "500m"
        memory = "512Mi"
      }

      default_request = {
        cpu    = "100m"
        memory = "128Mi"
      }

      max = {
        cpu    = "4"
        memory = "8Gi"
      }

      min = {
        cpu    = "50m"
        memory = "32Mi"
      }
    }
  }
}

# ── Outputs ───────────────────────────────────────────────────

output "namespace_name" {
  value = kubernetes_namespace.predator.metadata[0].name
}

output "service_account_names" {
  value = { for k, v in kubernetes_service_account.services : k => v.metadata[0].name }
}
