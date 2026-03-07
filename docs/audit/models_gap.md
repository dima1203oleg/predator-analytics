# 🗄️ MODELS GAP ANALYSIS: ORM vs ТЗ v4.2.0

> **Дата аудиту:** 7 березня 2026
> **Висновок:** 3 з 7 ключових моделей існують. Потрібно: об'єднати Base, додати Country, Shipment, Port, SanctionList

---

## 1. МОДЕЛЬНА СХЕМА ТЗ v4.2.0 (Neo4j + PostgreSQL)

### Основні сутності (з розділу 7.1 ТЗ)

| Сутність | Таблиця | Стан в ORM | GAP |
|----------|---------|-----------|-----|
| **Company** | `companies` | ✅ `app/models/company.py` | Додати: `country_id`, `industry` |
| **Person** (CompanyPerson) | `company_persons` | ✅ `app/models/company.py` | Додати: `tax_id` alias |
| **Product** | `products` | ✅ `app/models/product.py` | OK — повна модель |
| **Declaration** | `declarations` | ✅ `app/models/declaration.py` | OK — повна модель |
| **Country** | `countries` | ❌ **ВІДСУТНЯ** | Створити |
| **Shipment** | `shipments` | ❌ **ВІДСУТНЯ** | Створити (Phase 2) |
| **Port** | `ports` | ❌ **ВІДСУТНЯ** | Створити (Phase 2) |
| **SanctionList** | `sanction_lists` | ❌ **ВІДСУТНЯ** | Створити (Phase 2) |
| **User** | `users` | 🔄 `app/models/user.py` | Розширити для RBAC |
| **Alert** | `alerts` | 🔄 `app/models/alert.py` | OK базовий |

---

## 2. КРИТИЧНА ПРОБЛЕМА: ДВА РІЗНИХ Base

### Поточний стан

```python
# Файл 1: app/core/database.py (Canonical v4.1)
class Base(DeclarativeBase):
    """Базовий клас для всіх моделей БД."""
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

# Файл 2: app/models/entities.py (Legacy v45)
Base = declarative_base()  # ← LEGACY!
```

### Хто від кого наслідує

```
app/core/database.Base (DeclarativeBase)
└── НІХТО не використовує для бізнес-моделей!

app/models/entities.Base (declarative_base)
├── Source
├── Dataset
├── Job
├── Index
├── Artifact
├── NasTournament
├── NasCandidate
├── Declaration  (через import from app.models.entities)
├── Company
├── CompanyPerson
├── Product
├── User
├── Alert
└── Document
```

### Рішення (Sprint 1, P0)

```python
# КРОК 1: app/core/database.py — залишити canonical Base
from sqlalchemy.orm import DeclarativeBase, declared_attr

class Base(DeclarativeBase):
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

# КРОК 2: app/models/entities.py — замінити імпорт
- Base = declarative_base()
+ from app.core.database import Base

# КРОК 3: Перевірити всі моделі — вони мають __tablename__ = "..."
# Тому declared_attr автоматичний не буде конфліктувати
```

---

## 3. ІСНУЮЧІ МОДЕЛІ — ДЕТАЛЬНИЙ АНАЛІЗ

### Declaration ✅ (готова на 95%)

```
Поля:    id, declaration_number, declaration_date, declaration_type,
         company_id, company_name, company_edrpou,
         product_code, product_name, product_description,
         country_code, country_name,
         weight_kg, weight_net_kg, quantity, quantity_unit,
         value_usd, value_uah, customs_value_usd, duty_uah, vat_uah,
         customs_office, customs_regime,
         anomaly_score, risk_flags,
         raw_data, created_at, updated_at
Зв'язки: company → Company

GAP:
  - Додати: country_id → FK (після створення Country)
  - Додати: product_id → FK (після індексу по code)
  - Додати: data_hash (SHA-256 для дедуплікації)
  - Додати: source_file (для трекінгу походження)
  - Індекси: Composite index на (product_code, declaration_date)
```

### Company ✅ (готова на 90%)

```
Поля:    id, edrpou, name, short_name, status,
         registration_date, legal_form, address, region,
         risk_score, risk_level, last_risk_assessment,
         authorized_capital, annual_revenue, employee_count,
         tax_status, vat_number, is_sanctioned, sanctions_info,
         meta, created_at, updated_at
Зв'язки: declarations, alerts

GAP:
  - Додати: country_id → FK
  - Додати: normalized_name (для Entity Resolution)
  - Додати: name_variants (JSON — масив всіх відомих назв)
```

### Product ✅ (готова на 90%)

```
Поля:    id, code, name_uk, name_en, description,
         section, chapter, heading, subheading,
         duty_rate, vat_rate, excise_rate,
         is_restricted, restrictions_info,
         total_import_volume, total_import_weight,
         avg_price_per_kg, declaration_count,
         meta, created_at, updated_at

GAP:
  - Додати: group (для УКТЗЕД ієрархії — є в Neo4j схемі)
  - Додати: parent_code (для ієрархії)
```

