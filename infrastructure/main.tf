# infrastructure/main.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}

# --- GPU Infrastructure ---

resource "kubernetes_namespace" "predator_system" {
  metadata {
    name = "predator-system"
    labels = {
      "predator/managed" = "true"
      "istio-injection" = "enabled"
    }
  }
}

# Placeholder for GPU Node Pool definition (Cloud specific usually, here mocked as k8s resources or simple scheduling config)
resource "kubernetes_priority_class" "gpu_heavy" {
  metadata {
    name = "predator-gpu-heavy"
  }
  value = 1000000
  global_default = false
  description = "Priority class for heavy GPU ETL and Training jobs"
}

# --- Security Policies (RBAC) ---

resource "kubernetes_service_account" "azr_agent" {
  metadata {
    name      = "azr-agent"
    namespace = kubernetes_namespace.predator_system.metadata[0].name
  }
}

resource "kubernetes_cluster_role" "azr_role" {
  metadata {
    name = "predator-azr-agent"
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
}

resource "kubernetes_cluster_role_binding" "azr_binding" {
  metadata {
    name = "predator-azr-binding"
  }
  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.azr_role.metadata[0].name
  }
  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.azr_agent.metadata[0].name
    namespace = kubernetes_namespace.predator_system.metadata[0].name
  }
}
