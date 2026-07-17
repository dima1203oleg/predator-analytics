// ============================================================
// PREDATOR Analytics v56.5-ELITE
// Neo4j 5 — Графова онтологія: обмеження, індекси, seed
// Вимоги: Neo4j Community 5 з плагінами APOC + GDS
// ============================================================

// ============================================================
// Обмеження унікальності (UNIQUE CONSTRAINTS)
// ============================================================

// Компанії
CREATE CONSTRAINT company_edrpou IF NOT EXISTS
    FOR (c:Company) REQUIRE c.edrpou IS UNIQUE;

CREATE CONSTRAINT company_ueid IF NOT EXISTS
    FOR (c:Company) REQUIRE c.ueid IS UNIQUE;

CREATE CONSTRAINT company_id IF NOT EXISTS
    FOR (c:Company) REQUIRE c.id IS UNIQUE;

// Особи
CREATE CONSTRAINT person_inn IF NOT EXISTS
    FOR (p:Person) REQUIRE p.inn IS UNIQUE;

CREATE CONSTRAINT person_ueid IF NOT EXISTS
    FOR (p:Person) REQUIRE p.ueid IS UNIQUE;

CREATE CONSTRAINT person_id IF NOT EXISTS
    FOR (p:Person) REQUIRE p.id IS UNIQUE;

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

CREATE CONSTRAINT country_code IF NOT EXISTS
    FOR (co:Country) REQUIRE co.iso_code IS UNIQUE;

// Санкційні списки
CREATE CONSTRAINT sanction_list_code IF NOT EXISTS
    FOR (sl:SanctionList) REQUIRE sl.code IS UNIQUE;

// Банківські рахунки
CREATE CONSTRAINT bank_account_iban IF NOT EXISTS
    FOR (ba:BankAccount) REQUIRE ba.iban IS UNIQUE;

// Домени
CREATE CONSTRAINT domain_name IF NOT EXISTS
    FOR (d:Domain) REQUIRE d.domain IS UNIQUE;

// ============================================================
// Індекси для пошуку та аналітики
// ============================================================

// Компанії
CREATE INDEX company_edrpou IF NOT EXISTS FOR (c:Company) ON (c.edrpou);
CREATE INDEX company_name IF NOT EXISTS FOR (c:Company) ON (c.name);
CREATE INDEX company_tenant IF NOT EXISTS FOR (c:Company) ON (c.tenant_id);
CREATE INDEX company_cers IF NOT EXISTS FOR (c:Company) ON (c.cers_score);
CREATE INDEX company_status IF NOT EXISTS FOR (c:Company) ON (c.status);
CREATE INDEX comp_reg_date_idx IF NOT EXISTS FOR (c:Company) ON (c.registration_date);

// Особи
CREATE INDEX person_inn IF NOT EXISTS FOR (p:Person) ON (p.inn);
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

// Адреси
CREATE INDEX address_full IF NOT EXISTS FOR (a:Address) ON (a.full_address);

// Країни
CREATE INDEX country_offshore_idx IF NOT EXISTS FOR (ct:Country) ON (ct.is_offshore);
CREATE INDEX country_sanctioned_idx IF NOT EXISTS FOR (ct:Country) ON (ct.is_sanctioned);

// IP адреси
CREATE INDEX ip_address IF NOT EXISTS FOR (ip:IPAddress) ON (ip.ip);
CREATE INDEX ip_asn IF NOT EXISTS FOR (ip:IPAddress) ON (ip.asn);

// ============================================================
// Індекси для зв'язків (Relationships) - для швидкого проходження графом
// ============================================================

// Бізнес-зв'язки
CREATE INDEX rel_directs_date IF NOT EXISTS FOR ()-[r:DIRECTS]-() ON (r.appointment_date);
CREATE INDEX rel_owns_share IF NOT EXISTS FOR ()-[r:OWNS]-() ON (r.share_percent);

// Митні операції
CREATE INDEX rel_contains_weight IF NOT EXISTS FOR ()-[r:CONTAINS]-() ON (r.net_weight);
CREATE INDEX rel_contains_value IF NOT EXISTS FOR ()-[r:CONTAINS]-() ON (r.invoice_value);
CREATE INDEX rel_contains_quantity IF NOT EXISTS FOR ()-[r:CONTAINS]-() ON (r.quantity);

