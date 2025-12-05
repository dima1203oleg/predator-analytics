"""Initial migration - create core UA tables"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'companies',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('edrpou', sa.String(10), unique=True, index=True),
        sa.Column('name', sa.String(500)),
        sa.Column('status', sa.String(50)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    
    op.create_table(
        'tenders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('tender_id', sa.String(100), unique=True, index=True),
        sa.Column('title', sa.Text()),
        sa.Column('amount', sa.Float()),
        sa.Column('status', sa.String(50)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('tenders')
    op.drop_table('companies')
