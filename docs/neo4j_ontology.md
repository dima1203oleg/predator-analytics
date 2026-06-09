# PREDATOR Analytics v56.5-ELITE — Онтологія графової бази (Neo4j)

## Опис

Цей документ визначає онтологію графової бази даних Neo4j для PREDATOR Analytics. Онтологія описує ключові сутності (Nodes), типи зв'язків (Relationships) та їх атрибути для підтримки 100+ аналітичних датасетів.

## Ключові сутності (Nodes / Labels)

### Company (Компанія / Юридична особа / ФОП)

**Атрибути:**
- `edrpou` (string, PK) — код ЄДРПОУ
- `ueid` (string) — унікальний ідентифікатор сутності
- `name` (string) — назва компанії
- `status` (string) — статус компанії
- `registration_date` (date) — дата реєстрації
- `is_fop` (boolean) — чи є ФОП
- `tenant_id` (string) — ідентифікатор тенанту
- `cers_score` (float) — CERS score

### Person (Фізична особа)

**Атрибути:**
- `inn` (string, PK) — ІНН (якщо відомо)
- `ueid` (string) — унікальний ідентифікатор сутності
- `full_name` (string) — ПІБ
- `citizenship` (string) — громадянство
- `is_pep` (boolean) — чи є PEP (Politically Exposed Person)
- `is_sanctioned` (boolean) — чи є під санкціями

### Declaration (Митна декларація)

**Атрибути:**
- `decl_id` (string, PK) — ідентифікатор декларації
- `date` (datetime) — дата декларації
- `type` (string) — тип (IM/EK)
- `total_invoice_value` (float) — загальна вартість інвойсу
- `currency` (string) — валюта

### Product (Товар / УКТЗЕД)

**Атрибути:**
- `hs_code` (string, PK) — код УКТЗЕД
- `uktzed_code` (string) — код УКТЗЕД (legacy)
- `description` (string) — опис товару
- `category` (string) — категорія
- `name_uk` (string) — назва українською

### CustomsPost (Митний пост / КПП)

**Атрибути:**
- `post_code` (string, PK) — код митного посту
- `code` (string) — код (legacy)
- `name` (string) — назва
- `region` (string) — регіон
- `location` (point/coordinates) — координати

### Broker (Митний брокер)

**Атрибути:**
- `license_id` (string, PK) — номер ліцензії
- `name` (string) — назва брокера

### Address (Локація / Юридична адреса)

**Атрибути:**
- `address_hash` (string, PK) — нормалізований хеш адреси
- `full_address` (string) — повна адреса

### Country (Країна)

**Атрибути:**
- `iso_code` (string, PK) — ISO код країни
- `name` (string) — назва країни
- `is_offshore` (boolean) — чи є офшорною юрисдикцією
- `is_sanctioned` (boolean) — чи країна під санкціями
- `risk_level` (string) — рівень ризику (low/medium/high/critical)

## Типи зв'язків (Relationships / Edges)

### Бізнес-зв'язки

**DIRECTS** — Особа керує компанією
- `(Person)-[:DIRECTS {appointment_date}]->(Company)`
- Атрибути: `appointment_date` (date)

**OWNS** — Особа володіє часткою компанії
- `(Person)-[:OWNS {share_percent}]->(Company)`
- Атрибути: `share_percent` (float)

**REGISTERED_AT** — Компанія зареєстрована за адресою
- `(Company)-[:REGISTERED_AT]->(Address)`

### Митні операції

**FILED** — Компанія подала декларацію
- `(Company)-[:FILED]->(Declaration)`

**PROCESSED** — Брокер оформив декларацію
- `(Broker)-[:PROCESSED]->(Declaration)`

**CLEARED_AT** — Декларація пройшла через митний пост
- `(Declaration)-[:CLEARED_AT]->(CustomsPost)`

**CONTAINS** — Декларація містить товар
- `(Declaration)-[:CONTAINS {net_weight, gross_weight, invoice_value, quantity}]->(Product)`
- Атрибути: 
  - `net_weight` (float) — чиста вага
  - `gross_weight` (float) — брутто вага
  - `invoice_value` (float) — вартість інвойсу
  - `quantity` (float) — кількість

