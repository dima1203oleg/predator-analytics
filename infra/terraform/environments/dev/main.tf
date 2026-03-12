# ═══════════════════════════════════════════════════════════════
# 🏗️ Terraform — Dev Environment
# PREDATOR Analytics v56.0
# Розгортання development середовища
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

  # Remote backend (S3-compatible, може бути MinIO)
  backend "local" {
    path = "terraform.tfstate"
  }

  # Для production використовуйте remote backend:
  # backend "s3" {
  #   bucket         = "predator-terraform-state"
  #   key            = "environments/dev/terraform.tfstate"
  #   region         = "eu-west-1"
  #   encrypt        = true
  #   dynamodb_table = "predator-terraform-locks"
  # }
}

# ── Providers ─────────────────────────────────────────────────

provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}

# ── Variables ─────────────────────────────────────────────────

locals {
  environment = "dev"
  namespace   = "predator-dev"
}

# ── Modules ───────────────────────────────────────────────────

# Kubernetes base (namespace, RBAC, ServiceAccounts)
module "kubernetes" {
  source      = "../../modules/kubernetes"
  environment = local.environment
  namespace   = local.namespace
}

# Network policies
module "network" {
  source      = "../../modules/network"
  environment = local.environment

  depends_on = [module.kubernetes]
}

# Databases
module "database" {
  source      = "../../modules/database"
  environment = local.environment
  namespace   = module.kubernetes.namespace_name

  # Dev passwords (в prod — з Vault)
  postgres_password     = "predator_dev_password"
  neo4j_password        = "predator_graph_dev"
  postgres_storage_size = "5Gi"

  depends_on = [module.kubernetes]
}

# Security (Vault + OPA + cert-manager)
module "security" {
  source      = "../../modules/security"
  environment = local.environment

  vault_ha_enabled      = false  # Standalone в dev
  enable_gatekeeper     = true
  enable_cert_manager   = false  # Не потрібно в dev
  enable_trivy_operator = false  # Сканування тільки в CI

  depends_on = [module.kubernetes]
}

# Observability (Prometheus + Grafana + Loki + OTel)
module "observability" {
  source      = "../../modules/observability"
  environment = local.environment

  prometheus_retention = "7d"  # Менше retention в dev

  depends_on = [module.kubernetes]
}

# ── Outputs ───────────────────────────────────────────────────

output "namespace" {
  value = module.kubernetes.namespace_name
}

output "postgres_host" {
  value = module.database.postgres_host
}

output "grafana_url" {
  value = module.observability.grafana_endpoint
}

output "vault_url" {
  value = module.security.vault_endpoint
}
