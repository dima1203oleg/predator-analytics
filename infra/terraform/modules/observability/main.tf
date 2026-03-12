# ═══════════════════════════════════════════════════════════════
# 🏗️ Terraform — Observability Module
# PREDATOR Analytics v56.0
# Prometheus + Grafana + Loki + OpenTelemetry
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
  default = "monitoring"
}

variable "prometheus_retention" {
  description = "Retention period для Prometheus"
  type        = string
  default     = "15d"
}

variable "grafana_password" {
  description = "Grafana admin password (з Vault)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "telegram_bot_token" {
  description = "Telegram bot token для Alertmanager"
  type        = string
  sensitive   = true
  default     = ""
}

variable "telegram_chat_id" {
  description = "Telegram chat ID для сповіщень"
  type        = string
  default     = ""
}

# ── Namespace ─────────────────────────────────────────────────

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = var.namespace
    labels = {
      "predator.io/managed"     = "terraform"
      "predator.io/environment" = var.environment
    }
  }
}

# ── Prometheus Stack (kube-prometheus-stack) ───────────────────

resource "helm_release" "prometheus_stack" {
  name       = "prometheus"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "57.2.0"

  values = [yamlencode({
    # Prometheus
    prometheus = {
      prometheusSpec = {
        retention         = var.prometheus_retention
        scrapeInterval    = "15s"
        evaluationInterval = "15s"

        resources = {
          requests = {
            cpu    = "200m"
            memory = "512Mi"
          }
          limits = {
            cpu    = "1"
            memory = "2Gi"
          }
        }

        storageSpec = {
          volumeClaimTemplate = {
            spec = {
              accessModes = ["ReadWriteOnce"]
              resources = {
                requests = {
                  storage = var.environment == "prod" ? "50Gi" : "10Gi"
                }
              }
            }
          }
        }

        # ServiceMonitor auto-discovery
        serviceMonitorSelectorNilUsesHelmValues = false
        podMonitorSelectorNilUsesHelmValues     = false
      }
    }

    # Grafana
    grafana = {
      enabled = true
      adminPassword = var.grafana_password != "" ? var.grafana_password : "predator-admin"

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

      # Datasources
      additionalDataSources = [
        {
          name   = "Loki"
          type   = "loki"
          url    = "http://loki:3100"
          access = "proxy"
        },
        {
          name   = "Tempo"
          type   = "tempo"
          url    = "http://tempo:3200"
          access = "proxy"
        }
      ]

      # Dashboard provisioning
      dashboardProviders = {
        "dashboardproviders.yaml" = {
          apiVersion = 1
          providers = [{
            name            = "predator"
            orgId           = 1
            folder          = "PREDATOR"
            type            = "file"
            disableDeletion = false
            editable        = true
            options = {
              path = "/var/lib/grafana/dashboards/predator"
            }
          }]
        }
      }
    }

    # Alertmanager
    alertmanager = {
      enabled = true
      config = {
        global = {
          resolve_timeout = "5m"
        }
        route = {
          group_by        = ["alertname", "cluster", "service"]
          group_wait      = "10s"
          group_interval  = "10s"
          repeat_interval = "12h"
          receiver        = "telegram-critical"
          routes = [
            {
              match    = { severity = "critical" }
              receiver = "telegram-critical"
            },
            {
              match    = { severity = "warning" }
              receiver = "telegram-warning"
            }
          ]
        }
        receivers = [
          {
            name = "telegram-critical"
            telegram_configs = var.telegram_bot_token != "" ? [{
              bot_token  = var.telegram_bot_token
              chat_id    = tonumber(var.telegram_chat_id)
              parse_mode = "HTML"
              message    = <<-EOT
                🚨 <b>CRITICAL [${var.environment}]</b>
                <b>Alert:</b> {{ .GroupLabels.alertname }}
                {{ range .Alerts }}• {{ .Annotations.description }}{{ end }}
              EOT
            }] : []
          },
          {
            name = "telegram-warning"
            telegram_configs = var.telegram_bot_token != "" ? [{
              bot_token  = var.telegram_bot_token
              chat_id    = tonumber(var.telegram_chat_id)
              parse_mode = "HTML"
              message    = <<-EOT
                ⚠️ <b>WARNING [${var.environment}]</b>
                <b>Alert:</b> {{ .GroupLabels.alertname }}
                {{ range .Alerts }}• {{ .Annotations.description }}{{ end }}
              EOT
            }] : []
          }
        ]
      }
    }

    # Node Exporter
    nodeExporter = {
      enabled = true
    }

    # kube-state-metrics
    kubeStateMetrics = {
      enabled = true
    }
  })]
}

# ── Loki ──────────────────────────────────────────────────────

resource "helm_release" "loki" {
  name       = "loki"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki"
  version    = "6.6.2"

  values = [yamlencode({
    loki = {
      auth_enabled = false
      storage = {
        type = "filesystem"
      }
      limits_config = {
        reject_old_samples     = true
        reject_old_samples_max_age = "168h"
        ingestion_rate_mb      = 4
        ingestion_burst_size_mb = 6
      }
      schema_config = {
        configs = [{
          from         = "2024-01-01"
          store        = "tsdb"
          object_store = "filesystem"
          schema       = "v13"
          index = {
            prefix = "index_"
            period = "24h"
          }
        }]
      }
    }

    singleBinary = {
      replicas = 1
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
    }
  })]
}

# ── Promtail (Log Collector) ──────────────────────────────────

resource "helm_release" "promtail" {
  name       = "promtail"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  repository = "https://grafana.github.io/helm-charts"
  chart      = "promtail"
  version    = "6.15.5"

  values = [yamlencode({
    config = {
      clients = [{
        url = "http://loki:3100/loki/api/v1/push"
      }]
    }

    resources = {
      requests = {
        cpu    = "50m"
        memory = "64Mi"
      }
      limits = {
        cpu    = "200m"
        memory = "128Mi"
      }
    }
  })]

  depends_on = [helm_release.loki]
}

# ── OpenTelemetry Collector ───────────────────────────────────

resource "helm_release" "otel_collector" {
  name       = "otel-collector"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  repository = "https://open-telemetry.github.io/opentelemetry-helm-charts"
  chart      = "opentelemetry-collector"
  version    = "0.88.0"

  values = [file("${path.module}/../../../otel/helm-values.yaml")]

  depends_on = [helm_release.prometheus_stack]
}

# ── Grafana Tempo (Traces Backend) ────────────────────────────

resource "helm_release" "tempo" {
  name       = "tempo"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  repository = "https://grafana.github.io/helm-charts"
  chart      = "tempo"
  version    = "1.7.2"

  values = [yamlencode({
    tempo = {
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
    }
  })]
}

# ── Outputs ───────────────────────────────────────────────────

output "prometheus_endpoint" {
  value = "http://prometheus-kube-prometheus-prometheus.${var.namespace}:9090"
}

output "grafana_endpoint" {
  value = "http://prometheus-grafana.${var.namespace}:80"
}

output "loki_endpoint" {
  value = "http://loki.${var.namespace}:3100"
}

output "tempo_endpoint" {
  value = "http://tempo.${var.namespace}:3200"
}

output "otel_grpc_endpoint" {
  value = "otel-collector-opentelemetry-collector.${var.namespace}:4317"
}
