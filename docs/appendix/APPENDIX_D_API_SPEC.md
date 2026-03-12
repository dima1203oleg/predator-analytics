# Додаток Г — Детальна API специфікація

## Зміст
1. [Загальна інформація](#1-загальна-інформація)
2. [Автентифікація](#2-автентифікація)
3. [Українські реєстри](#3-українські-реєстри)
4. [OSINT 2.0](#4-osint-20)
5. [Графова аналітика](#5-графова-аналітика)
6. [AML Scoring](#6-aml-scoring)
7. [Anomaly Detection](#7-anomaly-detection)

---

## 1. Загальна інформація

### Base URLs

| Сервіс | URL | Опис |
|--------|-----|------|
| Core API | `http://localhost:8000/api/v1` | Основний API |
| OSINT Service | `http://localhost:8001/api/v1/osint` | OSINT інструменти |
| Graph Service | `http://localhost:8002/api/v1/graph` | Графова аналітика |

### Формат відповідей

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-11T22:00:00Z",
    "request_id": "uuid",
    "response_time_ms": 150
  }
}
```

### Коди помилок

| Код | Опис |
|-----|------|
| 400 | Bad Request — невалідні параметри |
| 401 | Unauthorized — потрібна автентифікація |
| 403 | Forbidden — недостатньо прав |
| 404 | Not Found — ресурс не знайдено |
| 429 | Too Many Requests — перевищено ліміт |
| 500 | Internal Server Error |

---

## 2. Автентифікація

### POST /auth/login

Отримання JWT токена.

**Request:**
```json
{
  "email": "analyst@predator.ua",
  "password": "********"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### GET /auth/me

Профіль поточного користувача.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "analyst@predator.ua",
  "role": "analyst",
  "tenant_id": "tenant_001",
  "permissions": ["read_corp_data", "run_analytics", "run_graph"],
  "quota": {
    "api_calls_remaining": 9500,
    "api_calls_limit": 10000
  }
}
```

---

## 3. Українські реєстри

### 3.1. ЄДР (Єдиний державний реєстр)

#### GET /ukraine-registries/edr/company/{edrpou}

Отримати дані компанії за ЄДРПОУ.

**Parameters:**
| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|--------------|------|
| edrpou | string | Так | Код ЄДРПОУ (8 цифр) |

**Response:**
```json
{
  "edrpou": "12345678",
  "name": "ТОВ \"КОМПАНІЯ\"",
  "short_name": "КОМПАНІЯ",
  "status": "active",
  "registration_date": "2015-03-20",
  "address": {
    "full": "01001, м. Київ, вул. Хрещатик, 1",
    "region": "Київська",
    "city": "Київ",
    "street": "Хрещатик",
    "building": "1"
  },
  "kved": {
    "primary": "62.01",
    "primary_name": "Комп'ютерне програмування",
    "secondary": ["62.02", "63.11"]
  },
  "authorized_capital": 100000.00,
  "founders": [
    {
      "name": "Іванов Іван Іванович",
      "type": "person",
      "share": 50.0,
      "rnokpp": "1234567890"
    },
    {
      "name": "ТОВ \"ХОЛДИНГ\"",
      "type": "organization",
      "share": 50.0,
      "edrpou": "87654321"
    }
  ],
  "managers": [
    {
      "name": "Петров Петро Петрович",
      "position": "Директор",
      "appointment_date": "2020-01-15"
    }
  ],
  "beneficiaries": [
    {
      "name": "Іванов Іван Іванович",
      "ownership_percentage": 75.0,
      "country": "UA"
    }
  ],
  "contacts": {
    "phone": "+380441234567",
    "email": "info@company.ua",
    "website": "https://company.ua"
  },
  "source": "edr",
  "updated_at": "2026-03-11T10:00:00Z"
}
```

#### POST /ukraine-registries/edr/search

Пошук компаній за критеріями.

**Request:**
```json
{
  "name": "КОМПАНІЯ",
  "region": "Київська",
  "kved": "62.01",
  "status": "active",
  "registration_date_from": "2020-01-01",
  "registration_date_to": "2026-12-31",
  "limit": 50,
  "offset": 0
}
```

**Response:**
```json
{
  "total": 150,
  "items": [
    {
      "edrpou": "12345678",
      "name": "ТОВ \"КОМПАНІЯ\"",
      "status": "active",
      "address": "м. Київ, вул. Хрещатик, 1"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

### 3.2. Реєстр платників ПДВ

#### GET /ukraine-registries/vat/{edrpou}

Перевірка статусу платника ПДВ.

**Response:**
```json
{
  "edrpou": "12345678",
  "name": "ТОВ \"КОМПАНІЯ\"",
  "ipn": "123456789012",
  "is_vat_payer": true,
  "registration_date": "2015-04-01",
  "status": "active",
  "tax_office": "ДПІ у Шевченківському районі м. Києва"
}
```

### 3.3. Реєстр боржників

#### GET /ukraine-registries/debtors/{edrpou}

Перевірка податкових боргів.

**Response:**
```json
{
  "edrpou": "12345678",
  "name": "ТОВ \"КОМПАНІЯ\"",
  "has_debt": true,
  "total_debt": 1500000.00,
  "debts": [
    {
      "type": "tax",
      "amount": 1000000.00,
      "date": "2025-06-15",
      "description": "Податок на прибуток"
    },
    {
      "type": "penalty",
      "amount": 500000.00,
      "date": "2025-09-01",
      "description": "Штрафні санкції"
    }
  ],
  "is_restructured": false
}
```

### 3.4. Судовий реєстр

#### GET /ukraine-registries/court/cases

Пошук судових справ.

**Parameters:**
| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|--------------|------|
| party_name | string | Ні | Назва сторони |
| party_edrpou | string | Ні | ЄДРПОУ сторони |
| case_number | string | Ні | Номер справи |
| court | string | Ні | Назва суду |
| date_from | date | Ні | Дата від |
| date_to | date | Ні | Дата до |
| limit | int | Ні | Ліміт (default: 50) |

**Response:**
```json
{
  "total": 25,
  "cases": [
    {
      "case_number": "910/1234/26",
      "court": "Господарський суд міста Києва",
      "date": "2026-01-15",
      "type": "господарська",
      "status": "розглядається",
      "parties": [
        {
          "name": "ТОВ \"КОМПАНІЯ\"",
          "role": "plaintiff",
          "edrpou": "12345678"
        },
        {
          "name": "ТОВ \"КОНТРАГЕНТ\"",
          "role": "defendant",
          "edrpou": "87654321"
        }
      ],
      "subject": "Стягнення заборгованості",
      "amount": 500000.00,
      "decisions": [
        {
          "date": "2026-02-20",
          "type": "ухвала",
          "summary": "Відкрито провадження у справі"
        }
      ]
    }
  ]
}
```

### 3.5. Prozorro

#### GET /ukraine-registries/prozorro/tenders

Пошук тендерів.

**Parameters:**
| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|--------------|------|
| participant_edrpou | string | Ні | ЄДРПОУ учасника |
| procuring_entity_edrpou | string | Ні | ЄДРПОУ замовника |
| status | string | Ні | Статус тендера |
| amount_from | decimal | Ні | Сума від |
| amount_to | decimal | Ні | Сума до |
| date_from | date | Ні | Дата від |
| date_to | date | Ні | Дата до |

**Response:**
```json
{
  "total": 45,
  "tenders": [
    {
      "tender_id": "UA-2026-03-01-000001-a",
      "title": "Закупівля комп'ютерного обладнання",
      "status": "complete",
      "procuring_entity": {
        "name": "Міністерство цифрової трансформації",
        "edrpou": "00000001"
      },
      "expected_value": 1000000.00,
      "currency": "UAH",
      "participants": [
        {
          "name": "ТОВ \"КОМПАНІЯ\"",
          "edrpou": "12345678",
          "bid_amount": 950000.00,
          "is_winner": true
        },
        {
          "name": "ТОВ \"КОНКУРЕНТ\"",
          "edrpou": "11111111",
          "bid_amount": 980000.00,
          "is_winner": false
        }
      ],
      "award_date": "2026-03-15",
      "contract_amount": 950000.00
    }
  ]
}
```

### 3.6. Санкції РНБО

#### GET /ukraine-registries/sanctions/check

Перевірка у санкційному списку.

**Parameters:**
| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|--------------|------|
| name | string | Так | ПІБ або назва |
| edrpou | string | Ні | ЄДРПОУ |
| rnokpp | string | Ні | РНОКПП |

**Response:**
```json
{
  "is_sanctioned": false,
  "matches": [],
  "checked_lists": ["rnbo_ua"],
  "checked_at": "2026-03-11T22:00:00Z"
}
```

### 3.7. Комплексне розслідування

#### POST /ukraine-registries/investigate/full

Повний аналіз компанії з усіх реєстрів.

**Request:**
```json
{
  "edrpou": "12345678"
}
```

**Response:**
```json
{
  "edrpou": "12345678",
  "name": "ТОВ \"КОМПАНІЯ\"",
  "investigation_id": "inv_20260311_001",
  "generated_at": "2026-03-11T22:00:00Z",
  "sections": {
    "edr": { ... },
    "vat": { ... },
    "tax_debts": { ... },
    "court_cases": { ... },
    "prozorro": { ... },
    "sanctions": { ... },
    "property": { ... },
    "vehicles": { ... }
  },
  "risk_assessment": {
    "total_score": 45,
    "risk_level": "medium",
    "factors": [
      {
        "category": "tax",
        "weight": 70,
        "detected": true,
        "description": "Податковий борг 1.5 млн грн"
      }
    ]
  },
  "network": {
    "founders": [...],
    "managers": [...],
    "beneficiaries": [...],
    "related_companies": [...]
  }
}
```

---

## 4. OSINT 2.0

### 4.1. People Search

#### POST /osint-2/people/epieos/email

Глибинний пошук за email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "email": "user@example.com",
  "google": {
    "found": true,
    "google_id": "123456789",
    "name": "User Name",
    "profile_photo": "https://...",
    "youtube_channel": "UCxxxxx",
    "maps_reviews": 15
  },
  "social_profiles": [
    {"platform": "Skype", "username": "user.name"},
    {"platform": "Gravatar", "exists": true}
  ],
  "breaches": [
    {"source": "LinkedIn2021", "date": "2021-06-22"}
  ],
  "response_time_ms": 1250
}
```

#### POST /osint-2/people/sherlock

Пошук username у соцмережах.

**Request:**
```json
{
  "username": "john_doe"
}
```

**Response:**
```json
{
  "username": "john_doe",
  "total_found": 45,
  "profiles": [
    {
      "platform": "Twitter",
      "url": "https://twitter.com/john_doe",
      "exists": true
    },
    {
      "platform": "Instagram",
      "url": "https://instagram.com/john_doe",
      "exists": true
    }
  ],
  "categories": {
    "social": 15,
    "professional": 8,
    "gaming": 12,
    "other": 10
  }
}
```

### 4.2. Digital Forensics

#### POST /osint-2/forensics/spiderfoot/domain

Сканування домену.

**Request:**
```json
{
  "domain": "example.com",
  "scan_type": "passive"
}
```

**Response:**
```json
{
  "target": "example.com",
  "scan_type": "passive",
  "findings": {
    "dns": {
      "a_records": ["93.184.216.34"],
      "mx_records": ["mail.example.com"],
      "subdomains": ["www", "mail", "api"]
    },
    "whois": {
      "registrar": "GoDaddy",
      "creation_date": "2010-01-15",
      "registrant_org": "Example Corp"
    },
    "ssl": {
      "issuer": "Let's Encrypt",
      "valid_to": "2026-04-01"
    },
    "emails_found": ["admin@example.com", "support@example.com"],
    "technologies": [
      {"name": "nginx", "version": "1.21"},
      {"name": "WordPress", "version": "6.4"}
    ]
  }
}
```

### 4.3. Knowledge Graph

#### POST /osint-2/graph/query

Запит природною мовою.

**Request:**
```json
{
  "question": "Покажи всі компанії, пов'язані з Івановим Петром, які мають податкові борги",
  "follow_up": false
}
```

**Response:**
```json
{
  "question": "Покажи всі компанії, пов'язані з Івановим Петром, які мають податкові борги",
  "answer": "Знайдено 3 компанії, пов'язані з Івановим Петром, що мають податкові борги:\n1. ТОВ \"КОМПАНІЯ А\" (ЄДРПОУ: 12345678) — борг 1.5 млн грн\n2. ТОВ \"КОМПАНІЯ Б\" (ЄДРПОУ: 87654321) — борг 500 тис грн\n...",
  "sources": [
    {"registry": "ЄДР", "date": "2026-03-11"},
    {"registry": "Реєстр боржників", "date": "2026-03-11"}
  ],
  "graph_context": {
    "query_generated": "MATCH (p:Person {name: 'Іванов Петро'})-[:OWNS|MANAGES]->(c:Organization)-[:HAS_DEBT]->(d:Debt) RETURN c, d",
    "nodes_retrieved": 5,
    "relations_retrieved": 8
  },
  "confidence": 0.85
}
```

### 4.4. Sanctions

#### POST /osint-2/sanctions/check

Перевірка у міжнародних санкційних списках.

**Request:**
```json
{
  "name": "Company Name",
  "entity_type": "organization",
  "include_pep": true
}
```

**Response:**
```json
{
  "query": "Company Name",
  "is_sanctioned": false,
  "sanctions_found": 0,
  "lists_checked": ["OFAC SDN", "EU", "UK", "UN", "FATF", "UA (РНБО)"],
  "pep_status": {
    "is_pep": false,
    "pep_level": null
  },
  "risk_score": 0,
  "risk_level": "low",
  "checked_at": "2026-03-11T22:00:00Z"
}
```

---

## 5. Графова аналітика

### GET /graph/summary

Зведена статистика графа.

**Response:**
```json
{
  "nodes": [
    {"id": "org_12345678", "label": "ТОВ КОМПАНІЯ", "type": "company", "riskScore": 45}
  ],
  "links": [
    {"source": "person_1", "target": "org_12345678", "type": "OWNS"}
  ],
  "stats": {
    "total_nodes": 150000,
    "high_risk_count": 1250
  }
}
```

### GET /graph/{ueid}/neighbors

Сусідні вузли сутності.

**Parameters:**
| Параметр | Тип | Обов'язковий | Опис |
|----------|-----|--------------|------|
| ueid | string | Так | Унікальний ID сутності |
| depth | int | Ні | Глибина (1-3, default: 1) |

**Response:**
```json
{
  "center": {
    "ueid": "org_12345678",
    "name": "ТОВ \"КОМПАНІЯ\"",
    "type": "Organization"
  },
  "neighbors": [
    {
      "ueid": "person_1",
      "name": "Іванов Іван",
      "type": "Person",
      "relation": "OWNS",
      "properties": {"share": 50.0}
    }
  ],
  "depth": 1,
  "total_neighbors": 5
}
```

### GET /graph/entities/ubo/{ueid}

Пошук кінцевих бенефіціарів.

**Response:**
```json
{
  "entity": {
    "ueid": "org_12345678",
    "name": "ТОВ \"КОМПАНІЯ\""
  },
  "beneficiaries": [
    {
      "ueid": "person_1",
      "name": "Іванов Іван Іванович",
      "ownership_chain": [
        {"entity": "ТОВ \"КОМПАНІЯ\"", "share": 100},
        {"entity": "ТОВ \"ХОЛДИНГ\"", "share": 75}
      ],
      "total_ownership": 75.0
    }
  ],
  "max_depth": 3
}
```

---

## 6. AML Scoring

### POST /analytics/aml/score

Розрахунок AML-скору.

**Request:**
```json
{
  "entity_id": "12345678",
  "entity_name": "ТОВ \"КОМПАНІЯ\"",
  "entity_type": "organization",
  "data": {
    "sanctions": {"is_sanctioned": false},
    "tax": {"debt_amount": 1500000},
    "court_cases": [],
    "founders": [{"country": "CY", "name": "Offshore Ltd"}],
    "beneficiaries": [],
    "financial": {"zero_reporting": false},
    "employees_count": 25,
    "authorized_capital": 100000,
    "management_history": [],
    "address": {"companies_count": 3},
    "pep": {"is_pep": false}
  }
}
```

**Response:**
```json
{
  "entity_id": "12345678",
  "entity_name": "ТОВ \"КОМПАНІЯ\"",
  "entity_type": "organization",
  "total_score": 65,
  "risk_level": "high",
  "factors": [
    {
      "category": "tax",
      "name": "Податкові борги",
      "description": "Податкові борги понад 1 млн грн",
      "weight": 70,
      "detected": true,
      "details": {
        "debt_amount": 1500000,
        "threshold": 1000000
      },
      "source": "tax_registry"
    },
    {
      "category": "offshore",
      "name": "Офшорні зв'язки",
      "description": "Зв'язки з офшорними юрисдикціями",
      "weight": 60,
      "detected": true,
      "details": {
        "connections_count": 1,
        "jurisdictions": ["CY"]
      },
      "source": "edr"
    }
  ],
  "recommendations": [
    "⚠️ Значні податкові борги. Рекомендовано перевірити фінансову стабільність.",
    "⚠️ Зв'язки з офшорними юрисдикціями. Рекомендовано перевірити структуру власності."
  ],
  "calculated_at": "2026-03-11T22:00:00Z"
}
```

---

## 7. Anomaly Detection

### POST /analytics/anomaly/patterns

Виявлення паттернів шахрайства.

**Request:**
```json
{
  "entity_data": {
    "id": "12345678",
    "registration_date": "2025-10-01",
    "has_offshore_connections": true,
    "shell_company_score": 65,
    "related_party_transactions_percent": 80
  },
  "transactions": [
    {"sender_id": "A", "receiver_id": "B", "amount": 1000000},
    {"sender_id": "B", "receiver_id": "C", "amount": 950000},
    {"sender_id": "C", "receiver_id": "A", "amount": 900000}
  ]
}
```

**Response:**
```json
{
  "patterns_checked": 7,
  "patterns_detected": 2,
  "anomalies": [
    {
      "id": "pattern_vat_carousel_xxx",
      "pattern": "vat_carousel",
      "severity": "critical",
      "confidence": 0.85,
      "description": "Виявлено паттерн: Карусельна схема ПДВ",
      "details": {
        "pattern_name": "Карусельна схема ПДВ",
        "matched_indicators": ["circular_transactions", "rapid_company_creation"],
        "match_score": 0.85
      }
    },
    {
      "id": "pattern_transfer_pricing_xxx",
      "pattern": "transfer_pricing",
      "severity": "high",
      "confidence": 0.75,
      "description": "Виявлено паттерн: Трансфертне ціноутворення",
      "details": {
        "matched_indicators": ["related_party_transactions", "offshore_connections"],
        "match_score": 0.75
      }
    }
  ]
}
```

---

## Rate Limits

| Роль | Запитів/хвилина | Запитів/день |
|------|-----------------|--------------|
| admin | 1000 | 100000 |
| analyst | 100 | 10000 |
| operator | 50 | 5000 |
| viewer | 20 | 2000 |

---

## Версіонування API

API версіонується через URL prefix:
- `/api/v1/` — поточна стабільна версія
- `/api/v2/` — наступна версія (beta)

Зміни у minor версіях є backward-compatible.

---

*Останнє оновлення: 2026-03-11*
