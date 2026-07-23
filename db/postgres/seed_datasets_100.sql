-- Seed дані для нових таблиць (100 датасетів)
-- Цей файл містить тестові дані для нових таблиць, створених для підтримки 100 датасетів

-- ============================================================
-- Seed: Mitni Brokers
-- ============================================================
INSERT INTO customs_brokers (id, tenant_id, broker_ueid, license_number, name, name_normalized, registration_date, status, address, contact_person, phone, email, specializations, source)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'BROKER-001', 'LIC-001', 'Митний брокер "Київ-Логістик"', 'митний брокер київ логістик', '2020-01-15', 'active', 'м. Київ, вул. Хрещатик, 1', 'Іванов І.І.', '+380441234567', 'info@kyiv-logistic.ua', '["electronics", "textiles"]', 'seed'),
  ('b1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'BROKER-002', 'LIC-002', 'Митний брокер "Одеса-Трейд"', 'митний брокер одеса трейд', '2019-05-20', 'active', 'м. Одеса, вул. Приморська, 10', 'Петров П.П.', '+380487654321', 'info@odessa-trade.ua', '["food", "chemicals"]', 'seed'),
  ('b1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'BROKER-003', 'LIC-003', 'Митний брокер "Львів-Кастомс"', 'митний брокер львів кастомс', '2021-03-10', 'active', 'м. Львів, вул. Шевченка, 5', 'Сидоров С.С.', '+380329876543', 'info@lviv-customs.ua', '["machinery", "vehicles"]', 'seed')
ON CONFLICT (broker_ueid) DO NOTHING;

-- ============================================================
-- Seed: Regulatory Acts
-- ============================================================
INSERT INTO regulatory_acts (id, act_number, act_type, act_date, effective_date, title, description, issuer, uktzed_codes_affected, source)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'КАБ-2023-001', 'resolution', '2023-06-01', '2023-06-15', 'Про тимчасове скасування мит на імпорт електроніки', 'Тимчасове скасування мит на імпорт електронних товарів', 'Кабінет Міністрів України', '["8504", "8517", "8528"]', 'seed'),
  ('a1000000-0000-0000-0000-000000000002', 'КАБ-2023-002', 'resolution', '2023-08-01', '2023-08-10', 'Про зміни в тарифах на текстиль', 'Зміна митних тарифів на текстильні товари', 'Кабінет Міністрів України', '["5208", "5516", "5800"]', 'seed'),
  ('a1000000-0000-0000-0000-000000000003', 'КАБ-2023-003', 'resolution', '2023-10-01', '2023-10-05', 'Про лібералізацію імпорту харчових продуктів', 'Спрощення процедур імпорту харчових продуктів', 'Кабінет Міністрів України', '["0401", "0702", "0901"]', 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Market Prices
-- ============================================================
INSERT INTO market_prices (id, uktzed_code, country, price_min_usd, price_max_usd, price_avg_usd, price_date, source, confidence_level)
VALUES
  ('b1000000-0000-0000-0000-000000000001', '8504', 'World', 10.0, 100.0, 50.0, '2023-12-01', 'COMTRADE', 0.85),
  ('b1000000-0000-0000-0000-000000000002', '8517', 'World', 20.0, 200.0, 100.0, '2023-12-01', 'COMTRADE', 0.90),
  ('b1000000-0000-0000-0000-000000000003', '5208', 'World', 5.0, 50.0, 25.0, '2023-12-01', 'ITC', 0.80),
  ('b1000000-0000-0000-0000-000000000004', '5516', 'World', 8.0, 80.0, 40.0, '2023-12-01', 'ITC', 0.75),
  ('b1000000-0000-0000-0000-000000000005', '0401', 'World', 2.0, 20.0, 10.0, '2023-12-01', 'COMTRADE', 0.85)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Customs Posts Geo
-- ============================================================
INSERT INTO customs_posts_geo (id, post_code, post_name, latitude, longitude, country, region, border_type, infrastructure_type, source)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'UA-KH-001', 'Київська митниця', 50.4501, 30.5234, 'Ukraine', 'Київська область', 'land', 'airport', 'seed'),
  ('c1000000-0000-0000-0000-000000000002', 'UA-OD-001', 'Одеська митниця', 46.4825, 30.7233, 'Ukraine', 'Одеська область', 'sea', 'port', 'seed'),
  ('c1000000-0000-0000-0000-000000000003', 'UA-LV-001', 'Львівська митниця', 49.8397, 24.0297, 'Ukraine', 'Львівська область', 'land', 'road', 'seed'),
  ('c1000000-0000-0000-0000-000000000004', 'UA-KH-002', 'Харківська митниця', 49.9808, 36.2527, 'Ukraine', 'Харківська область', 'land', 'road', 'seed'),
  ('c1000000-0000-0000-0000-000000000005', 'UA-DP-001', 'Дніпропетровська митниця', 48.4647, 35.0462, 'Ukraine', 'Дніпропетровська область', 'land', 'road', 'seed')
ON CONFLICT (post_code) DO NOTHING;

-- ============================================================
-- Seed: Country Production
-- ============================================================
INSERT INTO country_production (id, country_code, uktzed_code, has_production, production_capacity, major_producers, source)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'CN', '8504', true, 'High', '["Foxconn", "Pegatron", "Wistron"]', 'seed'),
  ('d1000000-0000-0000-0000-000000000002', 'DE', '8517', true, 'High', '["Siemens", "Bosch", "SAP"]', 'seed'),
  ('d1000000-0000-0000-0000-000000000003', 'VN', '5208', true, 'Medium', '["Viet Tien", "Canifa", "Bitis"]', 'seed'),
  ('d1000000-0000-0000-0000-000000000004', 'IN', '5516', true, 'High', '["Arvind", "Raymond", "Welspun"]', 'seed'),
  ('d1000000-0000-0000-0000-000000000005', 'UA', '0401', true, 'Medium', '["Milkiland", "Bila Tserkva", "Galychyna"]', 'seed'),
  ('d1000000-0000-0000-0000-000000000006', 'AF', '8504', false, 'None', '[]', 'seed'),
  ('d1000000-0000-0000-0000-000000000007', 'AQ', '5208', false, 'None', '[]', 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Brand Registry
-- ============================================================
INSERT INTO brand_registry (id, brand_name, brand_name_normalized, owner_company, registration_country, registration_date, categories, is_verified, source)
VALUES
  ('ba1000000-0000-0000-0000-000000000001', 'Nike', 'nike', 'Nike, Inc.', 'US', '1971-01-01', '["sportswear", "footwear"]', true, 'seed'),
  ('ba1000000-0000-0000-0000-000000000002', 'Adidas', 'adidas', 'Adidas AG', 'DE', '1949-08-18', '["sportswear", "footwear"]', true, 'seed'),
  ('ba1000000-0000-0000-0000-000000000003', 'Apple', 'apple', 'Apple Inc.', 'US', '1976-04-01', '["electronics", "computers"]', true, 'seed'),
  ('ba1000000-0000-0000-0000-000000000004', 'Samsung', 'samsung', 'Samsung Electronics', 'KR', '1969-01-13', '["electronics", "appliances"]', true, 'seed'),
  ('ba1000000-0000-0000-0000-000000000005', 'Sony', 'sony', 'Sony Corporation', 'JP', '1946-05-07', '["electronics", "entertainment"]', true, 'seed'),
  ('ba1000000-0000-0000-0000-000000000006', 'Gucci', 'gucci', 'Gucci S.p.A.', 'IT', '1921-01-01', '["luxury", "fashion"]', true, 'seed'),
  ('ba1000000-0000-0000-0000-000000000007', 'Rolex', 'rolex', 'Rolex SA', 'CH', '1905-01-01', '["watches", "luxury"]', true, 'seed'),
  ('ba1000000-0000-0000-0000-000000000008', 'BMW', 'bmw', 'Bayerische Motoren Werke AG', 'DE', '1916-03-07', '["automotive", "motorcycles"]', true, 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Licenses Permits
-- ============================================================
INSERT INTO licenses_permits (id, company_ueid, license_type, license_number, issue_date, expiry_date, issuing_authority, scope, uktzed_codes_affected, source)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'UEID-12345678', 'import_license', 'IMP-2023-001', '2023-01-15', '2024-01-15', 'Міністерство економіки', 'Імпорт електроніки', '["8504", "8517"]', 'seed'),
  ('f1000000-0000-0000-0000-000000000002', 'UEID-87654321', 'export_license', 'EXP-2023-002', '2023-03-20', '2024-03-20', 'Міністерство економіки', 'Експорт текстилю', '["5208", "5516"]', 'seed'),
  ('f1000000-0000-0000-0000-000000000003', 'UEID-11111111', 'special_permit', 'SPC-2023-003', '2023-06-01', '2023-12-31', 'Державна фіскальна служба', 'Пільгове ввезення', '["0401", "0702"]', 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: Tax Records (приклад)
-- ============================================================
INSERT INTO tax_records (id, tenant_id, company_ueid, company_edrpou, period_start, period_end, vat_obligations, vat_paid, income_tax, total_tax_obligations, total_tax_paid, source)
VALUES
  ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'UEID-12345678', '12345678', '2023-10-01', '2023-12-31', 100000.0, 95000.0, 50000.0, 150000.0, 145000.0, 'seed'),
  ('a2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'UEID-87654321', '87654321', '2023-10-01', '2023-12-31', 200000.0, 180000.0, 100000.0, 300000.0, 280000.0, 'seed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed: VAT Invoices (приклад)
-- ============================================================
INSERT INTO vat_invoices (id, tenant_id, invoice_number, company_ueid, invoice_date, amount, vat_amount, source)
VALUES
  ('b2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'INV-2023-12-001', 'UEID-12345678', '2023-12-15', 50000.0, 10000.0, 'seed'),
  ('b2000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'INV-2023-12-002', 'UEID-87654321', '2023-12-20', 75000.0, 15000.0, 'seed')
ON CONFLICT DO NOTHING;
