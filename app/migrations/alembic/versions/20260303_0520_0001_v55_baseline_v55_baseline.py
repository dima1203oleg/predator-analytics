"""v55 baseline: entities, decision_artifacts, cers_scores, signals, behavioral_scores

Revision ID: 0001_v55_baseline
Revises: None
Create Date: 2026-03-03

This is the baseline migration that creates all v55 schema tables.
It consolidates migrations/003_v55_decision_artifacts.sql and adds
the behavioral_scores table from the Phase 1 spec.
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_v55_baseline"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # Schema & Extensions
    # ------------------------------------------------------------------
    op.execute("CREATE SCHEMA IF NOT EXISTS v55")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ------------------------------------------------------------------
    # v55.entities — UEID Registry
    # ------------------------------------------------------------------
    op.create_table(
        "entities",
        sa.Column("ueid", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("name_normalized", sa.Text(), nullable=False),
        sa.Column("edrpou", sa.String(10), nullable=True),
        sa.Column("inn", sa.String(12), nullable=True),
        sa.Column("fingerprint", sa.String(64), nullable=False),
        sa.Column("metadata", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        schema="v55",
    )
    # Unique index on edrpou (partial — only non-null)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_edrpou ON v55.entities (edrpou) WHERE edrpou IS NOT NULL")
    # pg_trgm GIN index for fuzzy name search
    op.execute("CREATE INDEX IF NOT EXISTS idx_entities_name_trgm ON v55.entities USING gin (name_normalized gin_trgm_ops)")
    op.create_index("idx_entities_fingerprint", "entities", ["fingerprint"], schema="v55")
    op.create_index("idx_entities_type", "entities", ["entity_type"], schema="v55")

    # ------------------------------------------------------------------
    # v55.decision_artifacts — WORM (Write-Once-Read-Many)
    # ------------------------------------------------------------------
    op.create_table(
        "decision_artifacts",
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("tenant_id", sa.String(100), nullable=True),
        sa.Column("trace_id", sa.String(100), nullable=True),
        sa.Column("decision_type", sa.String(100), nullable=False),
        sa.Column("input_fingerprint", sa.String(64), nullable=False),
        sa.Column("model_fingerprint", sa.String(64), nullable=True),
        sa.Column("output_fingerprint", sa.String(64), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False, comment="0.0 - 1.0"),
        sa.Column("explanation", postgresql.JSONB(), nullable=True),
        sa.Column("sources", postgresql.JSONB(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.CheckConstraint("confidence_score >= 0 AND confidence_score <= 1", name="ck_da_confidence_range"),
        schema="v55",
    )
    op.create_index("idx_da_timestamp", "decision_artifacts", ["timestamp"], schema="v55")
    op.create_index("idx_da_decision_type", "decision_artifacts", ["decision_type"], schema="v55")
    op.execute("CREATE INDEX IF NOT EXISTS idx_da_trace_id ON v55.decision_artifacts (trace_id) WHERE trace_id IS NOT NULL")
    op.execute("CREATE INDEX IF NOT EXISTS idx_da_tenant_id ON v55.decision_artifacts (tenant_id) WHERE tenant_id IS NOT NULL")

    # WORM trigger — forbid UPDATE and DELETE
    op.execute("""
        CREATE OR REPLACE FUNCTION v55.prevent_modify_decision_artifacts()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'Decision artifacts are immutable (WORM). UPDATE/DELETE заборонено.';
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("DROP TRIGGER IF EXISTS trg_no_update_decision_artifacts ON v55.decision_artifacts")
    op.execute("""
        CREATE TRIGGER trg_no_update_decision_artifacts
            BEFORE UPDATE OR DELETE ON v55.decision_artifacts
            FOR EACH ROW EXECUTE FUNCTION v55.prevent_modify_decision_artifacts();
    """)

    # ------------------------------------------------------------------
    # v55.cers_scores — CERS History
    # ------------------------------------------------------------------
    op.create_table(
        "cers_scores",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("ueid", postgresql.UUID(as_uuid=True), sa.ForeignKey("v55.entities.ueid"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("level", sa.String(20), nullable=False),
        sa.Column("components", postgresql.JSONB(), nullable=False),
        sa.Column("weights", postgresql.JSONB(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("decorrelation_applied", sa.Boolean(), server_default="false"),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.CheckConstraint("score >= 0 AND score <= 100", name="ck_cers_score_range"),
        sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_cers_confidence_range"),
        schema="v55",
    )
    op.create_index("idx_cers_ueid", "cers_scores", ["ueid", "calculated_at"], schema="v55")
    op.create_index("idx_cers_level", "cers_scores", ["level"], schema="v55")

    # ------------------------------------------------------------------
    # v55.signals — Analytical Signals
    # ------------------------------------------------------------------
    op.create_table(
        "signals",
        sa.Column("signal_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("signal_type", sa.String(50), nullable=False),
        sa.Column("topic", sa.String(200), nullable=False),
        sa.Column("ueid", postgresql.UUID(as_uuid=True), sa.ForeignKey("v55.entities.ueid"), nullable=True),
        sa.Column("layer", sa.String(50), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("details", postgresql.JSONB(), server_default="{}", nullable=False),
        sa.Column("sources", postgresql.JSONB(), server_default="[]", nullable=False),
        sa.Column("trace_id", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.CheckConstraint("score >= 0 AND score <= 100", name="ck_signals_score_range"),
        sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_signals_confidence_range"),
        schema="v55",
    )
    op.create_index("idx_signals_ueid", "signals", ["ueid", "created_at"], schema="v55")
    op.create_index("idx_signals_layer", "signals", ["layer"], schema="v55")
    op.create_index("idx_signals_type", "signals", ["signal_type"], schema="v55")
    op.create_index("idx_signals_created", "signals", ["created_at"], schema="v55")

    # ------------------------------------------------------------------
    # v55.behavioral_scores — BVI, ASS, CP per entity
    # ------------------------------------------------------------------
    op.create_table(
        "behavioral_scores",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("ueid", postgresql.UUID(as_uuid=True), sa.ForeignKey("v55.entities.ueid"), nullable=False),
        sa.Column("bvi", sa.Float(), nullable=False, comment="Behavioral Volatility Index"),
        sa.Column("ass", sa.Float(), nullable=False, comment="Adaptation Speed Score"),
        sa.Column("cp", sa.Float(), nullable=False, comment="Collapse Probability"),
        sa.Column("inertia_index", sa.Float(), nullable=True, comment="Behavioral Inertia Index"),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("calculated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.Column("data_window_start", sa.Date(), nullable=True),
        sa.Column("data_window_end", sa.Date(), nullable=True),
        sa.CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_behavioral_confidence_range"),
        schema="v55",
    )
    op.create_index("idx_behav_ueid", "behavioral_scores", ["ueid", "calculated_at"], schema="v55")

    # ------------------------------------------------------------------
    # updated_at auto-trigger for entities
    # ------------------------------------------------------------------
    op.execute("""
        CREATE OR REPLACE FUNCTION v55.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER trg_entities_updated_at
            BEFORE UPDATE ON v55.entities
            FOR EACH ROW EXECUTE FUNCTION v55.update_updated_at_column();
    """)


def downgrade() -> None:
    # Drop tables in reverse dependency order
    op.drop_table("behavioral_scores", schema="v55")
    op.drop_table("signals", schema="v55")
    op.drop_table("cers_scores", schema="v55")

    # Drop WORM trigger before dropping decision_artifacts
    op.execute("DROP TRIGGER IF EXISTS trg_no_update_decision_artifacts ON v55.decision_artifacts")
    op.execute("DROP FUNCTION IF EXISTS v55.prevent_modify_decision_artifacts()")
    op.drop_table("decision_artifacts", schema="v55")

    # Drop entities (depends on nothing, but has dependents — they're already gone)
    op.execute("DROP TRIGGER IF EXISTS trg_entities_updated_at ON v55.entities")
    op.execute("DROP FUNCTION IF EXISTS v55.update_updated_at_column()")
    op.drop_table("entities", schema="v55")