**ORIGINATES_FROM** — Товар походить з країни
- `(Declaration)-[:ORIGINATES_FROM]->(Country)`

**DISPATCHED_FROM** — Товар відправлено з країни
- `(Declaration)-[:DISPATCHED_FROM]->(Country)`

## Cypher Схема: Constraints та Indexes

### Constraints (Унікальність первинних ключів)

```cypher
// Компанії
CREATE CONSTRAINT company_edrpou IF NOT EXISTS
    FOR (c:Company) REQUIRE c.edrpou IS UNIQUE;

CREATE CONSTRAINT company_ueid IF NOT EXISTS
    FOR (c:Company) REQUIRE c.ueid IS UNIQUE;

// Особи
CREATE CONSTRAINT person_inn IF NOT EXISTS
    FOR (p:Person) REQUIRE p.inn IS UNIQUE;

CREATE CONSTRAINT person_ueid IF NOT EXISTS
    FOR (p:Person) REQUIRE p.ueid IS UNIQUE;

// Митні декларації
CREATE CONSTRAINT decl_id IF NOT EXISTS
    FOR (d:Declaration) REQUIRE d.decl_id IS UNIQUE;

// Товари (УКТЗЕД)
CREATE CONSTRAINT prod_hs IF NOT EXISTS
    FOR (pr:Product) REQUIRE pr.hs_code IS UNIQUE;

CREATE CONSTRAINT product_code IF NOT EXISTS
    FOR (pr:Product) REQUIRE pr.uktzed_code IS UNIQUE;

// Митні пости
CREATE CONSTRAINT post_code IF NOT EXISTS
    FOR (cp:CustomsPost) REQUIRE cp.post_code IS UNIQUE;

CREATE CONSTRAINT customs_post_code IF NOT EXISTS
    FOR (cp:CustomsPost) REQUIRE cp.code IS UNIQUE;

// Митні брокери
CREATE CONSTRAINT broker_lic IF NOT EXISTS
    FOR (b:Broker) REQUIRE b.license_id IS UNIQUE;

// Адреси
CREATE CONSTRAINT addr_hash IF NOT EXISTS
    FOR (a:Address) REQUIRE a.address_hash IS UNIQUE;

// Країни
CREATE CONSTRAINT country_iso IF NOT EXISTS
    FOR (ct:Country) REQUIRE ct.iso_code IS UNIQUE;
```

### Indexes (Для прискорення аналітики та Text-to-Query)

```cypher
// Компанії
CREATE INDEX comp_reg_date_idx IF NOT EXISTS FOR (c:Company) ON (c.registration_date);
CREATE INDEX company_name IF NOT EXISTS FOR (c:Company) ON (c.name);
CREATE INDEX company_status IF NOT EXISTS FOR (c:Company) ON (c.status);

// Особи
CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name);
CREATE INDEX person_is_pep IF NOT EXISTS FOR (p:Person) ON (p.is_pep);
CREATE INDEX person_is_sanctioned IF NOT EXISTS FOR (p:Person) ON (p.is_sanctioned);

// Митні декларації
CREATE INDEX decl_date_idx IF NOT EXISTS FOR (d:Declaration) ON (d.date);
CREATE INDEX decl_type_idx IF NOT EXISTS FOR (d:Declaration) ON (d.type);
CREATE INDEX decl_value_idx IF NOT EXISTS FOR (d:Declaration) ON (d.total_invoice_value);

// Товари
CREATE INDEX prod_desc_idx IF NOT EXISTS FOR (pr:Product) ON (pr.description);
CREATE INDEX prod_category_idx IF NOT EXISTS FOR (pr:Product) ON (pr.category);

// Країни
CREATE INDEX country_offshore_idx IF NOT EXISTS FOR (ct:Country) ON (ct.is_offshore);
CREATE INDEX country_sanctioned_idx IF NOT EXISTS FOR (ct:Country) ON (ct.is_sanctioned);

// Зв'язки (Relationships)
CREATE INDEX rel_directs_date IF NOT EXISTS FOR ()-[r:DIRECTS]-() ON (r.appointment_date);
CREATE INDEX rel_owns_share IF NOT EXISTS FOR ()-[r:OWNS]-() ON (r.share_percent);
CREATE INDEX rel_contains_weight IF NOT EXISTS FOR ()-[r:CONTAINS]-() ON (r.net_weight);
CREATE INDEX rel_contains_value IF NOT EXISTS FOR ()-[r:CONTAINS]-() ON (r.invoice_value);
CREATE INDEX rel_contains_quantity IF NOT EXISTS FOR ()-[r:CONTAINS]-() ON (r.quantity);
```

