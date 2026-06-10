"""
Приклад Alembic міграції для WORM-таблиць

Цей файл демонструє канонічний патерн зміни структури WORM-таблиць
(audit_log, decision_artifacts) без порушення тригерів безпеки.

ПАТЕРН ВИКОРИСТАННЯ:
1. Встановити прапор міграції: SET LOCAL app.alembic_migration = 'true'
2. Виконати DDL операції (ADD COLUMN, ALTER COLUMN, тощо)
3. Прапор автоматично скидається в кінці транзакції

HR-16: WORM таблиці захищені тригерами від несанкціонованих змін
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'example_worm_001'
down_revision = None  # Встановіть на попередню ревізію
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Додати нову колонку до WORM-таблиці audit_log
    
    КРИТИЧНО: Спочатку встановлюємо прапор міграції, щоб тригер WORM
    дозволив зміну структури таблиці.
    """
    # КРОК 1: Встановлюємо прапор міграції (тригер WORM пропустить цю транзакцію)
    op.execute("SET LOCAL app.alembic_migration = 'true'")
    
    # КРОК 2: Виконуємо DDL операції
    # Приклад: додаємо колонку для відстеження джерела аудиту
    op.add_column(
        'audit_log',
        sa.Column('source_system', sa.String(100), nullable=True, comment='Джерело події (web, api, worker)')
    )
    
    # КРОК 3: Опціонально - додаємо індекс
    op.create_index(
        'idx_audit_source',
        'audit_log',
        ['source_system']
    )
    
    # Прапор автоматично скидається в кінці транзакції (SET LOCAL)


def downgrade() -> None:
    """
    Відкатити зміни
    
    Також потребує встановлення прапора міграції для WORM-тригера
    """
    # Встановлюємо прапор міграції
    op.execute("SET LOCAL app.alembic_migration = 'true'")
    
    # Видаляємо індекс
    op.drop_index('idx_audit_source', table_name='audit_log')
    
    # Видаляємо колонку
    op.drop_column('audit_log', 'source_system')


# ============================================================
# ПРИКЛАД ДЛЯ decision_artifacts (інша WORM-таблиця)
# ============================================================

def upgrade_decision_artifacts_example() -> None:
    """
    Приклад зміни decision_artifacts (інша WORM-таблиця)
    """
    op.execute("SET LOCAL app.alembic_migration = 'true'")
    
    # Додаємо колонку для версії моделі
    op.add_column(
        'decision_artifacts',
        sa.Column('model_hash', sa.String(64), nullable=True, comment='Хеш моделі для верифікації')
    )
    
    op.create_index('idx_decisions_model_hash', 'decision_artifacts', ['model_hash'])


def downgrade_decision_artifacts_example() -> None:
    """Відкатити зміни decision_artifacts"""
    op.execute("SET LOCAL app.alembic_migration = 'true'")
    
    op.drop_index('idx_decisions_model_hash', table_name='decision_artifacts')
    op.drop_column('decision_artifacts', 'model_hash')


# ============================================================
# ПРИКЛАД ЗМІНИ ТИПУ ДАНИХ (ALTER COLUMN)
# ============================================================

def upgrade_alter_column_example() -> None:
    """
    Приклад зміни типу даних в WORM-таблиці
    
    УВАГА: ALTER COLUMN також потребує прапора міграції
    """
    op.execute("SET LOCAL app.alembic_migration = 'true'")
    
    # Змінюємо тип VARCHAR(100) на VARCHAR(255)
    op.alter_column(
        'audit_log',
        'action',
        type_=sa.String(255),
        existing_type=sa.String(100)
    )


def downgrade_alter_column_example() -> None:
    """Відкатити зміну типу"""
    op.execute("SET LOCAL app.alembic_migration = 'true'")
    
    op.alter_column(
        'audit_log',
        'action',
        type_=sa.String(100),
        existing_type=sa.String(255)
    )


# ============================================================
# БЕЗПЕКОВІ ПРАВИЛА
# ============================================================

"""
⚠️ КРИТИЧНІ ПРАВИЛА ДЛЯ WORM-ТАБЛИЦЬ:

1. ЗАВЖДИ встановлюйте прапор перед DDL операціями:
   op.execute("SET LOCAL app.alembic_migration = 'true'")

2. НІКОЛИ не використовуйте UPDATE/DELETE в міграціях:
   ❌ op.execute("UPDATE audit_log SET action = 'new' WHERE id = 1")
   ✅ Тільки структурні зміни (ADD COLUMN, ALTER COLUMN, тощо)

3. SET LOCAL скидається автоматично в кінці транзакції:
   - Не потрібно вручну скидати прапор
   - Кожна міграція виконується в окремій транзакції

4. Перевіряйте, що тригери існують перед міграцією:
   - is_alembic_migration() має бути в init.sql
   - prevent_audit_modification() має бути активним

5. Тестуйте міграції в dev середовищі:
   - Спочатку перевірте на тестовій БД
   - Переконайтеся, що тригери не блокують міграцію

HR-16: Порушення цих правил = критична помилка безпеки
"""
