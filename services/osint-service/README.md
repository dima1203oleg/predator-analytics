# 🦅 PREDATOR OSINT Service v55.2

> Інтеграція **37 OSINT інструментів** у єдину платформу

## Огляд

OSINT Service — мікросервіс для збору та аналізу розвідувальних даних з відкритих джерел.
Інтегрує найпотужніші GitHub OSINT проєкти у єдиний API.

## Архітектура

```
services/osint-service/
├── app/
│   ├── main.py                 # FastAPI додаток
│   ├── config.py               # Конфігурація
│   ├── routers/                # API роутери (16)
│   │   ├── domain.py           # Домени
│   │   ├── person.py           # Особи
│   │   ├── company.py          # Компанії
│   │   ├── file.py             # Файли
│   │   ├── tools.py            # Управління інструментами
│   │   ├── maritime.py         # 🚢 Maritime Intelligence
│   │   ├── trade.py            # 📊 Trade Intelligence
│   │   ├── financial.py        # 💰 Financial Intelligence
│   │   ├── ukraine.py          # 🇺🇦 Ukraine Registries
│   │   ├── documents.py        # 📄 Document Analysis
│   │   ├── social.py           # 📱 Social Media
│   │   ├── frameworks.py       # 🤖 OSINT Frameworks
│   │   ├── darkweb.py          # 🕸 Dark Web
│   │   └── geolocation.py      # 📍 Geolocation
│   └── tools/                  # OSINT інструменти (37)
│       ├── base.py             # BaseTool, ToolResult
│       ├── registry.py         # ToolRegistry
│       ├── maritime/           # 4 інструменти
│       ├── trade/              # 4 інструменти
│       ├── financial/          # 5 інструментів
│       ├── ukraine/            # 4 інструменти
│       ├── documents/          # 3 інструменти
│       ├── social/             # 3 інструменти
│       ├── frameworks/         # 3 інструменти
│       ├── darkweb/            # 2 інструменти
│       └── geolocation/        # 2 інструменти
└── tests/
```

## Інструменти (37)

### 🌐 Core OSINT (7)
| Інструмент | Опис | GitHub |
|------------|------|--------|
| Amass | Subdomain enumeration | owasp-amass/amass |
| Subfinder | Fast subdomain discovery | projectdiscovery/subfinder |
| theHarvester | Email/domain OSINT | laramies/theHarvester |
| Sherlock | Username search (300+ sites) | sherlock-project/sherlock |
| Maigret | Username search (2500+ sites) | soxoj/maigret |
| Photon | Web crawler | s0md3v/Photon |
| ExifTool | Metadata extraction | exiftool/exiftool |

### 🚢 Maritime Intelligence (4)
| Інструмент | Опис |
|------------|------|
| AIS Stream | Real-time AIS vessel tracking |
| Vessel Tracker | Vessel search & history |
| Container Tracker | Container tracking (BL, booking) |
| Port Intel | Port analytics & congestion |

### 📊 Trade Intelligence (4)
| Інструмент | Опис |
|------------|------|
| Sanctions Checker | OpenSanctions, OFAC, EU |
| Trade Flow Analyzer | UN Comtrade, Trade Map |
| Offshore Detector | ICIJ Leaks (Panama, Paradise) |
| Customs Intel | HS codes, trade patterns |

### 💰 Financial Intelligence (5)
| Інструмент | Опис | GitHub |
|------------|------|--------|
| Aleph | OCCRP document search | alephdata/aleph |
| OpenOwnership | Beneficial owners | openownership |
| FollowTheMoney | Graph data model | alephdata/followthemoney |
| OpenCorporates | 200M+ companies | opencorporates |
| LeakSearch | Breach databases | khast3x/h8mail |

### 🇺🇦 Ukraine Registries (4)
| Інструмент | Опис |
|------------|------|
| EDR | Єдиний державний реєстр |
| NASK | НАЗК декларації |
| Court Registry | ЄДРСР судові рішення |
| Customs UA | Митні дані України |

