# 🧠 Схема Knowledge Graph (OSINT & Analytics)

Цей документ визначає онтологію графа знань (Knowledge Graph) для PREDATOR Analytics (Neo4j).

## 1. Основні Вузли (Nodes)

| Мітка (Label) | Властивості (Properties) | Опис |
|---------------|--------------------------|------|
| `:Company` | `ueid`, `edrpou`, `name`, `status`, `registration_date`, `capital`, `address` | Юридична особа, ФОП |
| `:Person` | `ueid`, `inn`, `full_name`, `birth_date`, `citizenship`, `pep_status` | Фізична особа, бенефіціар, директор |
| `:Product` | `hs_code` (УКТЗЕД), `description`, `category` | Товар, що імпортується/експортується |
| `:CustomsPost` | `code`, `name`, `region`, `type` | Митний пост |
| `:Broker` | `ueid`, `license_number`, `name` | Митний брокер |
| `:Country` | `iso_code`, `name`, `risk_level` | Країна походження/призначення |
| `:Document` | `doc_id`, `type`, `date`, `url` | Судове рішення, декларація, контракт |
| `:Address` | `full_address`, `city`, `zip_code`, `lat`, `lon` | Географічна локація |
| `:Phone` | `number`, `operator`, `status` | Контактний номер телефону |
| `:Email` | `address`, `domain`, `breach_count` | Електронна пошта |
| `:CryptoWallet`| `address`, `currency`, `balance` | Криптовалютний гаманець |
| `:IPAddress` | `ip`, `isp`, `asn`, `country` | IP-адреса хостингу/сервера |
| `:Domain` | `name`, `registrar`, `creation_date` | Доменне ім'я сайту |

## 2. Зв'язки (Relationships / Edges)

### 2.1. Корпоративні зв'язки
- `(Person)-[:FOUNDER_OF {share: float, since: date}]->(Company)`
- `(Person)-[:DIRECTOR_OF {since: date, till: date}]->(Company)`
- `(Company)-[:SUBSIDIARY_OF {share: float}]->(Company)`
- `(Person/Company)-[:BENEFICIAL_OWNER {share: float, via: string}]->(Company)`

### 2.2. Економічна діяльність (Митниця та Податки)
- `(Company)-[:IMPORTS {date: date, volume_kg: float, value_usd: float}]->(Product)`
- `(Company)-[:EXPORTS {date: date, volume_kg: float, value_usd: float}]->(Product)`
- `(Company)-[:CLEARS_CUSTOMS_AT {frequency: int}]->(CustomsPost)`
- `(Company)-[:USES_BROKER {contracts_count: int}]->(Broker)`
- `(Company)-[:PAYS_TAXES_TO]->(TaxOffice)`
- `(Company)-[:SELLS_TO {value_uah: float, invoice_count: int}]->(Company)` *(Податкові накладні)*

### 2.3. Юридичні та Інфраструктурні зв'язки
- `(Company/Person)-[:MENTIONED_IN {role: string}]->(Document)`
- `(Company/Person)-[:REGISTERED_AT {type: 'legal|actual'}]->(Address)`
- `(Company/Person)-[:OWNS_ASSET]->(Property/Vehicle)`
- `(Company)-[:HOSTED_ON]->(Domain/IPAddress)`
- `(Person)-[:USES_CONTACT]->(Phone/Email)`
- `(Company)-[:WON_TENDER {value_uah: float, date: date}]->(Tender)`

## 3. Обмеження та Індекси (Cypher)

```cypher
// Унікальні ідентифікатори
CREATE CONSTRAINT FOR (c:Company) REQUIRE c.ueid IS UNIQUE;
CREATE CONSTRAINT FOR (p:Person) REQUIRE p.ueid IS UNIQUE;
CREATE CONSTRAINT FOR (pr:Product) REQUIRE pr.hs_code IS UNIQUE;
CREATE CONSTRAINT FOR (cp:CustomsPost) REQUIRE cp.code IS UNIQUE;

// Індекси для швидкого пошуку
CREATE INDEX FOR (c:Company) ON (c.edrpou);
CREATE INDEX FOR (p:Person) ON (p.inn);
CREATE FULLTEXT INDEX ft_company_name FOR (c:Company) ON EACH [c.name];
CREATE FULLTEXT INDEX ft_person_name FOR (p:Person) ON EACH [p.full_name];
```

## 4. Алгоритми Графа (Graph Data Science - GDS)

1. **Weakly Connected Components (WCC):** Виявлення ізольованих мереж компаній (фіктивні холдинги).
2. **PageRank:** Виявлення найважливіших "вузлових" компаній або брокерів у схемі.
3. **Betweenness Centrality:** Знаходження "посередників" (прокладок) у фінансових/товарних потоках.
4. **Louvain Modularity:** Кластеризація (виявлення неформальних ФПГ - фінансово-промислових груп).
5. **Node2Vec:** Векторні представлення вузлів для машинного навчання (пошук схожих компаній).