## Інтеграція Онтології з Датасетами (Мапінг Патернів)

### Приклад 1: Датасет №71 "Брокер-невидимка"

**Опис:** Брокер, який обслуговує лише одну компанію, незважаючи на великі обсяги.

```cypher
MATCH (b:Broker)-[:PROCESSED]->(d:Declaration)<-[:FILED]-(c:Company)
WITH b, COUNT(DISTINCT c) AS client_count, COLLECT(DISTINCT c.name) AS clients
WHERE client_count = 1
RETURN b.name AS Broker, clients[0] AS Exclusive_Client
```

### Приклад 2: Датасет №78 "Двоє в кімнаті — одна декларація"

**Опис:** Різні фірми за однією адресою, які імпортують однаковий товар.

```cypher
MATCH (c1:Company)-[:REGISTERED_AT]->(a:Address)<-[:REGISTERED_AT]-(c2:Company)
WHERE c1.edrpou <> c2.edrpou
MATCH (c1)-[:FILED]->(:Declaration)-[:CONTAINS]->(p:Product)<-[:CONTAINS]-(:Declaration)<-[:FILED]-(c2)
RETURN a.full_address, c1.name, c2.name, p.hs_code
```

### Приклад 3: Датасет №84 "Ланцюг прихованого гіганта"

**Опис:** Дрібні компанії, що возять одне й те саме, які зводяться до одного бенефіціара.

```cypher
MATCH (p:Person)-[:OWNS|DIRECTS]->(c:Company)-[:FILED]->(:Declaration)-[:CONTAINS]->(prod:Product)
WITH p, prod, COUNT(DISTINCT c) AS shell_companies, SUM(d.total_invoice_value) AS total_empire_value
WHERE shell_companies >= 5 // Особа контролює 5+ компаній на одному коді товару
RETURN p.full_name, prod.hs_code, shell_companies, total_empire_value
ORDER BY total_empire_value DESC
```

### Приклад 4: Датасет №2 "Бум за ніч"

**Опис:** Перша декларація менше ніж за 7 днів після реєстрації.

```cypher
MATCH (c:Company)-[:FILED]->(d:Declaration)
WITH c, MIN(d.date) AS first_decl_date
WHERE duration.inDays(date(c.registration_date), date(first_decl_date)).days < 7
RETURN c.name, c.registration_date, first_decl_date
```

## Архітектурні принципи

1. **Аналітична вага на ребрах** — Суми, обсяги, вага зберігаються на зв'язках для швидкого проходження графом без підняття важких таблиць.

2. **Унікальність через constraints** — Жорсткі обмеження унікальності запобігають дублюванню даних.

3. **Індекси для аналітики** — Індекси оптимізовані для типових аналітичних запитів (дати, суми, коди).

4. **Гнучкість для 100+ датасетів** — Онтологія підтримує всі типи аналітичних патернів: бізнес-зв'язки, митні операції, географічні залежності.

## Наступні кроки

1. Реалізувати SQLAlchemy моделі для сутностей онтології
2. Інтегрувати онтологію з 100 датасетами (мапінг патернів)
3. Створити ETL конвеєр для заповнення графа
4. Реалізувати Pattern Engine для виконання Cypher запитів
5. Інтегрувати з Text-to-Query Bridge для AI-агента