### 📄 Document Analysis (3)
| Інструмент | Опис | GitHub |
|------------|------|--------|
| Tika | Text/metadata extraction | apache/tika |
| LexNLP | Legal entity extraction | LexPredict/lexnlp |
| OpenRefine | Data cleaning | OpenRefine/OpenRefine |

### 📱 Social Media (3)
| Інструмент | Опис | GitHub |
|------------|------|--------|
| Twint | Twitter/X OSINT | twintproject/twint |
| Instaloader | Instagram OSINT | instaloader/instaloader |
| Social Analyzer | Multi-platform search | qeeqbox/social-analyzer |

### 🤖 OSINT Frameworks (3)
| Інструмент | Опис | GitHub |
|------------|------|--------|
| SpiderFoot | 200+ модулів OSINT | smicallef/spiderfoot |
| Recon-ng | Модульна веб-розвідка | lanmaster53/recon-ng |
| Osmedeus | Offensive security | j3ssie/osmedeus |

### 🕸 Dark Web (2)
| Інструмент | Опис | GitHub |
|------------|------|--------|
| OnionScan | Сканування .onion сайтів | s-rah/onionscan |
| TorBot | Краулер Dark Web | DedSecInside/TorBot |

### 📍 Geolocation (2)
| Інструмент | Опис | GitHub |
|------------|------|--------|
| GeoIP | Геолокація за IP | MaxMind/ip-api |
| Creepy | Геолокація з соцмереж | ilektrojohn/creepy |

---

## 🇺🇦 Українські державні реєстри (18 клієнтів, 70+ джерел)

### Базові реєстри (Ядро)
| # | Реєстр | Держатель | Статус |
|---|--------|-----------|--------|
| 1.1 | **ЄДР** (юросіб та ФОП) | Мін'юст | ✅ Active |
| 1.2 | Реєстр платників ПДВ | ДПС | ✅ Active |
| 1.3 | Реєстр платників єдиного податку | ДПС | ✅ Active |

### Фінансовий моніторинг
| # | Реєстр | Держатель | Статус |
|---|--------|-----------|--------|
| 2.1 | Реєстр боржників (ЄРБ + податкова) | Мін'юст/ДПС | ✅ Active |
| 2.2 | Реєстр виконавчих проваджень (АСВП) | Мін'юст | ✅ Active |
| 2.3 | Реєстр корупціонерів + декларації НАЗК | НАЗК | ✅ Active |

### Судова аналітика
| # | Реєстр | Держатель | Статус |
|---|--------|-----------|--------|
| 3.1 | ЄДРСР (судові рішення) | ДСА | ⚠️ Limited |
| 3.2 | Судовий реєстр справ | ДСА | ✅ Active |

### Майно та активи
| # | Реєстр | Держатель | Статус |
|---|--------|-----------|--------|
| 4.1 | Реєстр прав на нерухоме майно | Мін'юст | ✅ Active |
| 4.2 | Публічна кадастрова карта | Держгеокадастр | 🔴 Archived |
| 4.3 | Реєстр транспортних засобів | МВС | ✅ Active |

### Митниця та ЗЕД
| # | Реєстр | Держатель | Статус |
|---|--------|-----------|--------|
| 5.1 | Реєстр митних брокерів | Держмитслужба | ✅ Active |
| 5.2 | Реєстр складів тимчасового зберігання | Держмитслужба | ✅ Active |
| 5.3 | Реєстр акцизних накладних (ДАКС) | ДПС | ⚠️ Limited |

### Закупівлі та державні видатки
| # | Реєстр | Держатель | Статус |
|---|--------|-----------|--------|
| 6.1 | **Prozorro** (публічні закупівлі) | Мінекономіки | ✅ Active |
| 6.2 | **E-data** (Spending.gov.ua) | Мінфін | ✅ Active |

### Ліцензії та дозволи
| # | Реєстр | Держатель | Статус |
|---|--------|-----------|--------|
| 7.1 | Реєстр ліцензій НКРЕКП (енергетика) | НКРЕКП | ✅ Active |
| 7.2 | Реєстр ліцензій НБУ (банки) | НБУ | ✅ Active |

