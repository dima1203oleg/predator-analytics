# PREDATOR Analytics v56.5-ELITE — Архітектура нульової довіри та WORM-аудит (Zero-Trust & Compartmentalization)

## Опис

Оскільки PREDATOR Analytics (v56.5-ELITE) має працювати з даними державного та корпоративного значення, захист інфраструктури повинен базуватися на презумпції компрометації. Архітектура нульової довіри забезпечує захист від інсайдерів та зовнішніх загроз.

## Архітектура

### 1. Рольова ізоляція даних (RLS + Graph Compartmentalization)

Інтеграція Keycloak із базами даних повинна бути наскрізною:

**PostgreSQL RLS (Row-Level Security):**

Кожен запит до TimescaleDB автоматично обгортається Tenant ID з JWT-токена Keycloak. Користувач фізично не може зробити `SELECT *`, якщо рядок не належить до його рівня допуску (Clearance Level).

```sql
-- Налаштування RLS в PostgreSQL
ALTER TABLE gold.companies ENABLE ROW LEVEL SECURITY;

-- Політика для Tech Admin
CREATE POLICY tech_admin_full_access ON gold.companies
    FOR ALL
    TO tech_admin_role
    USING (true);

-- Політика для Standard Client
CREATE POLICY standard_client_limited_access ON gold.companies
    FOR SELECT
    TO standard_client_role
    USING (
        tenant_id = current_setting('app.tenant_id')::uuid
        AND risk_level IN ('low', 'medium')
    );

-- Політика для VIP Client
CREATE POLICY vip_client_full_access ON gold.companies
    FOR SELECT
    TO vip_client_role
    USING (
        tenant_id = current_setting('app.tenant_id')::uuid
    );
```

**Neo4j Node-Level Security:**

Налаштування кастомних ролей у графовій базі. Якщо аналітик має доступ лише до "Митного поста А", система відфільтрує граф так, що під час виконання Cypher-запиту ребра, пов'язані з "Митним постом Б", будуть для нього "прозорими" і не враховуватимуться в результатах.

```cypher
// Створення ролей для різних рівнів доступу
CREATE ROLE tech_admin;
CREATE ROLE standard_client;
CREATE ROLE vip_client;

// Надання прав для Tech Admin
GRANT ACCESS ON DATABASE predator TO tech_admin;
GRANT MATCH {*} ON GRAPH predator NODES * TO tech_admin;
GRANT MATCH {*} ON GRAPH predator RELATIONSHIPS * TO tech_admin;

// Обмежені права для Standard Client
GRANT ACCESS ON DATABASE predator TO standard_client;
GRANT MATCH {name, edrpou, status} ON GRAPH predator NODES Company TO standard_client;
GRANT MATCH ON GRAPH predator RELATIONSHIPS FILED TO standard_client;

// Обмежені права для VIP Client
GRANT ACCESS ON DATABASE predator TO vip_client;
GRANT MATCH {*} ON GRAPH predator NODES Company TO vip_client;
GRANT MATCH {*} ON GRAPH predator NODES Person TO vip_client;
GRANT MATCH ON GRAPH predator RELATIONSHIPS * TO vip_client;
```

### 2. Криптографічна незмінність доказів (WORM - Write Once Read Many)

Для забезпечення юридичної та оперативної чистоти розслідувань впроваджується протокол HR-16:

**Decision Ledgers (Журнали рішень):**

Кожен висновок, згенерований AI-агентом, та кожна знайдена аномалія записуються у спеціальну таблицю з криптографічним підписом (hash-chain). Це гарантує, що якщо "Pattern Engine" знайшов незаконну схему, жоден адміністратор бази даних не зможе "підчистити" цей запис заднім числом без руйнування ланцюга хешів.

```sql
-- Таблиця Decision Ledgers з WORM обмеженнями
CREATE TABLE decision_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    decision_type TEXT NOT NULL,  -- 'ANOMALY_DETECTED', 'RISK_ASSESSMENT', 'AI_REPORT'
    entity_id TEXT NOT NULL,
    decision_data JSONB NOT NULL,
    previous_hash TEXT,  -- Попередній хеш в ланцюгу
    current_hash TEXT NOT NULL,  -- Поточний хеш
    signature TEXT NOT NULL,  -- Криптографічний підпис
    created_by TEXT NOT NULL  -- Хто створив запис
);

-- WORM обмеження (тільки INSERT, без UPDATE/DELETE)
CREATE TRIGGER prevent_update_on_decision_ledgers
BEFORE UPDATE ON decision_ledgers
FOR EACH ROW
EXECUTE FUNCTION abort_update();

CREATE TRIGGER prevent_delete_on_decision_ledgers
BEFORE DELETE ON decision_ledgers
FOR EACH ROW
EXECUTE FUNCTION abort_delete();

-- Функція для обчислення хешу
CREATE OR REPLACE FUNCTION compute_decision_hash(
    p_timestamp TIMESTAMPTZ,
    p_decision_type TEXT,
    p_entity_id TEXT,
    p_decision_data JSONB,
    p_previous_hash TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        digest(
            p_timestamp::text || 
            p_decision_type || 
            p_entity_id || 
            p_decision_data::text || 
            COALESCE(p_previous_hash, ''),
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;
```

### 3. Мережевий периметр (Cilium & Vault)

**Default-Deny L3/L4:**

Cilium блокує будь-який трафік між контейнерами. Docker-контейнер з UI не має права стукати до бази Neo4j — тільки до API Backend.

```yaml
# cilium-network-policy.yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: predator-default-deny
spec:
  endpointSelector: matchLabels:
    app: predator
  ingress:
  - fromEndpoints:
    - matchLabels:
        app: predator-api
    toPorts:
    - ports:
      - port: "8000"
        protocol: TCP
  egress:
  - toEndpoints:
    - matchLabels:
        app: predator-api
    toPorts:
    - ports:
      - port: "8000"
        protocol: TCP
```

**Vault Secret Rotation:**

Паролі до баз (Postgres, ClickHouse, Neo4j) не існують у статичному вигляді. HashiCorp Vault генерує динамічні облікові дані, які "живуть" лише 15 хвилин, що унеможливлює витік стаціонарних доступу.

```hcl
# vault-config.hcl
storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = true
}

# Динамічні облікові дані для PostgreSQL
secrets "database/config/postgresql" {
  plugin_name = "postgresql-database-plugin"
  connection_url = "postgresql://{{username}}:{{password}}@postgres:5432/predator"
  allowed_roles = ["predator-api", "predator-worker"]
  username_template = "predator_{{random 8}}"
}

# Роль для API з TTL 15 хвилин
secrets "database/roles/predator-api" {
  db_name = "postgresql"
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
    "GRANT SELECT ON ALL TABLES IN SCHEMA gold TO \"{{name}}\";"
  ]
  default_ttl = "15m"
  max_ttl = "1h"
}
```

## Переваги

- **Нульова довіра** — Презумпція компрометації на всіх рівнях
- **Рольова ізоляція** — Суворий контроль доступу до даних
- **Криптографічна незмінність** — WORM-аудит гарантує цілісність доказів
- **Динамічні секрети** — Vault Secret Rotation унеможливлює витік стаціонарних доступів

## Наступні кроки

1. Налаштувати PostgreSQL RLS для всіх таблиць
2. Створити кастомні ролі в Neo4j
3. Впровадити Decision Ledgers з WORM обмеженнями
4. Налаштувати Cilium для Default-Deny політики
5. Інтегрувати HashiCorp Vault для динамічних секретів
