"""SCD Type 2 для companies та persons (TZ v5.0 §4.2)
Zero-Downtime Migration Pattern.

Revision ID: 004_v56_5_scd_type2
Revises: 003_v56_5_canonical_tables
Create Date: 2026-04-21
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers
revision = "004_v56_5_scd_type2"
down_revision = "003_v56_5_canonical_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Зняття старих UNIQUE обмежень ──
    op.drop_constraint("companies_ueid_key", "companies", type_="unique")
    op.drop_constraint("persons_ueid_key", "persons", type_="unique")

    # ── 2. COMPANIES: Додавання нових колонок (Nullable) ──
    op.add_column("companies", sa.Column("business_key", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("companies", sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True))
    op.add_column("companies", sa.Column("valid_to", sa.DateTime(timezone=True), nullable=True))
    op.add_column("companies", sa.Column("is_current", sa.Boolean(), server_default=sa.text("true"), nullable=True))
    
    # ── 3. PERSONS: Додавання нових колонок (Nullable) ──
    op.add_column("persons", sa.Column("business_key", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("persons", sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True))
    op.add_column("persons", sa.Column("valid_to", sa.DateTime(timezone=True), nullable=True))
    op.add_column("persons", sa.Column("is_current", sa.Boolean(), server_default=sa.text("true"), nullable=True))
    op.add_column("persons", sa.Column("confidence_score", sa.Float(), nullable=True))

    # ── 4. BACKFILL (Заповнення даних для існуючих записів) ──
    op.execute("UPDATE companies SET business_key = id, valid_from = created_at, is_current = true")
    op.execute("UPDATE persons SET business_key = id, valid_from = created_at, is_current = true")

    # ── 5. Зміна колонок на NOT NULL ──
    op.alter_column("companies", "business_key", nullable=False)
    op.alter_column("companies", "valid_from", nullable=False)
    op.alter_column("companies", "is_current", nullable=False)
    
    op.alter_column("persons", "business_key", nullable=False)
    op.alter_column("persons", "valid_from", nullable=False)
    op.alter_column("persons", "is_current", nullable=False)

    # ── 6. Створення нових унікальних індексів (SCD Type 2 rules) ──
    op.create_index("idx_companies_scd", "companies", ["tenant_id", "business_key", "valid_from"], unique=True)
    op.create_index("idx_persons_scd", "persons", ["tenant_id", "business_key", "valid_from"], unique=True)


def downgrade() -> None:
    # 1. Видалення нових індексів
    op.drop_index("idx_companies_scd", table_name="companies")
    op.drop_index("idx_persons_scd", table_name="persons")

    # 2. Видалення колонок
    op.drop_column("persons", "confidence_score")
    op.drop_column("persons", "is_current")
    op.drop_column("persons", "valid_to")
    op.drop_column("persons", "valid_from")
    op.drop_column("persons", "business_key")

    op.drop_column("companies", "is_current")
    op.drop_column("companies", "valid_to")
    op.drop_column("companies", "valid_from")
    op.drop_column("companies", "business_key")

    # 3. Відновлення UNIQUE для ueid
    op.create_unique_constraint("companies_ueid_key", "companies", ["ueid"])
    op.create_unique_constraint("persons_ueid_key", "persons", ["ueid"])
