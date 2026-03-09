"""
PREDATOR Analytics v55.3 — Canonical PostgreSQL Schema (§11.1).

Includes:
- Multitenancy (RLS via tenants table)
- WORM tables (audit_log, decision_artifacts)
- UEID-based entity resolution
- CERS scoring history
- Kafka-ready event model

HR-07: NEVER SELECT * — always specify columns.
HR-16: WORM tables: UPDATE/DELETE = ERROR.
"""
from datetime import datetime, timezone
from typing import Any


# ──────────────────────────────────────────────────────
# PostgreSQL v55.3 Schema Definition
# ──────────────────────────────────────────────────────

SCHEMA_VERSION = "55.3.0"


TABLES: list[dict[str, Any]] = [
    # ── Multitenancy ──
    {
        "name": "tenants",
        "purpose": "SaaS мультитенантність (RLS base)",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "name TEXT NOT NULL UNIQUE",
            "plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','professional','enterprise','government'))",
            "max_users INT NOT NULL DEFAULT 5",
            "max_companies INT NOT NULL DEFAULT 100",
            "features JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
            "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
    },
    # ── Core Business ──
    {
        "name": "companies",
        "purpose": "Головна таблиця компаній (entity resolution → UEID)",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "ueid TEXT NOT NULL UNIQUE",
            "edrpou TEXT",
            "name TEXT NOT NULL",
            "name_en TEXT",
            "legal_form TEXT",
            "status TEXT NOT NULL DEFAULT 'active'",
            "address TEXT",
            "industry TEXT",
            "registration_date DATE",
            "cers_score NUMERIC(5,2)",
            "cers_confidence NUMERIC(3,2)",
            "cers_updated_at TIMESTAMPTZ",
            "metadata JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
            "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_companies_tenant ON companies(tenant_id)",
            "CREATE INDEX idx_companies_edrpou ON companies(edrpou)",
            "CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops)",
            "CREATE INDEX idx_companies_cers ON companies(cers_score DESC NULLS LAST)",
        ],
    },
    {
        "name": "declarations",
        "purpose": "Митні декларації (customs declarations)",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "company_id UUID NOT NULL REFERENCES companies(id)",
            "declaration_number TEXT NOT NULL",
            "declaration_date DATE NOT NULL",
            "direction TEXT NOT NULL CHECK (direction IN ('import','export'))",
            "country_origin TEXT",
            "country_destination TEXT",
            "hs_code TEXT NOT NULL",
            "goods_description TEXT",
            "quantity NUMERIC",
            "unit TEXT",
            "weight_kg NUMERIC",
            "value_usd NUMERIC(15,2)",
            "customs_value_uah NUMERIC(15,2)",
            "currency TEXT DEFAULT 'USD'",
            "metadata JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_declarations_company ON declarations(company_id)",
            "CREATE INDEX idx_declarations_date ON declarations(declaration_date DESC)",
            "CREATE INDEX idx_declarations_hs ON declarations(hs_code)",
        ],
    },
    {
        "name": "sanctions",
        "purpose": "Санкційні списки (РНБО, ЄС, OFAC)",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "company_id UUID REFERENCES companies(id)",
            "entity_name TEXT NOT NULL",
            "entity_type TEXT NOT NULL CHECK (entity_type IN ('company','person','vessel','aircraft'))",
            "list_source TEXT NOT NULL CHECK (list_source IN ('rnbo','eu','ofac','un','uk'))",
            "list_date DATE",
            "reason TEXT",
            "is_active BOOLEAN NOT NULL DEFAULT true",
            "metadata JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
            "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_sanctions_company ON sanctions(company_id)",
            "CREATE INDEX idx_sanctions_entity ON sanctions(entity_name)",
            "CREATE INDEX idx_sanctions_source ON sanctions(list_source)",
        ],
    },
    {
        "name": "alerts",
        "purpose": "Системні сповіщення (risk events, anomalies)",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "company_id UUID REFERENCES companies(id)",
            "alert_type TEXT NOT NULL",
            "severity TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low','info'))",
            "title TEXT NOT NULL",
            "description TEXT",
            "source TEXT NOT NULL",
            "is_read BOOLEAN NOT NULL DEFAULT false",
            "is_resolved BOOLEAN NOT NULL DEFAULT false",
            "resolved_by UUID",
            "resolved_at TIMESTAMPTZ",
            "metadata JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_alerts_tenant ON alerts(tenant_id)",
            "CREATE INDEX idx_alerts_company ON alerts(company_id)",
            "CREATE INDEX idx_alerts_severity ON alerts(severity)",
            "CREATE INDEX idx_alerts_unread ON alerts(tenant_id) WHERE NOT is_read",
        ],
    },
    {
        "name": "beneficial_owners",
        "purpose": "Кінцеві бенефіціари (UBO)",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "company_id UUID NOT NULL REFERENCES companies(id)",
            "person_name TEXT NOT NULL",
            "ownership_pct NUMERIC(5,2)",
            "is_direct BOOLEAN NOT NULL DEFAULT true",
            "country TEXT",
            "source TEXT NOT NULL",
            "verified BOOLEAN NOT NULL DEFAULT false",
            "metadata JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
            "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
    },
    # ── WORM Tables (HR-16) ──
    {
        "name": "audit_log",
        "purpose": "WORM: append-only аудит лог (§20.1)",
        "columns": [
            "id BIGSERIAL PRIMARY KEY",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "user_id UUID",
            "action TEXT NOT NULL",
            "resource_type TEXT NOT NULL",
            "resource_id TEXT",
            "details JSONB NOT NULL DEFAULT '{}'::jsonb",
            "ip_address INET",
            "user_agent TEXT",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "worm": True,
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_audit_tenant ON audit_log(tenant_id)",
            "CREATE INDEX idx_audit_action ON audit_log(action)",
            "CREATE INDEX idx_audit_time ON audit_log(created_at DESC)",
        ],
    },
    {
        "name": "decision_artifacts",
        "purpose": "WORM: AI/ML decision trace (§20.1)",
        "columns": [
            "id BIGSERIAL PRIMARY KEY",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "company_id UUID REFERENCES companies(id)",
            "decision_type TEXT NOT NULL",
            "model_name TEXT NOT NULL",
            "model_version TEXT NOT NULL",
            "input_hash TEXT NOT NULL",
            "input_summary JSONB NOT NULL",
            "output JSONB NOT NULL",
            "confidence NUMERIC(3,2) NOT NULL",
            "shap_values JSONB",
            "execution_ms INT NOT NULL",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "worm": True,
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_decisions_company ON decision_artifacts(company_id)",
            "CREATE INDEX idx_decisions_type ON decision_artifacts(decision_type)",
            "CREATE INDEX idx_decisions_time ON decision_artifacts(created_at DESC)",
        ],
    },
    # ── ETL ──
    {
        "name": "ingestion_jobs",
        "purpose": "ETL job lifecycle tracking",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "file_name TEXT NOT NULL",
            "file_type TEXT NOT NULL",
            "file_size_bytes BIGINT",
            "status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','queued','running','completed','failed','timeout','cancelled','archived'))",
            "progress_pct NUMERIC(5,2) DEFAULT 0",
            "rows_processed INT DEFAULT 0",
            "rows_total INT",
            "error_message TEXT",
            "started_at TIMESTAMPTZ",
            "completed_at TIMESTAMPTZ",
            "metadata JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
            "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_jobs_tenant ON ingestion_jobs(tenant_id)",
            "CREATE INDEX idx_jobs_status ON ingestion_jobs(status)",
        ],
    },
    # ── Users & Auth ──
    {
        "name": "users",
        "purpose": "Користувачі системи (Keycloak sync)",
        "columns": [
            "id UUID PRIMARY KEY DEFAULT gen_random_uuid()",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "keycloak_id TEXT UNIQUE",
            "email TEXT NOT NULL",
            "full_name TEXT NOT NULL",
            "role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','analyst','operator','viewer'))",
            "is_active BOOLEAN NOT NULL DEFAULT true",
            "last_login_at TIMESTAMPTZ",
            "metadata JSONB NOT NULL DEFAULT '{}'::jsonb",
            "created_at TIMESTAMPTZ NOT NULL DEFAULT now()",
            "updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
        "indexes": [
            "CREATE INDEX idx_users_tenant ON users(tenant_id)",
            "CREATE INDEX idx_users_email ON users(email)",
        ],
    },
    # ── CERS History ──
    {
        "name": "cers_history",
        "purpose": "Історія CERS оцінок (TimescaleDB hypertable)",
        "columns": [
            "id BIGSERIAL PRIMARY KEY",
            "company_id UUID NOT NULL REFERENCES companies(id)",
            "tenant_id UUID NOT NULL REFERENCES tenants(id)",
            "cers_total NUMERIC(5,2) NOT NULL",
            "behavioral NUMERIC(5,2)",
            "institutional NUMERIC(5,2)",
            "influence NUMERIC(5,2)",
            "structural NUMERIC(5,2)",
            "predictive NUMERIC(5,2)",
            "confidence NUMERIC(3,2) NOT NULL",
            "calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
        ],
        "rls": True,
        "timescaledb": True,
        "indexes": [
            "CREATE INDEX idx_cers_company ON cers_history(company_id, calculated_at DESC)",
        ],
    },
]


