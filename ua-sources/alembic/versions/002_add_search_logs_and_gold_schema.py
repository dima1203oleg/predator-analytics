"""Add search_logs table and gold schema tables

Revision ID: 002
Revises: 001_create_ua_raw_core_tables
Create Date: 2025-12-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = '002_add_search_logs_and_gold_schema'
down_revision = '001_create_ua_raw_core_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create staging schema
    op.execute("CREATE SCHEMA IF NOT EXISTS staging")
    
    # Create gold schema
    op.execute("CREATE SCHEMA IF NOT EXISTS gold")
    
    # Create staging.raw_data table
    op.create_table(
        'raw_data',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('source', sa.String(100)),
        sa.Column('raw_content', JSONB),
        sa.Column('dataset_type', sa.String(50)),
        sa.Column('fetched_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('processed', sa.Boolean(), server_default='FALSE'),
        sa.Column('error', sa.Text()),
        schema='staging'
    )
    op.create_index('idx_staging_source', 'raw_data', ['source'], schema='staging')
    
    # Create gold.documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('content', sa.Text()),
        sa.Column('author', sa.String(200)),
        sa.Column('published_date', sa.DateTime()),
        sa.Column('category', sa.String(100)),
        sa.Column('source', sa.String(100)),
        sa.Column('raw_id', sa.Integer()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime()),
        schema='gold'
    )
    op.create_index('idx_docs_title', 'documents', ['title'], schema='gold')
    op.create_index('idx_docs_published', 'documents', ['published_date'], schema='gold')
    op.create_index('idx_docs_category', 'documents', ['category'], schema='gold')
    
    # Create gold.users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(100), unique=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255)),
        sa.Column('role', sa.String(50), server_default='user'),
        sa.Column('subscription_level', sa.String(50), server_default='free'),
        sa.Column('can_view_pii', sa.Boolean(), server_default='FALSE'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('last_login', sa.DateTime()),
        schema='gold'
    )
    
    # Create gold.search_logs table (TS-compliant analytics)
    op.create_table(
        'search_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('query', sa.Text(), nullable=False),
        sa.Column('search_type', sa.String(20), server_default='hybrid'),
        sa.Column('results_count', sa.Integer(), server_default='0'),
        sa.Column('response_time_ms', sa.Integer()),
        sa.Column('user_id', sa.Integer()),
        sa.Column('filters', JSONB),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        schema='gold'
    )
    op.create_index('idx_search_logs_created', 'search_logs', ['created_at'], schema='gold')
    op.create_foreign_key(
        'fk_search_logs_user',
        'search_logs', 'users',
        ['user_id'], ['id'],
        source_schema='gold',
        referent_schema='gold'
    )


def downgrade() -> None:
    op.drop_table('search_logs', schema='gold')
    op.drop_table('users', schema='gold')
    op.drop_table('documents', schema='gold')
    op.drop_table('raw_data', schema='staging')
    op.execute("DROP SCHEMA IF EXISTS gold CASCADE")
    op.execute("DROP SCHEMA IF EXISTS staging CASCADE")
