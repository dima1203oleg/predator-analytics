# ═══════════════════════════════════════════════════════════════
# 🏗️ Terraform — Database Module
# PREDATOR Analytics v56.0
# PostgreSQL + Neo4j + Redis + OpenSearch + Qdrant
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
  type = string
}

variable "postgres_password" {
  type      = string
  sensitive = true
  default   = ""
}

variable "neo4j_password" {
  type      = string
  sensitive = true
  default   = ""
}

variable "postgres_storage_size" {
  type    = string
  default = "20Gi"
}

variable "neo4j_storage_size" {
  type    = string
  default = "10Gi"
}

# ── PostgreSQL 16 ─────────────────────────────────────────────

resource "helm_release" "postgres" {
  name       = "postgres"
  namespace  = var.namespace
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "postgresql"
  version    = "15.2.5"

  values = [yamlencode({
    auth = {
      username = "predator"
      password = var.postgres_password
      database = "predator_db"
    }

    image = {
      tag = "16"
    }

    primary = {
      resources = {
        requests = {
          cpu    = var.environment == "prod" ? "500m" : "100m"
          memory = var.environment == "prod" ? "1Gi" : "256Mi"
        }
        limits = {
          cpu    = var.environment == "prod" ? "2" : "500m"
          memory = var.environment == "prod" ? "4Gi" : "1Gi"
        }
      }

      persistence = {
        enabled      = true
        size         = var.postgres_storage_size
        storageClass = "local-path"
      }

      # Автоматичні бекапи
      initdb = {
        scripts = {
          "init.sql" = <<-SQL
            -- Увімкнути розширення
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE EXTENSION IF NOT EXISTS "pg_trgm";
            CREATE EXTENSION IF NOT EXISTS "btree_gin";

            -- Audit logging (HR-16: WORM таблиці)
            CREATE TABLE IF NOT EXISTS audit_log (
              id BIGSERIAL PRIMARY KEY,
              table_name TEXT NOT NULL,
              operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
              old_data JSONB,
              new_data JSONB,
              changed_by TEXT NOT NULL DEFAULT current_user,
              changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            -- Заборона UPDATE/DELETE на audit_log (WORM)
            CREATE OR REPLACE FUNCTION prevent_audit_modification()
            RETURNS TRIGGER AS $$
            BEGIN
              RAISE EXCEPTION 'HR-16: Modification of audit_log table is prohibited (WORM policy)';
            END;
            $$ LANGUAGE plpgsql;

            CREATE TRIGGER audit_log_worm_trigger
            BEFORE UPDATE OR DELETE ON audit_log
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_modification();
          SQL
        }
      }
    }

    metrics = {
      enabled = true
      resources = {
        requests = {
          cpu    = "50m"
          memory = "32Mi"
        }
        limits = {
          cpu    = "100m"
          memory = "64Mi"
        }
      }
      serviceMonitor = {
        enabled = true
      }
    }

    backup = {
      enabled  = var.environment == "prod"
      cronjob = {
        schedule = "0 2 * * *"  # Щодня о 2:00
        storage = {
          size = "10Gi"
        }
      }
    }
  })]
}

# ── Redis 7 ───────────────────────────────────────────────────

resource "helm_release" "redis" {
  name       = "redis"
  namespace  = var.namespace
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "redis"
  version    = "19.1.2"

  values = [yamlencode({
    architecture = var.environment == "prod" ? "replication" : "standalone"

    auth = {
      enabled = false  # Секрети в Vault
    }

    master = {
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
      persistence = {
        enabled = true
        size    = "5Gi"
      }
    }

    metrics = {
      enabled = true
      serviceMonitor = {
        enabled = true
      }
    }
  })]
}

# ── Outputs ───────────────────────────────────────────────────

output "postgres_host" {
  value = "postgres-postgresql.${var.namespace}.svc.cluster.local"
}

output "redis_host" {
  value = "redis-master.${var.namespace}.svc.cluster.local"
}