# ── WORM Triggers ──

WORM_TRIGGER_SQL = """
-- Trigger function: block UPDATE/DELETE on WORM tables (HR-16)
CREATE OR REPLACE FUNCTION prevent_worm_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'WORM: UPDATE/DELETE заборонено на таблиці %', TG_TABLE_NAME;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- audit_log WORM
CREATE TRIGGER trg_audit_log_worm
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_worm_modification();

-- decision_artifacts WORM
CREATE TRIGGER trg_decision_artifacts_worm
BEFORE UPDATE OR DELETE ON decision_artifacts
FOR EACH ROW EXECUTE FUNCTION prevent_worm_modification();
"""


# ── RLS Policies ──

RLS_POLICY_SQL = """
-- Enable RLS on all tenant-scoped tables
{rls_enables}

-- RLS policy: users see only their tenant's data
{rls_policies}
"""


def generate_rls_sql() -> str:
    """Генерує SQL для RLS policies."""
    enables: list[str] = []
    policies: list[str] = []
    for t in TABLES:
        if t.get("rls"):
            name = t["name"]
            enables.append(f"ALTER TABLE {name} ENABLE ROW LEVEL SECURITY;")
            policies.append(
                f"CREATE POLICY tenant_isolation_{name} ON {name} "
                f"USING (tenant_id = current_setting('app.current_tenant_id')::uuid);"
            )
    return RLS_POLICY_SQL.format(
        rls_enables="\n".join(enables),
        rls_policies="\n".join(policies),
    )


