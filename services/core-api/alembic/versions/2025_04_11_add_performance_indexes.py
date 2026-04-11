"""
🗄️ Database Migration - Оптимізація Indexes для PREDATOR Analytics v56.1.4

Додавання індексів для покращення продуктивності SQL queries.
"""

from alembic import op
import sqlalchemy as sa


def upgrade():
    """Додати індекси для оптимізації критичних queries."""
    
    # Declarations table - оптимізація Dashboard та Market queries
    op.create_index(
        'idx_declarations_direction',
        'declarations',
        ['direction'],
        unique=False
    )
    
    op.create_index(
        'idx_declarations_customs_value_usd',
        'declarations',
        ['customs_value_usd'],
        unique=False
    )
    
    op.create_index(
        'idx_declarations_importer_ueid',
        'declarations',
        ['importer_ueid'],
        unique=False
    )
    
    op.create_index(
        'idx_declarations_uktzed_code',
        'declarations',
        ['uktzed_code'],
        unique=False
    )
    
    op.create_index(
        'idx_declarations_country_origin',
        'declarations',
        ['country_origin'],
        unique=False
    )
    
    op.create_index(
        'idx_declarations_customs_post',
        'declarations',
        ['customs_post'],
        unique=False
    )
    
    op.create_index(
        'idx_declarations_company_name',
        'declarations',
        ['company_name'],
        unique=False
    )
    
    # Composite index для агрегацій по product_code
    op.create_index(
        'idx_declarations_product_code_value',
        'declarations',
        ['product_code', 'value_usd'],
        unique=False
    )
    
    # Risk Scores table - оптимізація risk queries
    op.create_index(
        'idx_risk_scores_cers_level',
        'risk_scores',
        ['cers'],
        unique=False
    )
    
    op.create_index(
        'idx_risk_scores_entity_ueid',
        'risk_scores',
        ['entity_ueid'],
        unique=False
    )
    
    op.create_index(
        'idx_risk_scores_score_date',
        'risk_scores',
        ['score_date'],
        unique=False
    )
    
    # Composite index для high-risk queries (CERS >= 80)
    op.create_index(
        'idx_risk_scores_cers_entity',
        'risk_scores',
        ['cers', 'entity_ueid'],
        unique=False
    )
    
    # Alerts table - оптимізація alerts queries
    op.create_index(
        'idx_alerts_created_at_desc',
        'alerts',
        [sa.text('created_at DESC')],
        unique=False
    )
    
    op.create_index(
        'idx_alerts_severity',
        'alerts',
        ['severity'],
        unique=False
    )
    
    op.create_index(
        'idx_alerts_alert_type',
        'alerts',
        ['alert_type'],
        unique=False
    )
    
    # Companies table - оптимізація company lookups
    op.create_index(
        'idx_companies_ueid',
        'companies',
        ['ueid'],
        unique=False
    )
    
    # Anomalies table
    op.create_index(
        'idx_anomalies_created_at',
        'anomalies',
        ['created_at'],
        unique=False
    )
    
    op.create_index(
        'idx_anomalies_entity_ueid',
        'anomalies',
        ['entity_ueid'],
        unique=False
    )


def downgrade():
    """Видалити додані індекси."""
    
    # Declarations
    op.drop_index('idx_declarations_direction', table_name='declarations')
    op.drop_index('idx_declarations_customs_value_usd', table_name='declarations')
    op.drop_index('idx_declarations_importer_ueid', table_name='declarations')
    op.drop_index('idx_declarations_uktzed_code', table_name='declarations')
    op.drop_index('idx_declarations_country_origin', table_name='declarations')
    op.drop_index('idx_declarations_customs_post', table_name='declarations')
    op.drop_index('idx_declarations_company_name', table_name='declarations')
    op.drop_index('idx_declarations_product_code_value', table_name='declarations')
    
    # Risk Scores
    op.drop_index('idx_risk_scores_cers_level', table_name='risk_scores')
    op.drop_index('idx_risk_scores_entity_ueid', table_name='risk_scores')
    op.drop_index('idx_risk_scores_score_date', table_name='risk_scores')
    op.drop_index('idx_risk_scores_cers_entity', table_name='risk_scores')
    
    # Alerts
    op.drop_index('idx_alerts_created_at_desc', table_name='alerts')
    op.drop_index('idx_alerts_severity', table_name='alerts')
    op.drop_index('idx_alerts_alert_type', table_name='alerts')
    
    # Companies
    op.drop_index('idx_companies_ueid', table_name='companies')
    
    # Anomalies
    op.drop_index('idx_anomalies_created_at', table_name='anomalies')
    op.drop_index('idx_anomalies_entity_ueid', table_name='anomalies')