// ============================================================
// Seed: Країни (включаючи офшорні юрисдикції)
// ============================================================
MERGE (ua:Country {iso_code: "UA"})
SET ua.name = "Україна", ua.is_offshore = false, ua.risk_level = "low";

MERGE (cn:Country {iso_code: "CN"})
SET cn.name = "Китай", cn.is_offshore = false, cn.risk_level = "medium";

MERGE (tr:Country {iso_code: "TR"})
SET tr.name = "Туреччина", tr.is_offshore = false, tr.risk_level = "medium";

MERGE (de:Country {iso_code: "DE"})
SET de.name = "Німеччина", de.is_offshore = false, de.risk_level = "low";

MERGE (pl:Country {iso_code: "PL"})
SET pl.name = "Польща", pl.is_offshore = false, pl.risk_level = "low";

MERGE (us:Country {iso_code: "US"})
SET us.name = "США", us.is_offshore = false, us.risk_level = "low";

MERGE (gb:Country {iso_code: "GB"})
SET gb.name = "Велика Британія", gb.is_offshore = false, gb.risk_level = "low";

// Офшорні юрисдикції (підвищений ризик)
MERGE (cy:Country {iso_code: "CY"})
SET cy.name = "Кіпр", cy.is_offshore = true, cy.risk_level = "high";

MERGE (bz:Country {iso_code: "BZ"})
SET bz.name = "Беліз", bz.is_offshore = true, bz.risk_level = "critical";

MERGE (pa:Country {iso_code: "PA"})
SET pa.name = "Панама", pa.is_offshore = true, pa.risk_level = "critical";

MERGE (vg:Country {iso_code: "VG"})
SET vg.name = "Британські Віргінські Острови", vg.is_offshore = true, vg.risk_level = "critical";

MERGE (sc:Country {iso_code: "SC"})
SET sc.name = "Сейшельські Острови", sc.is_offshore = true, sc.risk_level = "critical";

MERGE (lv:Country {iso_code: "LV"})
SET lv.name = "Латвія", lv.is_offshore = false, lv.risk_level = "medium";

MERGE (lt:Country {iso_code: "LT"})
SET lt.name = "Литва", lt.is_offshore = false, lt.risk_level = "medium";

MERGE (ee:Country {iso_code: "EE"})
SET ee.name = "Естонія", ee.is_offshore = false, ee.risk_level = "low";

MERGE (ae:Country {iso_code: "AE"})
SET ae.name = "ОАЕ", ae.is_offshore = true, ae.risk_level = "high";

MERGE (hk:Country {iso_code: "HK"})
SET hk.name = "Гонконг", hk.is_offshore = true, hk.risk_level = "high";

MERGE (sg:Country {iso_code: "SG"})
SET sg.name = "Сінгапур", sg.is_offshore = false, sg.risk_level = "medium";

MERGE (ch:Country {iso_code: "CH"})
SET ch.name = "Швейцарія", ch.is_offshore = false, ch.risk_level = "medium";

// ============================================================
// Seed: Санкційні списки
// ============================================================
MERGE (rnbo:SanctionList {code: "RNBO"})
SET rnbo.name = "Санкції РНБО України",
    rnbo.authority = "Рада національної безпеки і оборони України",
    rnbo.url = "https://sanctions.nsdc.gov.ua";

MERGE (eu:SanctionList {code: "EU"})
SET eu.name = "Санкції ЄС",
    eu.authority = "Рада Європейського Союзу",
    eu.url = "https://eur-lex.europa.eu/eli/reg/2022/48";

MERGE (ofac:SanctionList {code: "OFAC"})
SET ofac.name = "Санкції OFAC (США)",
    ofac.authority = "Office of Foreign Assets Control, US Treasury",
    ofac.url = "https://ofac.treasury.gov";

MERGE (un:SanctionList {code: "UN"})
SET un.name = "Санкції ООН",
    un.authority = "Рада Безпеки ООН",
    un.url = "https://www.un.org/securitycouncil/sanctions";

MERGE (uk_ofsi:SanctionList {code: "UK_OFSI"})
SET uk_ofsi.name = "Санкції Великої Британії (OFSI)",
    uk_ofsi.authority = "Office of Financial Sanctions Implementation, HM Treasury",
    uk_ofsi.url = "https://www.gov.uk/government/collections/financial-sanctions-consolidated-list";