---

## 🧠 OSINT 2.0 — Поглиблений інструментарій 2026

### People Search 2.0 (Глибинний пошук людей)
| Інструмент | Опис | Можливості |
|------------|------|------------|
| **Epieos** | Швейцарський ніж для email/телефону | Google ID, YouTube, Google Maps відгуки, Skype, Gravatar, HIBP |
| **Holehe** | Перевірка 120+ сервісів | Без сповіщення власника, швидкий асинхронний пошук |
| **Sherlock** | Пошук username у 340+ соцмережах | Цифровий профіль, аналіз інтересів |

### Digital Forensics (Інструменти розслідувань)
| Інструмент | Опис | Можливості |
|------------|------|------------|
| **SpiderFoot** | Модульний OSINT-фреймворк | 200+ джерел: DNS, WHOIS, SSL, соцмережі, threat intel |
| **Hunchly** | Документування розслідувань | Автозбереження сторінок, скріншоти, таймлайн, експорт |
| **Metagoofil** | Видобування метаданих | PDF, DOC, XLS — імена авторів, версії ПЗ, приховані шляхи |

### Knowledge Graph (STIX 2.1 + NLP + RAG)
| Компонент | Опис |
|-----------|------|
| **STIXGraphBuilder** | Побудова графа згідно STIX 2.1 (Threat-Actor, Campaign, Indicator, Infrastructure) |
| **NLPEntityExtractor** | NER + Coreference Resolution + Relationship Extraction |
| **RAGGraphEngine** | Запити природною мовою до графової БД (Neo4j/TypeDB) |
| **PromptGuidedExplorer** | "Покажи всі компанії, пов'язані з Івановим, які мають борги" |

### Міжнародні джерела
| Джерело | Опис | Дані |
|---------|------|------|
| **OpenCorporates** | 200+ млн компаній світу | Материнські/дочірні, офшори, директори |
| **CrunchBase** | Стартапи та інвестиції | Раунди фінансування, інвестори, засновники |
| **Sanctions Aggregator** | Санкційні списки | OFAC SDN, EU, UK, UN, FATF, UA (РНБО) + PEP |

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1/osint
```

### Maritime Intelligence
```
POST /maritime/vessel/search      # Пошук суден
POST /maritime/container/track    # Трекінг контейнерів
POST /maritime/port/analyze       # Аналіз портів
GET  /maritime/ais/{mmsi}         # AIS дані
```

### Trade Intelligence
```
POST /trade/sanctions/check       # Перевірка санкцій
POST /trade/flow/analyze          # Аналіз торгових потоків
POST /trade/offshore/search       # Пошук офшорів
POST /trade/company/investigate   # Комплексне розслідування
```

### Financial Intelligence
```
POST /financial/company/investigate  # Розслідування компанії
POST /financial/person/investigate   # Розслідування особи
POST /financial/leaks/search         # Пошук у витоках
GET  /financial/aleph/search/{q}     # Пошук в Aleph
GET  /financial/ownership/{entity}   # Бенефіціари
POST /financial/graph/build          # Граф зв'язків
```

### Ukraine Registries
```
POST /ukraine/company/search      # Пошук компанії
GET  /ukraine/edr/{edrpou}        # Дані з ЄДР
POST /ukraine/person/search       # Пошук особи
GET  /ukraine/declarations/{name} # Декларації НАЗК
GET  /ukraine/courts/{query}      # Судові справи
GET  /ukraine/customs/{edrpou}    # Митні дані
POST /ukraine/investigate/full    # Повне розслідування
```

### Document Analysis
```
POST /documents/extract           # Витягування тексту (file upload)
POST /documents/analyze/text      # Аналіз тексту (LexNLP)
POST /documents/clean             # Очищення даних
POST /documents/analyze/full      # Повний аналіз документа
```

### Social Media
```
POST /social/username/search      # Пошук username
POST /social/twitter/search       # Twitter пошук
POST /social/instagram/search     # Instagram пошук
POST /social/person/investigate   # Комплексний аналіз
```

### OSINT Frameworks
```
POST /frameworks/spiderfoot/scan  # SpiderFoot сканування (200+ модулів)
POST /frameworks/recon-ng/scan    # Recon-ng веб-розвідка
POST /frameworks/osmedeus/scan    # Osmedeus security scanning
POST /frameworks/comprehensive    # Комплексне сканування всіма фреймворками
GET  /frameworks/available        # Список доступних фреймворків
```

### Dark Web
```
POST /darkweb/onionscan           # Сканування .onion сайту
POST /darkweb/torbot/crawl        # Краулінг Dark Web
POST /darkweb/investigate         # Комплексне розслідування .onion
GET  /darkweb/status              # Статус інструментів
```

### Geolocation
```
POST /geolocation/ip              # Геолокація за IP
POST /geolocation/social          # Геолокація з соцмереж
POST /geolocation/investigate     # Комплексне розслідування локації
GET  /geolocation/status          # Статус інструментів
```

### 🇺🇦 Українські державні реєстри
```
# Базові реєстри
POST /ukraine-registries/edr/search           # Пошук у ЄДР
POST /ukraine-registries/edr/beneficiaries    # Кінцеві бенефіціари
POST /ukraine-registries/edr/history          # Історія змін
POST /ukraine-registries/pdv/check            # Статус платника ПДВ
POST /ukraine-registries/single-tax/check     # Статус єдиного податку

