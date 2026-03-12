# ═══════════════════════════════════════════════════════════════
# 🏗️ Terraform — Security Module
# PREDATOR Analytics v56.0
# Vault + OPA Gatekeeper + cert-manager
# ═══════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27.0"
    }
  }
}

# ── Змінні ────────────────────────────────────────────────────

variable "environment" {
  type = string
}

variable "namespace" {
  type    = string
  default = "predator-security"
}

variable "vault_ha_enabled" {
  description = "Чи увімкнути HA mode для Vault"
  type        = bool
  default     = false
}

variable "enable_gatekeeper" {
  description = "Чи розгортати OPA Gatekeeper"
  type        = bool
  default     = true
}

variable "enable_cert_manager" {
  description = "Чи розгортати cert-manager"
  type        = bool
  default     = true
}

variable "enable_trivy_operator" {
  description = "Чи розгортати Trivy Operator"
  type        = bool
  default     = true
}

# ── Namespace ─────────────────────────────────────────────────

resource "kubernetes_namespace" "security" {
  metadata {
    name = var.namespace
    labels = {
      "predator.io/managed"     = "terraform"
      "predator.io/environment" = var.environment
    }
  }
}

# ── HashiCorp Vault ───────────────────────────────────────────

resource "helm_release" "vault" {
  name       = "vault"
  namespace  = kubernetes_namespace.security.metadata[0].name
  repository = "https://helm.releases.hashicorp.com"
  chart      = "vault"
  version    = "0.28.0"

  values = [file("${path.module}/../../../vault/helm-values.yaml")]

  set {
    name  = "server.ha.enabled"
    value = var.vault_ha_enabled
  }

  set {
    name  = "server.standalone.enabled"
    value = !var.vault_ha_enabled
  }
}

# ── OPA Gatekeeper ────────────────────────────────────────────

resource "helm_release" "gatekeeper" {
  count = var.enable_gatekeeper ? 1 : 0

  name       = "gatekeeper"
  namespace  = "gatekeeper-system"
  repository = "https://open-policy-agent.github.io/gatekeeper/charts"
  chart      = "gatekeeper"
  version    = "3.15.1"

  create_namespace = true

  values = [yamlencode({
    replicas = var.environment == "prod" ? 3 : 1

    audit = {
      replicas = 1
    }

    resources = {
      requests = {
        cpu    = "100m"
        memory = "256Mi"
      }
      limits = {
        cpu    = "500m"
        memory = "512Mi"
      }
    }

    # Виключити системні namespace з перевірки
    exemptNamespaces = [
      "kube-system",
      "gatekeeper-system",
      "cert-manager",
      var.namespace
    ]
  })]
}

# ── Gatekeeper Constraint Templates ──────────────────────────

# Required Labels
resource "kubernetes_manifest" "ct_required_labels" {
  count = var.enable_gatekeeper ? 1 : 0

  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "k8srequiredlabels"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "K8sRequiredLabels"
          }
          validation = {
            openAPIV3Schema = {
              type = "object"
              properties = {
                labels = {
                  type = "array"
                  items = {
                    type = "string"
                  }
                }
              }
            }
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-REGO
          package k8srequiredlabels

          violation[{"msg": msg}] {
            provided := {label | input.review.object.metadata.labels[label]}
            required := {label | label := input.parameters.labels[_]}
            missing := required - provided
            count(missing) > 0
            msg := sprintf("Відсутні обов'язкові мітки: %v", [missing])
          }
        REGO
      }]
    }
  }

  depends_on = [helm_release.gatekeeper]
}

# Resource Limits Required
resource "kubernetes_manifest" "ct_container_limits" {
  count = var.enable_gatekeeper ? 1 : 0

  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "k8scontainerlimits"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "K8sContainerLimits"
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-REGO
          package k8scontainerlimits

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            not container.resources.limits.cpu
            msg := sprintf("Контейнер %v не має CPU limit (HR-08)", [container.name])
          }

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            not container.resources.limits.memory
            msg := sprintf("Контейнер %v не має Memory limit (HR-08)", [container.name])
          }
        REGO
      }]
    }
  }

  depends_on = [helm_release.gatekeeper]
}