// ============================================================
// Seed: Митні пости (основні)
// ============================================================
MERGE (kyiv_boryspil:CustomsPost {code: "UA100020"})
SET kyiv_boryspil.name = "Київська міська митниця (аеропорт Бориспіль)";

MERGE (kyiv_central:CustomsPost {code: "UA100010"})
SET kyiv_central.name = "Київська центральна митниця";

MERGE (odesa:CustomsPost {code: "UA500000"})
SET odesa.name = "Одеська митниця (порт)";

MERGE (lviv:CustomsPost {code: "UA209000"})
SET lviv.name = "Львівська митниця";

MERGE (kharkiv:CustomsPost {code: "UA204000"})
SET kharkiv.name = "Харківська митниця";

// ============================================================
// Seed: Продукти (основні категорії УКТЗЕД)
// ============================================================
MERGE (p94:Product {uktzed_code: "94"})
SET p94.name_uk = "Меблі; постільна білизна, матраци; ліхтарі та освітлювальне обладнання";

MERGE (p85:Product {uktzed_code: "85"})
SET p85.name_uk = "Електричні машини та обладнання; їх частини; звукозаписувальна апаратура";

MERGE (p87:Product {uktzed_code: "87"})
SET p87.name_uk = "Засоби наземного транспорту, крім залізничного або трамвайного";

MERGE (p84:Product {uktzed_code: "84"})
SET p84.name_uk = "Реактори ядерні, котли, машини, апарати і механічні пристрої";

MERGE (p72:Product {uktzed_code: "72"})
SET p72.name_uk = "Чорні метали";

MERGE (p10:Product {uktzed_code: "10"})
SET p10.name_uk = "Зернові культури";

MERGE (p27:Product {uktzed_code: "27"})
SET p27.name_uk = "Мінеральне паливо, мінеральні масла та продукти їх перегонки";

MERGE (p30:Product {uktzed_code: "30"})
SET p30.name_uk = "Фармацевтична продукція";

// ============================================================
// ПРИКЛАДИ CYPHER ЗАПИТІВ ДЛЯ ДАТАСЕТІВ
// ============================================================

// Датасет №71 "Брокер-невидимка"
// (Брокер, який обслуговує лише одну компанію, незважаючи на великі обсяги)
MATCH (b:Broker)-[:PROCESSED]->(d:Declaration)<-[:FILED]-(c:Company)
WITH b, COUNT(DISTINCT c) AS client_count, COLLECT(DISTINCT c.name) AS clients
WHERE client_count = 1
RETURN b.name AS Broker, clients[0] AS Exclusive_Client;

// Датасет №78 "Двоє в кімнаті — одна декларація"
// (Різні фірми за однією адресою, які імпортують однаковий товар)
MATCH (c1:Company)-[:REGISTERED_AT]->(a:Address)<-[:REGISTERED_AT]-(c2:Company)
WHERE c1.edrpou <> c2.edrpou
MATCH (c1)-[:FILED]->(:Declaration)-[:CONTAINS]->(p:Product)<-[:CONTAINS]-(:Declaration)<-[:FILED]-(c2)
RETURN a.full_address, c1.name, c2.name, p.hs_code;

// Датасет №84 "Ланцюг прихованого гіганта"
// (Дрібні компанії, що возять одне й те саме, які зводяться до одного бенефіціара)
MATCH (p:Person)-[:OWNS|DIRECTS]->(c:Company)-[:FILED]->(:Declaration)-[:CONTAINS]->(prod:Product)
WITH p, prod, COUNT(DISTINCT c) AS shell_companies, SUM(d.total_invoice_value) AS total_empire_value
WHERE shell_companies >= 5 // Особа контролює 5+ компаній на одному коді товару
RETURN p.full_name, prod.hs_code, shell_companies, total_empire_value
ORDER BY total_empire_value DESC;

// Датасет №2 "Бум за ніч"
// (Перша декларація менше ніж за 7 днів після реєстрації)
MATCH (c:Company)-[:FILED]->(d:Declaration)
WITH c, MIN(d.date) AS first_decl_date
WHERE duration.inDays(date(c.registration_date), date(first_decl_date)).days < 7
RETURN c.name, c.registration_date, first_decl_date;
