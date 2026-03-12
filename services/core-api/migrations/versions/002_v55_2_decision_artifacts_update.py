"""v55.2 - Оновлення decision_artifacts згідно TZ

Revision ID: 002_v55_2_decision_artifacts
Revises: 001_v55_2_alert_events
Create Date: 2026-03-11

"""
from collections.abc import Sequence

from alembic import op

revision: str = '002_v55_2_decision_artifacts'
down_revision: str | None = '001_v55_2_alert_events'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Перевіряємо чи існують колонки і додаємо якщо ні
    # Ці колонки можуть вже існувати в init.sql

    # Додаємо нові колонки якщо їх немає
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'trace_id') THEN
                ALTER TABLE decision_artifacts ADD COLUMN trace_id VARCHAR(64);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'model_id') THEN
                ALTER TABLE decision_artifacts ADD COLUMN model_id VARCHAR(128);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'input_context_hash') THEN
                ALTER TABLE decision_artifacts ADD COLUMN input_context_hash VARCHAR(64);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'output_payload') THEN
                ALTER TABLE decision_artifacts ADD COLUMN output_payload JSONB;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'confidence_score') THEN
                ALTER TABLE decision_artifacts ADD COLUMN confidence_score FLOAT;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'supporting_sources') THEN
                ALTER TABLE decision_artifacts ADD COLUMN supporting_sources JSONB DEFAULT '[]'::jsonb;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'explanation') THEN
                ALTER TABLE decision_artifacts ADD COLUMN explanation JSONB;
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'reviewed_by') THEN
                ALTER TABLE decision_artifacts ADD COLUMN reviewed_by UUID REFERENCES users(id);
            END IF;

            IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_name = 'decision_artifacts' AND column_name = 'reviewed_at') THEN
                ALTER TABLE decision_artifacts ADD COLUMN reviewed_at TIMESTAMPTZ;
            END IF;
        END $$;
    """)

    # Створюємо індекс на trace_id якщо не існує
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_decision_artifacts_trace_id
        ON decision_artifacts(trace_id);
    """)


def downgrade() -> None:
    # Видаляємо індекс
    op.execute('DROP INDEX IF EXISTS idx_decision_artifacts_trace_id')

    # Видаляємо колонки (обережно - це WORM таблиця)
    # В production краще не видаляти колонки з WORM таблиць
    pass