# No Privileged Containers
resource "kubernetes_manifest" "ct_no_privileged" {
  count = var.enable_gatekeeper ? 1 : 0

  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "k8snoprivileged"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "K8sNoPrivileged"
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-REGO
          package k8snoprivileged

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            container.securityContext.privileged == true
            msg := sprintf("Привілейований контейнер заборонено: %v", [container.name])
          }
        REGO
      }]
    }
  }

  depends_on = [helm_release.gatekeeper]
}

# No Latest Tag
resource "kubernetes_manifest" "ct_no_latest_tag" {
  count = var.enable_gatekeeper ? 1 : 0

  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "k8snolatesttag"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "K8sNoLatestTag"
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-REGO
          package k8snolatesttag

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            endswith(container.image, ":latest")
            msg := sprintf("Тег :latest заборонено для %v — використовуйте конкретний SHA або версію", [container.name])
          }

          violation[{"msg": msg}] {
            container := input.review.object.spec.containers[_]
            not contains(container.image, ":")
            msg := sprintf("Образ %v без тегу — потрібен конкретний SHA або версія", [container.name])
          }
        REGO
      }]
    }
  }

  depends_on = [helm_release.gatekeeper]
}

# Predator Constitution (міграція з constitution_check.rego)
resource "kubernetes_manifest" "ct_predator_constitution" {
  count = var.enable_gatekeeper ? 1 : 0

  manifest = {
    apiVersion = "templates.gatekeeper.sh/v1"
    kind       = "ConstraintTemplate"
    metadata = {
      name = "predatorconstitution"
    }
    spec = {
      crd = {
        spec = {
          names = {
            kind = "PredatorConstitution"
          }
        }
      }
      targets = [{
        target = "admission.k8s.gatekeeper.sh"
        rego   = <<-REGO
          package predatorconstitution

          # Axiom 5: CLI-First Sovereignty
          violation[{"msg": msg}] {
            input.review.kind.kind == "Pod"
            operations := {"CREATE", "UPDATE", "DELETE"}
            operations[input.review.operation]
            not input.review.object.metadata.labels["managed-by"] == "predatorctl"
            not input.review.object.metadata.labels["agent-type"] == "azr"
            not input.review.object.metadata.labels["app.kubernetes.io/managed-by"] == "Helm"
            msg := "Axiom 5: Мутації дозволені тільки через predatorctl, AZR або Helm"
          }

          # Axiom 6: GitOps Verification
          violation[{"msg": msg}] {
            input.review.kind.kind == "Deployment"
            input.review.operation == "CREATE"
            not input.review.object.metadata.annotations["predator.io/git-sha"]
            msg := "Axiom 6: Deployment має містити git-sha анотацію"
          }
        REGO
      }]
    }
  }

  depends_on = [helm_release.gatekeeper]
}

# ── cert-manager ──────────────────────────────────────────────

resource "helm_release" "cert_manager" {
  count = var.enable_cert_manager ? 1 : 0

  name       = "cert-manager"
  namespace  = "cert-manager"
  repository = "https://charts.jetstack.io"
  chart      = "cert-manager"
  version    = "1.14.4"

  create_namespace = true

  set {
    name  = "installCRDs"
    value = "true"
  }

  values = [yamlencode({
    resources = {
      requests = {
        cpu    = "50m"
        memory = "64Mi"
      }
      limits = {
        cpu    = "200m"
        memory = "256Mi"
      }
    }
  })]
}

# ── Trivy Operator ────────────────────────────────────────────

resource "helm_release" "trivy_operator" {
  count = var.enable_trivy_operator ? 1 : 0

  name       = "trivy-operator"
  namespace  = kubernetes_namespace.security.metadata[0].name
  repository = "https://aquasecurity.github.io/helm-charts/"
  chart      = "trivy-operator"
  version    = "0.21.4"

  values = [yamlencode({
    trivy = {
      severity = "CRITICAL,HIGH,MEDIUM"
    }

    operator = {
      scanJobsConcurrentLimit = 3
      vulnerabilityScannerScanOnlyCurrentRevisions = true
    }

    resources = {
      requests = {
        cpu    = "100m"
        memory = "128Mi"
      }
      limits = {
        cpu    = "500m"
        memory = "512Mi"
      }
    }
  })]
}

# ── Outputs ───────────────────────────────────────────────────

output "vault_endpoint" {
  value = "http://vault.${var.namespace}:8200"
}

output "gatekeeper_enabled" {
  value = var.enable_gatekeeper
}
