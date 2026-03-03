"""v55: add aggregate column to behavioral_scores

Revision ID: 20260304_0023_v55_behav_aggregate
Revises: 2d500e307145
Create Date: 2026-03-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260304_0023_v55_behav_aggregate"
down_revision: Union[str, None] = "2d500e307145"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "behavioral_scores",
        sa.Column("aggregate", sa.Float(), nullable=False, server_default="0"),
        schema="v55",
    )


def downgrade() -> None:
    op.drop_column("behavioral_scores", "aggregate", schema="v55")
