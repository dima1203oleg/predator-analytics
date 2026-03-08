#!/usr/bin/env bash
# =============================================================
# PREDATOR Analytics v55.1
# Seed даних для розробки
# Використання: ./deploy/scripts/seed-data.sh
# =============================================================
set -euo pipefail

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${POSTGRES_USER:-predator}"
PG_DB="${POSTGRES_DB:-predator}"
PGPASSWORD="${POSTGRES_PASSWORD:-changeme_dev}"
export PGPASSWORD

echo "🌱 Запуск seed даних для PREDATOR Analytics v55.1"

psql -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USER}" -d "${PG_DB}" << 'EOSQL'
-- Seed: Тестові компанії
INSERT INTO companies (
    tenant_id, ueid, edrpou, name, name_normalized,
    legal_form, status, registration_date, cers_score, cers_level, source
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'comp_' || encode(sha256('company:12345678:тов ромашка трейд'), 'hex'),
    '12345678', 'ТОВ "РОМАШКА-ТРЕЙД"', 'ТОВ РОМАШКА ТРЕЙД',
    'ТОВ', 'active', '2018-03-15', 42, 'medium', 'seed'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'comp_' || encode(sha256('company:87654321:пат укрімпекс'), 'hex'),
    '87654321', 'ПАТ "УКРІМПЕКС"', 'ПАТ УКРІМПЕКС',
    'ПАТ', 'active', '2005-07-22', 78, 'high', 'seed'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'comp_' || encode(sha256('company:11223344:тов альфа капітал'), 'hex'),
    '11223344', 'ТОВ "АЛЬФА КАПІТАЛ"', 'ТОВ АЛЬФА КАПІТАЛ',
    'ТОВ', 'active', '2021-11-03', 15, 'low', 'seed'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'comp_' || encode(sha256('company:99887766:тов тіньова схема'), 'hex'),
    '99887766', 'ТОВ "ГЛОБАЛ ТРЕЙД СОЛЮШН"', 'ТОВ ГЛОБАЛ ТРЕЙД СОЛЮШН',
    'ТОВ', 'active', '2023-01-15', 91, 'critical', 'seed'
)
ON CONFLICT DO NOTHING;

-- Seed: Тестові особи
INSERT INTO persons (
    tenant_id, ueid, inn, full_name, full_name_normalized,
    date_of_birth, is_pep, is_sanctioned, source
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'pers_' || encode(sha256('person:1234567890:іванов іван іванович:1980-05-15'), 'hex'),
    '1234567890', 'Іванов Іван Іванович', 'ІВАНОВ ІВАН ІВАНОВИЧ',
    '1980-05-15', false, false, 'seed'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'pers_' || encode(sha256('person:0987654321:петренко петро петрович:1975-11-20'), 'hex'),
    '0987654321', 'Петренко Петро Петрович', 'ПЕТРЕНКО ПЕТРО ПЕТРОВИЧ',
    '1975-11-20', true, false, 'seed'
)
ON CONFLICT DO NOTHING;

-- Seed: Тестові декларації
INSERT INTO declarations (
    tenant_id, declaration_number, declaration_date, direction,
    importer_edrpou, importer_name,
    exporter_name, exporter_country,
    uktzed_code, goods_description,
    quantity, unit, net_weight_kg,
    invoice_value_usd, customs_value_usd,
    country_origin, customs_post, source
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'UA100020/240115/0001234', '2024-01-15', 'import',
    '12345678', 'ТОВ "РОМАШКА-ТРЕЙД"',
    'CHINA FURNITURE CO. LTD', 'CN',
    '9403600000', 'Меблі дерев'\''яні для спалень',
    150, 'шт', 4500.00,
    45000.00, 48000.00,
    'CN', 'UA100020', 'seed'
),
(
    'a0000000-0000-0000-0000-000000000001',
    'UA100020/240215/0005678', '2024-02-15', 'import',
    '87654321', 'ПАТ "УКРІМПЕКС"',
    'GLOBAL ELECTRONICS LTD', 'HK',
    '8517120000', 'Телефони мобільні',
    500, 'шт', 250.00,
    125000.00, 110000.00,
    'CN', 'UA100020', 'seed'
)
ON CONFLICT DO NOTHING;

-- Seed: Тестові сповіщення
INSERT INTO alerts (
    tenant_id, alert_type, severity, title, message,
    entity_type, entity_id, is_read
) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'risk_change', 'high',
    'Підвищення ризику: ПАТ УКРІМПЕКС',
    'CERS score збільшився з 62 до 78 через виявлені офшорні зв'\''язки',
    'company', '87654321', false
),
(
    'a0000000-0000-0000-0000-000000000001',
    'anomaly', 'critical',
    'Цінова аномалія у декларації UA100020/240215/0005678',
    'Ціна мобільних телефонів на 32% нижче від медіанної ринкової ціни',
    'declaration', 'UA100020/240215/0005678', false
);

SELECT 'Seed завершено успішно!' AS status;
EOSQL

echo "✅ Seed даних завершено!"