def generate_full_schema_sql() -> str:
    """Генерує повний SQL для створення всіх таблиць."""
    parts: list[str] = [
        "-- PREDATOR Analytics v55.3 Canonical Schema",
        f"-- Version: {SCHEMA_VERSION}",
        f"-- Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "-- Required extensions",
        "CREATE EXTENSION IF NOT EXISTS pg_trgm;",
        "CREATE EXTENSION IF NOT EXISTS uuid_ossp;",
        "CREATE EXTENSION IF NOT EXISTS timescaledb;",
        "",
    ]

    for table in TABLES:
        cols = ",\n    ".join(table["columns"])
        parts.append(f"-- {table['purpose']}")
        parts.append(f"CREATE TABLE IF NOT EXISTS {table['name']} (\n    {cols}\n);")
        for idx in table.get("indexes", []):
            parts.append(f"{idx};")
        if table.get("timescaledb"):
            parts.append(f"SELECT create_hypertable('{table['name']}', 'calculated_at', if_not_exists => TRUE);")
        parts.append("")

    parts.append(WORM_TRIGGER_SQL)
    parts.append(generate_rls_sql())

    return "\n".join(parts)


class SchemaManager:
    """Управління PostgreSQL схемою v55.3."""

    def get_schema_info(self) -> dict[str, Any]:
        """Інформація про поточну схему."""
        worm_tables = [t["name"] for t in TABLES if t.get("worm")]
        rls_tables = [t["name"] for t in TABLES if t.get("rls")]
        ts_tables = [t["name"] for t in TABLES if t.get("timescaledb")]
        return {
            "version": SCHEMA_VERSION,
            "total_tables": len(TABLES),
            "worm_tables": worm_tables,
            "rls_tables": rls_tables,
            "timescaledb_hypertables": ts_tables,
            "tables": [{"name": t["name"], "purpose": t["purpose"]} for t in TABLES],
        }

    def get_migration_sql(self) -> str:
        """Генерує SQL міграції."""
        return generate_full_schema_sql()
