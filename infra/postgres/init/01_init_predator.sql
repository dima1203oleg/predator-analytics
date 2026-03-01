-- ══════════════════════════════════════════════════════════════════
-- PREDATOR Analytics — PostgreSQL 16 Ініціалізація
-- Створює українську конфігурацію повнотекстового пошуку (FTS)
-- та базові розширення
-- ══════════════════════════════════════════════════════════════════

-- Розширення
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- Fuzzy пошук
CREATE EXTENSION IF NOT EXISTS unaccent;       -- Видалення діакритичних знаків
CREATE EXTENSION IF NOT EXISTS btree_gin;      -- GIN індекси
CREATE EXTENSION IF NOT EXISTS btree_gist;     -- GiST індекси
CREATE EXTENSION IF NOT EXISTS uuid_ossp;      -- UUID генерація
CREATE EXTENSION IF NOT EXISTS pgcrypto;        -- Криптографічні функції

-- ══════════════════════════════════════════════════════════════════
-- Українська конфігурація повнотекстового пошуку
-- Пошук по: "Митниця", "аналітика", "OSINT", "імпорт/експорт"
-- ══════════════════════════════════════════════════════════════════

-- Створюємо українську конфігурацію FTS
CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS ukrainian (
    COPY = simple
);

-- Функція для нормалізації українського тексту
CREATE OR REPLACE FUNCTION normalize_uk_text(input text)
RETURNS text AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            unaccent(input),
            '[''ʼ`]',  -- Апостроф, м'який знак
            '''',
            'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Коментарі до конфігурації
COMMENT ON TEXT SEARCH CONFIGURATION ukrainian IS 
    'Українська конфігурація повнотекстового пошуку для PREDATOR Analytics';

-- ══════════════════════════════════════════════════════════════════
-- Базова таблиця для SonarQube (якщо потрібно)
-- ══════════════════════════════════════════════════════════════════

-- Створюємо окрему базу для SonarQube (якщо не існує)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sonarqube') THEN
--         CREATE DATABASE sonarqube;
--     END IF;
-- END $$;

-- Логування
DO $$
BEGIN
    RAISE NOTICE '🚀 PREDATOR Analytics PostgreSQL 16 — ініціалізація завершена!';
    RAISE NOTICE '📝 Українська FTS активована';
    RAISE NOTICE '🔧 Розширення: pg_trgm, unaccent, uuid-ossp, pgcrypto';
END $$;
