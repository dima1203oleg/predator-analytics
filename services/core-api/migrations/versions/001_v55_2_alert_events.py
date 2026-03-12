"""v55.2 - Додавання таблиці alert_events та оновлення alerts

Revision ID: 001_v55_2_alert_events
Revises:
Create Date: 2026-03-11

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_v55_2_alert_events'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Оновлення таблиці alerts
    op.add_column('alerts', sa.Column('name', sa.String(255), nullable=True))
    op.add_column('alerts', sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('alerts', sa.Column('condition_config', postgresql.JSONB(), server_default='{}'))
    op.add_column('alerts', sa.Column('actions', postgresql.JSONB(), server_default='[]'))
    op.add_column('alerts', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')))

    # Створення таблиці alert_events
    op.create_table(
        'alert_events',
        sa.Column('event_id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('alert_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('alerts.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('triggered_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('entity_ueid', sa.String(64), index=True),
        sa.Column('payload', postgresql.JSONB(), nullable=False),
        sa.Column('delivery_status', postgresql.JSONB(), server_default='{}'),
    )

    # Індекси для alert_events
    op.create_index('idx_alert_events_alert', 'alert_events', ['alert_id', 'triggered_at'], postgresql_using='btree')
    op.create_index('idx_alert_events_entity', 'alert_events', ['entity_ueid', 'triggered_at'], postgresql_using='btree')

    # RLS для alert_events
    op.execute('ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY')
    op.execute("""
        CREATE POLICY tenant_isolation_alert_events ON alert_events
        USING (tenant_id::text = current_setting('app.current_tenant', true))
    """)


def downgrade() -> None:
    # Видалення RLS
    op.execute('DROP POLICY IF EXISTS tenant_isolation_alert_events ON alert_events')
    op.execute('ALTER TABLE alert_events DISABLE ROW LEVEL SECURITY')

    # Видалення таблиці alert_events
    op.drop_index('idx_alert_events_entity', table_name='alert_events')
    op.drop_index('idx_alert_events_alert', table_name='alert_events')
    op.drop_table('alert_events')

    # Видалення колонок з alerts
    op.drop_column('alerts', 'updated_at')
    op.drop_column('alerts', 'actions')
    op.drop_column('alerts', 'condition_config')
    op.drop_column('alerts', 'enabled')
    op.drop_column('alerts', 'name')
