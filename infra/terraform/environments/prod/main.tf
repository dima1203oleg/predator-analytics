# Terraform — Production Environment
# PREDATOR Analytics v56.0

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.27.0" }
    helm       = { source = "hashicorp/helm", version = "~> 2.12.0" }
  }
  backend "local" { path = "terraform.tfstate" }
}

provider "kubernetes" { config_path = "~/.kube/config" }
provider "helm" { kubernetes { config_path = "~/.kube/config" } }

locals {
  environment = "prod"
  namespace   = "predator-v55"
}

variable "postgres_password" { type = string; sensitive = true }
variable "neo4j_password" { type = string; sensitive = true }
variable "grafana_password" { type = string; sensitive = true }
variable "telegram_bot_token" { type = string; sensitive = true; default = "" }
variable "telegram_chat_id" { type = string; default = "" }

module "kubernetes" {
  source = "../../modules/kubernetes"; environment = local.environment; namespace = local.namespace
}

module "network" {
  source = "../../modules/network"; environment = local.environment; depends_on = [module.kubernetes]
}

module "database" {
  source = "../../modules/database"; environment = local.environment; namespace = module.kubernetes.namespace_name
  postgres_password = var.postgres_password; neo4j_password = var.neo4j_password; postgres_storage_size = "50Gi"
  depends_on = [module.kubernetes]
}

module "security" {
  source = "../../modules/security"; environment = local.environment
  vault_ha_enabled = true; enable_gatekeeper = true; enable_cert_manager = true; enable_trivy_operator = true
  depends_on = [module.kubernetes]
}

module "observability" {
  source = "../../modules/observability"; environment = local.environment
  prometheus_retention = "30d"; grafana_password = var.grafana_password
  telegram_bot_token = var.telegram_bot_token; telegram_chat_id = var.telegram_chat_id
  depends_on = [module.kubernetes]
}

output "namespace" { value = module.kubernetes.namespace_name }
output "grafana_url" { value = module.observability.grafana_endpoint }
output "vault_url" { value = module.security.vault_endpoint }
output "otel_endpoint" { value = module.observability.otel_grpc_endpoint }
