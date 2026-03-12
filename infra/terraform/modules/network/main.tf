# ═══════════════════════════════════════════════════════════════
# 🏗️ Terraform — Network Module
# PREDATOR Analytics v56.0
# VPC, Subnets, Firewall Rules
# ═══════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
}

# ── Змінні ────────────────────────────────────────────────────

variable "environment" {
  description = "Середовище: dev, staging, prod"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Назва проекту"
  type        = string
  default     = "predator-analytics"
}

variable "vpc_cidr" {
  description = "CIDR block для VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "CIDR blocks для приватних підмереж"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "CIDR blocks для публічних підмереж"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "enable_nat_gateway" {
  description = "Чи створювати NAT Gateway"
  type        = bool
  default     = true
}

# ── Локальні змінні ───────────────────────────────────────────

locals {
  common_labels = {
    "predator.io/managed"     = "terraform"
    "predator.io/environment" = var.environment
    "predator.io/project"     = var.project_name
  }

  # Для on-premise (k3s) — використовуємо Kubernetes NetworkPolicies
  # Для cloud (GKE/EKS) — використовуємо cloud-native networking
}

# ── Kubernetes Network Policies ───────────────────────────────

# Default deny all ingress (Zero Trust)
resource "kubernetes_network_policy" "default_deny" {
  metadata {
    name      = "default-deny-all"
    namespace = "${var.project_name}-${var.environment}"
    labels    = local.common_labels
  }

  spec {
    pod_selector {}

    policy_types = ["Ingress", "Egress"]
  }
}

# Allow DNS (CoreDNS)
resource "kubernetes_network_policy" "allow_dns" {
  metadata {
    name      = "allow-dns"
    namespace = "${var.project_name}-${var.environment}"
    labels    = local.common_labels
  }

  spec {
    pod_selector {}

    egress {
      ports {
        port     = 53
        protocol = "UDP"
      }
      ports {
        port     = 53
        protocol = "TCP"
      }
    }

    policy_types = ["Egress"]
  }
}

# Frontend → Core API
resource "kubernetes_network_policy" "frontend_to_api" {
  metadata {
    name      = "frontend-to-core-api"
    namespace = "${var.project_name}-${var.environment}"
    labels    = local.common_labels
  }

  spec {
    pod_selector {
      match_labels = {
        "app.kubernetes.io/name" = "core-api"
      }
    }

    ingress {
      from {
        pod_selector {
          match_labels = {
            "app.kubernetes.io/name" = "frontend"
          }
        }
      }
      ports {
        port     = 8000
        protocol = "TCP"
      }
    }

    policy_types = ["Ingress"]
  }
}

# Core API → Databases
resource "kubernetes_network_policy" "api_to_databases" {
  metadata {
    name      = "api-to-databases"
    namespace = "${var.project_name}-${var.environment}"
    labels    = local.common_labels
  }

  spec {
    pod_selector {
      match_labels = {
        "app.kubernetes.io/name" = "core-api"
      }
    }

    egress {
      # PostgreSQL
      to {
        pod_selector {
          match_labels = {
            "app.kubernetes.io/name" = "postgres"
          }
        }
      }
      ports {
        port     = 5432
        protocol = "TCP"
      }
    }

    egress {
      # Redis
      to {
        pod_selector {
          match_labels = {
            "app.kubernetes.io/name" = "redis"
          }
        }
      }
      ports {
        port     = 6379
        protocol = "TCP"
      }
    }

    egress {
      # Neo4j
      to {
        pod_selector {
          match_labels = {
            "app.kubernetes.io/name" = "neo4j"
          }
        }
      }
      ports {
        port     = 7687
        protocol = "TCP"
      }
    }

    egress {
      # OpenSearch
      to {
        pod_selector {
          match_labels = {
            "app.kubernetes.io/name" = "opensearch"
          }
        }
      }
      ports {
        port     = 9200
        protocol = "TCP"
      }
    }

    policy_types = ["Egress"]
  }
}

# Prometheus → All pods (metrics scraping)
resource "kubernetes_network_policy" "prometheus_scrape" {
  metadata {
    name      = "prometheus-scrape"
    namespace = "${var.project_name}-${var.environment}"
    labels    = local.common_labels
  }

  spec {
    pod_selector {}

    ingress {
      from {
        namespace_selector {
          match_labels = {
            "kubernetes.io/metadata.name" = "monitoring"
          }
        }
        pod_selector {
          match_labels = {
            "app.kubernetes.io/name" = "prometheus"
          }
        }
      }
      ports {
        port     = 8000
        protocol = "TCP"
      }
      ports {
        port     = 8080
        protocol = "TCP"
      }
    }

    policy_types = ["Ingress"]
  }
}

# ── Outputs ───────────────────────────────────────────────────

output "network_policy_names" {
  description = "Створені NetworkPolicies"
  value = [
    kubernetes_network_policy.default_deny.metadata[0].name,
    kubernetes_network_policy.allow_dns.metadata[0].name,
    kubernetes_network_policy.frontend_to_api.metadata[0].name,
    kubernetes_network_policy.api_to_databases.metadata[0].name,
    kubernetes_network_policy.prometheus_scrape.metadata[0].name,
  ]
}