# Фінансовий моніторинг
POST /ukraine-registries/debtors/check        # Реєстр боржників
POST /ukraine-registries/enforcement/check    # Виконавчі провадження
POST /ukraine-registries/nazk/corruptioners   # Реєстр корупціонерів
POST /ukraine-registries/nazk/declarations    # Декларації НАЗК

# Судова аналітика
POST /ukraine-registries/court/decisions      # ЄДРСР (судові рішення)
POST /ukraine-registries/court/cases          # Реєстр справ
GET  /ukraine-registries/court/case/{number}  # Статус справи

# Майно та активи
POST /ukraine-registries/real-estate/search   # Нерухомість
POST /ukraine-registries/cadastre/search      # Кадастр (архів)
POST /ukraine-registries/vehicles/search      # Транспорт
GET  /ukraine-registries/vehicles/vin/{vin}   # Пошук за VIN
GET  /ukraine-registries/vehicles/plate/{num} # Пошук за номером

# Митниця та ЗЕД
POST /ukraine-registries/customs/brokers      # Митні брокери
POST /ukraine-registries/customs/warehouses   # Склади
POST /ukraine-registries/excise/check         # Акцизні накладні

# Закупівлі
POST /ukraine-registries/prozorro/search      # Пошук у Prozorro
POST /ukraine-registries/prozorro/statistics  # Статистика постачальника
GET  /ukraine-registries/prozorro/tender/{id} # Деталі тендера
POST /ukraine-registries/edata/search         # E-data (держвидатки)

# Ліцензії
POST /ukraine-registries/licenses/energy      # Ліцензії НКРЕКП
POST /ukraine-registries/licenses/nbu         # Ліцензії НБУ

# Комплексне розслідування
POST /ukraine-registries/investigate/full     # Повний аналіз компанії
GET  /ukraine-registries/status               # Статус реєстрів
```

### 🧠 OSINT 2.0 — Поглиблений інструментарій
```
# People Search 2.0
POST /osint-2/people/epieos/email         # Epieos: email -> Google ID, YouTube, Maps
POST /osint-2/people/epieos/phone         # Epieos: телефон -> WhatsApp, Telegram, Viber
POST /osint-2/people/holehe               # Holehe: 120+ сервісів без сповіщення
POST /osint-2/people/sherlock             # Sherlock: 340+ соцмереж
POST /osint-2/people/comprehensive        # Комплексний пошук особи

# Digital Forensics
POST /osint-2/forensics/spiderfoot/domain # SpiderFoot: сканування домену (200+ джерел)
POST /osint-2/forensics/spiderfoot/email  # SpiderFoot: сканування email
POST /osint-2/forensics/spiderfoot/ip     # SpiderFoot: сканування IP
POST /osint-2/forensics/metagoofil        # Metagoofil: метадані документів

