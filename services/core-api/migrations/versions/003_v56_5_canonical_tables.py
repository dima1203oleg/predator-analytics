"""Канонічні таблиці TZ v5.0 §4.2 — Фаза 0 Стабілізація.

Додає:
- processed_events (ідемпотентність Kafka подій)
- data_lineage (лінійність / провенанс даних)
- usage_tracking (квоти та білінг per tenant)
- feature_flags (поступовий rollout фічей)

Revision ID: 003_v56_5_canonical_tables
Revises: 002_v55_2_decision_artifacts_update
Create Date: 2026-04-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = "003_v56_5_canonical_tables"
down_revision = "002_v55_2_decision_artifacts_update"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Створити канонічні таблиці TZ v5.0."""

    # ── A. processed_events — ідемпотентність Kafka (TZ §5.3) ──────────
    op.create_table(
        "processed_events",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column(
            "processed_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "status",
            sa.Text(),
            server_default="SUCCESS",
            comment="SUCCESS | FAILED | DLQ",
        ),
    )
    op.create_index(
        "idx_processed_events_tenant",
        "processed_events",
        ["tenant_id"],
    )
    op.create_index(
        "idx_processed_events_at",
        "processed_events",
        ["processed_at"],
    )

    # ── B. data_lineage — провенанс записів (TZ §10.1) ────────────────
    op.create_table(
        "data_lineage",
        sa.Column(
            "id", sa.BigInteger(), autoincrement=True, primary_key=True
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("entity_type", sa.Text(), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "source_name",
            sa.Text(),
            nullable=False,
            comment="YouControl, Customs, OpenSanctions тощо",
        ),
        sa.Column("source_id", sa.Text(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column(
            "ingested_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "idx_lineage_entity",
        "data_lineage",
        ["entity_type", "entity_id"],
    )
    op.create_index(
        "idx_lineage_tenant",
        "data_lineage",
        ["tenant_id"],
    )

    # Увімкнути RLS для data_lineage
    op.execute("ALTER TABLE data_lineage ENABLE ROW LEVEL SECURITY")
    op.execute(
        "CREATE POLICY tenant_isolation_data_lineage ON data_lineage "
        "USING (tenant_id::text = current_setting('app.current_tenant', true))"
    )

    # ── C. usage_tracking — квоти / білінг (TZ §4.2.D) ────────────────
    op.create_table(
        "usage_tracking",
        sa.Column(
            "id", sa.BigInteger(), autoincrement=True, primary_key=True
        ),
        sa.Column(
            "tenant_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tenants.id"),
            nullable=False,
        ),
        sa.Column(
            "metric_type",
            sa.Text(),
            nullable=False,
            comment="api_calls, ai_requests, storage_bytes, declarations",
        ),
        sa.Column(
            "period_date",
            sa.Date(),
            nullable=False,
            server_default=sa.text("CURRENT_DATE"),
        ),
        sa.Column(
            "value", sa.BigInteger(), nullable=False, server_default="0"
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "tenant_id", "metric_type", "period_date",
            name="uq_usage_tenant_metric_date",
        ),
    )
    op.create_index(
        "idx_usage_tracking_tenant",
        "usage_tracking",
        ["tenant_id"],
    )

    # ── D. feature_flags — поступовий rollout (TZ §4.2.E) ──────────────
    op.create_table(
        "feature_flags",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column(
            "flag_key", sa.Text(), nullable=False, unique=True
        ),
        sa.Column(
            "is_enabled", sa.Boolean(), server_default="false"
        ),
        sa.Column(
            "rollout_percent",
            sa.SmallInteger(),
            server_default="0",
            comment="0-100%",
        ),
        sa.Column(
            "tenant_whitelist",
            postgresql.ARRAY(postgresql.UUID(as_uuid=True)),
            server_default="{}",
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # Тригер updated_at для feature_flags
    op.execute(
        """
        CREATE TRIGGER set_updated_at_feature_flags
        BEFORE UPDATE ON feature_flags
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        """
    )

    # Тригер updated_at для usage_tracking
    op.execute(
        """
        CREATE TRIGGER set_updated_at_usage_tracking
        BEFORE UPDATE ON usage_tracking
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        """
    )


def downgrade() -> None:
    """Видалити канонічні таблиці."""

    # Видаляємо тригери
    op.execute(
        "DROP TRIGGER IF EXISTS set_updated_at_feature_flags ON feature_flags"
    )
    op.execute(
        "DROP TRIGGER IF EXISTS set_updated_at_usage_tracking ON usage_tracking"
    )

    # Видаляємо RLS policy
    op.execute(
        "DROP POLICY IF EXISTS tenant_isolation_data_lineage ON data_lineage"
    )

    # Видаляємо таблиці у зворотному порядку
    op.drop_table("feature_flags")
    op.drop_table("usage_tracking")
    op.drop_table("data_lineage")
    op.drop_table("processed_events")
