"""Add RLS and indexes for companies and users tables.

Revision ID: 20240616_add_rls_indexes
Revises: None
Create Date: 2026-06-16 12:00:00.000000
"""

# revision identifiers, used by Alembic.
revision = "20240616_add_rls_indexes"
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Enable RLS on tables
    op.execute("ALTER TABLE companies ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
    # Create indexes if not exist
    op.create_index("idx_companies_ueid", "companies", ["ueid"], unique=False)
    op.create_index("idx_users_username", "users", ["username"], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index("idx_companies_ueid", table_name="companies")
    op.drop_index("idx_users_username", table_name="users")
    # Disable RLS
    op.execute("ALTER TABLE companies DISABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY")