# Knowledge Graph (STIX 2.1 + NLP + RAG)
POST /osint-2/graph/nlp/extract           # NLP: витягування сутностей з тексту
POST /osint-2/graph/query                 # RAG: запит природною мовою
POST /osint-2/graph/network               # Аналіз мережі зв'язків
POST /osint-2/graph/trace-ownership       # Ланцюг володіння до бенефіціара
POST /osint-2/graph/risk-factors          # Фактори ризику сутності

# Міжнародні джерела
POST /osint-2/international/opencorporates/search    # 200+ млн компаній
GET  /osint-2/international/opencorporates/company   # Деталі компанії
GET  /osint-2/international/opencorporates/network   # Корпоративна мережа
POST /osint-2/international/crunchbase/search        # Стартапи
GET  /osint-2/international/crunchbase/funding       # Раунди фінансування
GET  /osint-2/international/crunchbase/investors     # Інвестори

# Sanctions (OFAC, EU, UK, UN, FATF, UA)
POST /osint-2/sanctions/check             # Перевірка у всіх списках + PEP
POST /osint-2/sanctions/batch             # Пакетна перевірка (до 100 імен)

# Комплексні розслідування
POST /osint-2/investigate/person          # Повне розслідування особи
POST /osint-2/investigate/company         # Повне розслідування компанії
GET  /osint-2/status                      # Статус інструментів
```

## Приклади використання

### Перевірка санкцій
```bash
curl -X POST http://localhost:8000/api/v1/osint/trade/sanctions/check \
  -H "Content-Type: application/json" \
  -d '{"entity": "Company Name", "entity_type": "company"}'
```

### Розслідування компанії (Україна)
```bash
curl -X POST http://localhost:8000/api/v1/osint/ukraine/investigate/full?edrpou=12345678
```

### Пошук username
```bash
curl -X POST http://localhost:8000/api/v1/osint/social/username/search \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe"}'
```

### SpiderFoot сканування
```bash
curl -X POST http://localhost:8000/api/v1/osint/frameworks/spiderfoot/scan \
  -H "Content-Type: application/json" \
  -d '{"target": "example.com", "scan_type": "quick"}'
```

### Dark Web розслідування
```bash
curl -X POST http://localhost:8000/api/v1/osint/darkweb/investigate?target=abc123xyz.onion
```

### Геолокація IP
```bash
curl -X POST http://localhost:8000/api/v1/osint/geolocation/ip \
  -H "Content-Type: application/json" \
  -d '{"ip": "8.8.8.8", "include_threat": true}'
```

### 🇺🇦 Повне розслідування компанії (всі реєстри)
```bash
curl -X POST http://localhost:8000/api/v1/osint/ukraine-registries/investigate/full \
  -H "Content-Type: application/json" \
  -d '{
    "edrpou": "12345678",
    "include_court": true,
    "include_assets": true,
    "include_tenders": true,
    "include_transactions": true
  }'
```

**Відповідь включає:**
- Базова інформація (ЄДР)
- Податковий статус (ПДВ, єдиний податок)
- Борги та виконавчі провадження
- Судові справи
- Нерухомість та транспорт
- Тендери Prozorro
- Транзакції E-data
- **Ризик-скор** (0-100) та фактори ризику

## Конфігурація

### Environment Variables
```bash
# API Keys
SHODAN_API_KEY=xxx
CENSYS_API_KEY=xxx
HIBP_API_KEY=xxx
ALEPH_API_KEY=xxx
OPENCORPORATES_API_KEY=xxx

# Services
TIKA_URL=http://tika:9998
OPENREFINE_URL=http://openrefine:3333

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
```

## Запуск

### Development
```bash
cd services/osint-service
uvicorn app.main:app --reload --port 8000
```

### Docker
```bash
docker build -t predator-osint-service .
docker run -p 8000:8000 predator-osint-service
```

## Тестування

```bash
pytest tests/ -v --cov=app
```

## Ліцензія

Proprietary — PREDATOR Analytics © 2026