### User 🔄 (потребує розширення для RBAC)

```
Існуючі поля: (не переглянуто детально)
GAP:
  - Додати: role (admin, analyst, viewer)
  - Додати: tenant_id (для multi-tenancy)
  - Додати: subscription_tier (free, business, professional, enterprise)
  - Додати: last_login, login_count
```

---

## 4. МОДЕЛІ ДЛЯ СТВОРЕННЯ

### Country (Sprint 1, P1)

```python
class Country(Base):
    """Країна."""
    __tablename__ = "countries"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    iso_code = Column(String(2), unique=True, nullable=False, index=True)  # UA, CN, TR
    iso_code_3 = Column(String(3), unique=True)  # UKR, CHN, TUR
    name_uk = Column(String(200), nullable=False)
    name_en = Column(String(200))
    region = Column(String(100))  # Europe, Asia, etc.
    risk_level = Column(String(20), default="low")  # low, medium, high
    is_sanctioned = Column(Boolean, default=False)
    meta = Column(JSON)
```

### Shipment (Phase 2)

```python
class Shipment(Base):
    """Поставка / партія товару."""
    __tablename__ = "shipments"

    id = Column(PostgreSQLUUID(as_uuid=True), primary_key=True, default=uuid4)
    declaration_id = Column(PostgreSQLUUID, ForeignKey("declarations.id"))
    date = Column(DateTime, nullable=False)
    weight_kg = Column(Float)
    value_usd = Column(Float)
    port_id = Column(PostgreSQLUUID, ForeignKey("ports.id"))
    status = Column(String(50))  # in_transit, delivered, customs, cleared
```

### AuditLog (Sprint 6)

```python
class AuditLog(Base):
    """Незмінний журнал аудиту."""
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tenant_id = Column(PostgreSQLUUID, nullable=False)
    user_id = Column(PostgreSQLUUID, nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(String(100))
    ip_address = Column(String(45))
    user_agent = Column(Text)
    payload = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    # RLS: no DELETE, no UPDATE
```

---

## 5. ENTITIES.PY — ASSESSMENT

### Залишити в MVP

| Модель | Обґрунтування |
|--------|-------------|
| Source | ETL потребує для трекінгу джерел даних |
| Dataset | ETL потребує для batch processing |
| Job | Background jobs (Celery) |
| Artifact | Зберігання ML моделей, звітів |

### Архівувати (не в MVP)

| Модель | Обґрунтування |
|--------|-------------|
| NasTournament | Legacy NAS/Evolution — Phase 4+ |
| NasCandidate | Legacy NAS/Evolution — Phase 4+ |
| Index | OpenSearch index metadata — можна спростити |

### Pydantic Schemas (вже в entities.py)

```
SourceCreate, SourceRead
DatasetCreate, DatasetRead
JobCreate, JobRead
IndexCreate, IndexRead
ArtifactCreate, ArtifactRead
```

> Перенести в `app/schemas/etl.py` або `app/schemas/sources.py`

---

## 6. ALEMBIC МІГРАЦІЇ — ПЛАН

### Перша міграція (Sprint 1)

```python
"""initial: consolidate base, declarations, companies, products, countries"""

def upgrade():
    # 1. Create countries table
    op.create_table('countries', ...)

    # 2. Add missing columns to declarations
    op.add_column('declarations',
        Column('data_hash', String(64), index=True))
    op.add_column('declarations',
        Column('source_file', String(500)))

    # 3. Create composite indexes
    op.create_index('ix_declarations_product_date',
        'declarations', ['product_code', 'declaration_date'])
```

### Друга міграція (Sprint 2)

```python
"""add etl support columns and data quality fields"""

def upgrade():
    # 1. Add normalized_name to companies
    op.add_column('companies',
        Column('normalized_name', String(500)))
    op.add_column('companies',
        Column('name_variants', JSON))

    # 2. Add parent_code to products
    op.add_column('products',
        Column('parent_code', String(20)))
    op.add_column('products',
        Column('group_name', String(200)))
```

---

## 7. ЗВЕДЕНА GAP ТАБЛИЦЯ

```
MODEL GAP ANALYSIS
═══════════════════════════════════════
Необхідно для MVP:              7 моделей
  ✅ Існують (OK):              3 (Declaration, Company, Product)
  🔄 Потребують розширення:     2 (User, Alert)
  ❌ Відсутні:                  2 (Country, AuditLog)

Для Phase 2:                   +4 моделі
  ❌ Shipment, Port, SanctionList, ForecastResult

КРИТИЧНЕ:
  ⚠️ Два різних Base → об'єднати в Sprint 1
  ⚠️ Немає Alembic міграцій → налаштувати в Sprint 1
  ⚠️ Declaration.data_hash → додати для дедуплікації

ЗАГАЛЬНА ГОТОВНІСТЬ МОДЕЛЕЙ: ~60%
═══════════════════════════════════════
```
