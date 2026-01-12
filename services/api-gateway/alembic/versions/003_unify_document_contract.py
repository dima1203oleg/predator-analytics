"""Unify Document Contract and add Tenant Isolation
Revision ID: 003
Revises: 002_add_search_logs_and_gold_schema
Create Date: 2025-12-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '003_unify_document_contract'
down_revision = '002_add_search_logs_and_gold_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add tenant_id to gold.documents
    # We use a default UUID (all zeros) for existing data to prevent Null issues
    default_tenant = '00000000-0000-0000-0000-000000000000'

    op.add_column('documents', sa.Column('tenant_id', UUID(as_uuid=True), nullable=True), schema='gold')
    op.execute(f"UPDATE gold.documents SET tenant_id = '{default_tenant}' WHERE tenant_id IS NULL")
    op.alter_column('documents', 'tenant_id', nullable=False, schema='gold')
    op.create_index('idx_documents_tenant_id', 'documents', ['tenant_id'], schema='gold')

    # 2. Add missing columns to gold.documents
    op.add_column('documents', sa.Column('source_type', sa.String(length=30), nullable=True), schema='gold')
    op.add_column('documents', sa.Column('meta', JSONB(astext_type=sa.Text()), nullable=True), schema='gold')
    op.create_index('idx_documents_source_type', 'documents', ['source_type'], schema='gold')

    # 3. Add tenant_id to gold.users
    op.add_column('users', sa.Column('tenant_id', UUID(as_uuid=True), nullable=True), schema='gold')
    op.execute(f"UPDATE gold.users SET tenant_id = '{default_tenant}' WHERE tenant_id IS NULL")
    op.alter_column('users', 'tenant_id', nullable=False, schema='gold')
    op.create_index('idx_users_tenant_id', 'users', ['tenant_id'], schema='gold')

    # 4. Create missing tables mentioned in DocumentService (Self-Healing)
    op.create_table(
        'document_summaries',
        sa.Column('document_id', UUID(as_uuid=True), primary_key=True),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('model_name', sa.String(50)),
        sa.Column('word_count', sa.Integer()),
        sa.Column('generated_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['document_id'], ['gold.documents.id'], ondelete='CASCADE'),
        schema='gold'
    )

def downgrade() -> None:
    op.drop_table('document_summaries', schema='gold')
    op.drop_index('idx_users_tenant_id', table_name='users', schema='gold')
    op.drop_column('users', 'tenant_id', schema='gold')
    op.drop_index('idx_documents_source_type', table_name='documents', schema='gold')
    op.drop_column('documents', 'meta', schema='gold')
    op.drop_column('documents', 'source_type', schema='gold')
    op.drop_index('idx_documents_tenant_id', table_name='documents', schema='gold')
    op.drop_column('documents', 'tenant_id', schema='gold')
