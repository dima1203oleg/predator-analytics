/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSourceSolution, LicenseMatrixItem, ArchitectureNode, ArchitectureEdge, GapItem, RoadmapPhase } from './types';

export const SOLUTIONS: OpenSourceSolution[] = [
  {
    id: 'opensanctions',
    name: 'OpenSanctions',
    category: 'Санкції / AML',
    license: 'CC BY-NC 4.0 / Комерційна',
    licenseType: 'Commercial',
    productionReady: 'Tak',
    advantages: [
      'Єдиний стандарт даних (Follow the Money - FtM)',
      'Понад 100 джерел оновлюються щодня',
      'Висока якість дедуплікації та крос-референсів'
    ],
    disadvantages: [
      'Некомерційна ліцензія у безкоштовній версії',
      'Для SaaS-платформ вимагає дорогої комерційної ліцензії'
    ],
    compatibilityScore: 90,
    description: 'Глобальна база даних осіб під санкціями, політично значущих осіб (PEPs) та кримінальних фігурантів.',
    role: 'Забезпечення комплаєнсу, скринінг контрагентів та побудова початкових санкційних профілів.',
    techStack: 'Python, FollowTheMoney (FtM) schema, CSV / JSON streams',
    securityRating: 'A'
  },
  {
    id: 'bbot',
    name: 'BBOT (Blackbird)',
    category: 'OSINT',
    license: 'GPL-3.0',
    licenseType: 'Strong Copyleft',
    productionReady: 'Tak',
    advantages: [
      'Сучасна асинхронна архітектура',
      'Висока модульність (100+ сканерів)',
      'Нативна інтеграція з Neo4j, Elastic та іншими сховищами'
    ],
    disadvantages: [
      'GPL-3.0 ліцензія потребує суворої архітектурної ізоляції',
      'Потребує написання кастомного API обгортки для JSON серіалізації'
    ],
    compatibilityScore: 88,
    description: 'Модульний та асинхронний OSINT-фреймворк для збору інформації, сканування мереж та аналізу вразливостей.',
    role: 'Сканування цифрового сліду об’єктів, пошук відкритих портів, субдоменів, витоків даних.',
    techStack: 'Python (Asyncio), Redis queue, Neo4j, REST API wrapper',
    securityRating: 'B'
  },
  {
    id: 'spiderfoot',
    name: 'SpiderFoot',
    category: 'OSINT',
    license: 'MIT',
    licenseType: 'Permissive',
    productionReady: 'Tak',
    advantages: [
      'Величезна кількість модулів (200+)',
      'Перевірений часом та стабільний інструмент',
      'Дуже проста MIT ліцензія'
    ],
    disadvantages: [
      'Розвиток Open Source версії уповільнився після поглинання Intel471',
      'Застаріла синхронна архітектура у деяких модулях'
    ],
    compatibilityScore: 84,
    description: 'Автоматизований інструмент OSINT-розвідки, що збирає дані з сотень публічних джерел одночасно.',
    role: 'Первинне збирання IP-адрес, email-адрес, телефонних номерів та доменів.',
    techStack: 'Python, SQLite (локальний кеш), Threading, REST endpoints',
    securityRating: 'B'
  },
  {
    id: 'qdrant',
    name: 'Qdrant',
    category: 'Vector DB',
    license: 'Apache 2.0',
    licenseType: 'Permissive',
    productionReady: 'Tak (High)',
    advantages: [
      'Написаний на Rust, надзвичайно швидкий',
      'Дуже низьке споживання RAM у порівнянні з PGVector або ES',
      'Хмарно-орієнтована архітектура, зручний REST/gRPC API'
    ],
    disadvantages: [
      'Відносно молодий продукт порівняно з Elasticsearch',
      'Вимагає навичок оптимізації індексів HNSW під навантаженням'
    ],
    compatibilityScore: 98,
    description: 'Високопродуктивна векторна база даних для збереження та пошуку векторних представлень (embeddings).',
    role: 'Векторний пошук та семантична фільтрація для AI-пошуку та RAG (Retrieval-Augmented Generation).',
    techStack: 'Rust, gRPC, REST, HNSW indexing',
    securityRating: 'A'
  },
  {
    id: 'neo4j',
    name: 'Neo4j (Community)',
    category: 'Graph DB',
    license: 'GPL-3.0',
    licenseType: 'Strong Copyleft',
    productionReady: 'Tak',
    advantages: [
      'Галузевий золотий стандарт для графів зв’язків',
      'Потужна та виразна мова запитів Cypher',
      'Чудова екосистема візуалізації (Neo4j Bloom, Browser)'
    ],
    disadvantages: [
      'Community версія має жорсткі ліміти на масштабування (1 CPU, обмежений RAM)',
      'Ліцензія GPL-3.0 змушує ізолювати доступ через окремий мережевий рівень'
    ],
    compatibilityScore: 85,
    description: 'Графова база даних, яка оптимізована для швидкого обходу складних взаємозв’язків між сутностями.',
    role: 'Аналіз зв’язків, виявлення афілійованих осіб, бенефіціарів та мереж пов’язаних компаній.',
    techStack: 'Java, Cypher, BOLT protocol, APOC plug-ins',
    securityRating: 'B'
  },
  {
    id: 'opensearch',
    name: 'OpenSearch',
    category: 'Search',
    license: 'Apache 2.0',
    licenseType: 'Permissive',
    productionReady: 'Tak (High)',
    advantages: [
      'Повний форк Elasticsearch без ліцензійних обмежень Elastic',
      'Потужна підтримка з боку AWS та Linux Foundation',
      'Масштабований повнотекстовий пошук, аналітика та агрегація'
    ],
    disadvantages: [
      'Дуже високі вимоги до RAM (JVM-основа)',
      'Складність адміністрування та кластеризації під великими даними'
    ],
    compatibilityScore: 92,
    description: 'Масштабована пошукова та аналітична система з відкритим кодом для текстового та фасетного пошуку.',
    role: 'Повнотекстовий та нечіткий пошук по мільйонах текстових документів, судових реєстрів та витоків.',
    techStack: 'Java (JVM), Lucene core, REST API',
    securityRating: 'A'
  },
  {
    id: 'airbyte',
    name: 'Airbyte',
    category: 'ETL / Конектори',
    license: 'ELv2 / MIT',
    licenseType: 'Source Available',
    productionReady: 'Tak',
    advantages: [
      'Сотні готових конекторів до популярних платформ та БД',
      'Сучасний, дуже зручний інтерфейс користувача',
      'Підтримка dbt для трансформацій під час завантаження'
    ],
    disadvantages: [
      'Перехід на ліцензію ELv2 забороняє перепродавати Airbyte як сервіс',
      'Досить важкий у розгортанні (потребує багато Kubernetes-подів)'
    ],
    compatibilityScore: 80,
    description: 'Платформа інтеграції даних з відкритим кодом для побудови конвеєрів ELT/ETL.',
    role: 'Автоматизований збір даних з API реєстрів та завантаження до сирого сховища (MinIO/Postgres).',
    techStack: 'Java, Python, Docker containers, React frontend',
    securityRating: 'B'
  },
  {
    id: 'vllm',
    name: 'vLLM',
    category: 'AI / LLM Serving',
    license: 'Apache 2.0',
    licenseType: 'Permissive',
    productionReady: 'Tak (High)',
    advantages: [
      'Унікальна технологія PagedAttention знижує використання пам’яті',
      'Максимальна пропускна здатність запитів серед конкурентів',
      'Нативна підтримка популярних моделей (Llama 3, Mistral, Qwen)'
    ],
    disadvantages: [
      'Вимагає виключно професійних GPU-ресурсів (NVIDIA A100/H100/A6000)',
      'Обмежена гнучкість для нестандартних архітектур моделей'
    ],
    compatibilityScore: 95,
    description: 'Надшвидка та проста у використанні бібліотека для запуску та обслуговування великих мовних моделей.',
    role: 'Генерація коротких резюме документів, автоматична класифікація зв’язків та RAG-відповіді.',
    techStack: 'Python, C++, CUDA, PagedAttention engine, FastAPI server',
    securityRating: 'A'
  },
  {
    id: 'faster-whisper',
    name: 'faster-whisper',
    category: 'STT',
    license: 'MIT',
    licenseType: 'Permissive',
    productionReady: 'Tak',
    advantages: [
      'До 4 разів швидше за оригінальний Whisper від OpenAI',
      'Використовує CTranslate2 для глибокої оптимізації ваг',
      'Значно менше споживання VRAM'
    ],
    disadvantages: [
      'Потребує делікатних налаштувань для пакетної обробки аудіофайлів',
      'Для максимальної точності на українській мові потребує Large-V3 моделі'
    ],
    compatibilityScore: 94,
    description: 'Оптимізована реалізація моделі автоматичного розпізнавання мовлення OpenAI Whisper.',
    role: 'Транскрибування аудіозаписів, перехоплень, перехоплених медіа чи телефонних дзвінків.',
    techStack: 'C++, Python, CTranslate2, ONNX Runtime',
    securityRating: 'A'
  },
  {
    id: 'doctr',
    name: 'docTR',
    category: 'OCR',
    license: 'Apache 2.0',
    licenseType: 'Permissive',
    productionReady: 'Tak',
    advantages: [
      'Сучасний глибокий підхід на базі PyTorch / TensorFlow',
      'Ідеально розпізнає складні багатоколонкові макети та PDF',
      'Повністю безкоштовна та ліберальна Apache ліцензія'
    ],
    disadvantages: [
      'Поступається хмарним комерційним рішенням (Google Cloud Vision) на рукописному тексті',
      'Вимагає GPU для швидкої обробки багатосторінкових файлів'
    ],
    compatibilityScore: 89,
    description: 'Бібліотека оптичного розпізнавання символів (OCR) для вилучення структурованого тексту з документів.',
    role: 'Конвертація сканованих копій статутів, паспортів, виписок судів у структурований текст.',
    techStack: 'Python, PyTorch, TensorFlow, OpenCV',
    securityRating: 'A'
  }
];

export const LICENSE_MATRIX: LicenseMatrixItem[] = [
  {
    license: 'MIT / Apache 2.0',
    saasUsage: 'Дозволено без обмежень',
    modification: 'Дозволено без відкриття коду',
    dynamicLinking: 'Дозволено',
    riskLevel: 'Низький',
    solution: 'Інтегрувати безпосередньо в ядро системи (FastAPI, React). Немає жодних юридичних застережень.',
    details: 'Найбільш дружні ліцензії для бізнесу. Дають повну свободу дій.'
  },
  {
    license: 'GPL v3 (Neo4j, BBOT)',
    saasUsage: 'Дозволено (зазвичай, без хостингу коду)',
    modification: 'Вимагає відкриття коду модифікованої версії',
    dynamicLinking: 'Вимагає відкриття вашого коду під тією ж ліцензією',
    riskLevel: 'Середній',
    solution: 'Суворо ізолювати компонент як окремий мікросервіс у Docker-контейнері. Комунікувати виключно через REST API / gRPC або черги повідомлень (Kafka). Уникати імпортування чи лінкування бібліотеки у закрите ядро PREDATOR.',
    details: 'Класичний "копілефт". Пряме використання (імпорт у Python) заразить ліцензією все ядро.'
  },
  {
    license: 'AGPL v3',
    saasUsage: 'Критично обмежено (навіть мережевий доступ вимагає відкриття коду)',
    modification: 'Вимагає відкриття коду всієї системи',
    dynamicLinking: 'Вимагає відкриття всього коду платформи',
    riskLevel: 'Високий',
    solution: 'Уникати використання AGPL рішень у комерційному SaaS. Якщо заміна неможлива (наприклад, локальний Grafana/Plinth), запускати його в повністю ізольованій мережі, без модифікації та без лінкування API. Виносити в окремі поди Kubernetes.',
    details: 'Найбільш агресивний копілефт, створений спеціально для закриття "SaaS-шпарини" у GPL.'
  },
  {
    license: 'ELv2 / SSPL (Airbyte, Elastic)',
    saasUsage: 'Обмежено (заборонено надавати як конкурентну послугу)',
    modification: 'Дозволено',
    dynamicLinking: 'Дозволено',
    riskLevel: 'Середній',
    solution: 'Використовувати Airbyte чи Elasticsearch як внутрішню інфраструктурну утиліту для потреб PREDATOR. Заборонено продавати "Airbyte API як послугу" чи створювати прямий SaaS-аналог. Тільки для внутрішніх пайплайнів.',
    details: 'Ліцензії, створені для захисту вендорів від зловживання з боку хмарних гігантів (AWS).'
  },
  {
    license: 'Комерційна (OpenSanctions)',
    saasUsage: 'Потребує платної комерційної угоди',
    modification: 'Залежить від умов SLA',
    dynamicLinking: 'Залежить від умов SLA',
    riskLevel: 'Фінансовий',
    solution: 'Використовувати безкоштовні завантаження даних (для некомерційних тестів) або обмежені демки на стадії MVP. Закласти бюджет на комерційну підписку (Data License) перед запуском у комерційну експлуатацію (Production).',
    details: 'Чудові дані, але вимагають ліцензування при генерації прибутку від їх використання.'
  }
];

export const ARCHITECTURE_NODES: ArchitectureNode[] = [
  {
    id: 'client',
    label: 'Web Client',
    group: 'Client',
    description: 'Користувацький інтерфейс на React/Vite з використанням Tailwind CSS та Motion для плавної анімації.',
    details: 'Клієнтський додаток для аналітиків, що надає інтерактивну роботу з графами зв’язків, дашбордами, RAG пошуком та інтерфейсом збору даних.',
    tech: 'React 19, Lucide, Tailwind, Motion, D3.js (для візуалізації графів)',
    security: 'HTTPS, JWT токени, валідація кукі, CSP політики',
    scaling: 'Статичний хостинг (Nginx/CDN), практично необмежене клієнтське масштабування'
  },
  {
    id: 'gateway',
    label: 'API Gateway / Ingress NGINX',
    group: 'Gateway',
    description: 'Єдина точка входу в кластер Kubernetes, що керує маршрутизацією, SSL сертифікатами та лімітами запитів.',
    details: 'Оркеструє вхідний трафік, направляє запити на Core API або статику. Здійснює SSL Offloading та Rate Limiting.',
    tech: 'Ingress-NGINX, Kubernetes, Cert-Manager (Let\'s Encrypt)',
    security: 'Rate Limiting, IP Whitelisting, SSL/TLS 1.3, захист від DDoS',
    scaling: 'Горизонтальне масштабування подів Ingress (HPA за навантаженням CPU)'
  },
  {
    id: 'core_api',
    label: 'PREDATOR Core API',
    group: 'Core',
    description: 'Центральний мікросервіс на FastAPI, що містить основну бізнес-логіку, автентифікацію та API для клієнта.',
    details: 'Обробляє запити аналітиків, координує роботу баз даних, ставить завдання у чергу Kafka, управляє RAG-запитами.',
    tech: 'Python 3.12, FastAPI, SQLAlchemy, Pydantic',
    security: 'JWT валідація, RBAC (Role-Based Access Control), шифрування трафіку до БД',
    scaling: 'Kubernetes HPA (масштабування подів на основі CPU/RAM), безстанова (stateless) архітектура'
  },
  {
    id: 'pg',
    label: 'PostgreSQL',
    group: 'Database',
    description: 'Реляційне сховище для користувачів, логів аудиту, метаданих сутностей та стану системи.',
    details: 'Основна транзакційна база даних. Містить метаінформацію про завантажені файли, налаштування та сесії користувачів.',
    tech: 'PostgreSQL 16, Connection Pooling (PgBouncer)',
    security: 'Шифрування даних на диску (TDE), доступ лише всередині VPC, SSL-з’єднання',
    scaling: 'Реплікація Master-Slave, Read-replicas для аналітичних звітів'
  },
  {
    id: 'graph_db',
    label: 'Neo4j (Graph Database)',
    group: 'Database',
    description: 'Графове сховище сутностей та зв’язків між ними (люди, компанії, адреси, телефони, транзакції).',
    details: 'Використовується для глибокого аналізу зв’язків та виявлення прихованих схем (Link Analysis).',
    tech: 'Neo4j Community/Enterprise, Cypher, Bolt protocol',
    security: 'RBAC (в Enterprise), доступ обмежений внутрішньою мережею Kubernetes',
    scaling: 'Обмежено в Community (1 інстанс), Enterprise підтримує каузальні кластери'
  },
  {
    id: 'vector_db',
    label: 'Qdrant (Vector Database)',
    group: 'Database',
    description: 'База даних для збереження векторів (embeddings), що використовуються для інтелектуального RAG-пошуку.',
    details: 'Швидко шукає схожі документи, порівнює сутності за контекстом та зберігає індекси HNSW.',
    tech: 'Qdrant (Rust), gRPC client',
    security: 'Автентифікація за API-токенами, TLS для внутрішніх з’єднань',
    scaling: 'Вбудоване шардування та кластеризація (Raft консенсус)'
  },
  {
    id: 'search_db',
    label: 'OpenSearch',
    group: 'Database',
    description: 'Повнотекстова пошукова база даних для миттєвого пошуку по неструктурованих текстах.',
    details: 'Індексує судові рішення, новини, транскрипції аудіо та вилучені OCR тексти документів.',
    tech: 'OpenSearch (Apache 2.0), Elasticsearch compatible clients',
    security: 'Вбудована рольова безпека, інтеграція з Keycloak / LDAP',
    scaling: 'Багатонодовий кластер (Primary/Replica shards)'
  },
  {
    id: 'minio',
    label: 'MinIO (S3 Storage)',
    group: 'Database',
    description: 'S3-сумісне об’єктне сховище для сирих завантажених документів, аудіо та бекапів.',
    details: 'Надійно зберігає гігабайти PDF-файлів, аудіозаписів для транскрипції та фотографій.',
    tech: 'MinIO, S3 API',
    security: 'Шифрування SSE-S3/SSE-C, приватні бакети, тимчасові Presigned URLs',
    scaling: 'Розподілений режим (Distributed MinIO), горизонтальне розширення дисками'
  },
  {
    id: 'kafka',
    label: 'Kafka / Redpanda Bus',
    group: 'Event',
    description: 'Центральна шина подій для асинхронної координації мікросервісів та воркерів.',
    details: 'Приймає події про нові завдання пошуку, завантаження документів, завершення OCR та передає воркерам.',
    tech: 'Apache Kafka / Redpanda (C++ lightweight alternative)',
    security: 'SASL/SCRAM автентифікація, шифрування трафіку TLS',
    scaling: 'Масштабування через топіки з багатьма партиціями'
  },
  {
    id: 'osint_worker',
    label: 'OSINT Worker',
    group: 'Worker',
    description: 'Асинхронний Python мікросервіс, який запускає BBOT, SpiderFoot та Tor Proxies.',
    details: 'Реагує на чергу Kafka, збирає дані, парсить результати у структурований JSON та відправляє назад до Kafka.',
    tech: 'Python Asyncio, BBOT Wrapper, SpiderFoot modules, Tor proxy rotation',
    security: 'Ізольований Docker контейнер, non-root user, обмежений вихідний трафік',
    scaling: 'KEDA (Kubernetes Event-driven Autoscaling) за довжиною черги Kafka'
  },
  {
    id: 'ai_worker',
    label: 'AI Pipelines Worker',
    group: 'Worker',
    description: 'Воркер для виконання RAG, генерації ембедінгів та вилучення сутностей (NER).',
    details: 'Комунікує з vLLM, docTR та іншими ML сервісами для обробки документів та структурування даних.',
    tech: 'Python, PyTorch, LangChain / LlamaIndex',
    security: 'Обмежений доступ до внутрішніх ML ендпоінтів',
    scaling: 'KEDA масштабування подів, бажано на нодах з GPU'
  },
  {
    id: 'etl_worker',
    label: 'ETL Worker (Airbyte)',
    group: 'Worker',
    description: 'Менеджер завантаження даних із зовнішніх офіційних реєстрів та API.',
    details: 'Виконує регулярну синхронізацію з відкритими реєстрами (ЄДР, судові рішення) та зберігає дані в базу.',
    tech: 'Airbyte connectors, Custom Python SDK adapters for Gov API',
    security: 'Безпечне збереження API-ключів у HashiCorp Vault',
    scaling: 'Окремі події за розкладом (CronJobs у Kubernetes)'
  },
  {
    id: 'vllm',
    label: 'vLLM Serving',
    group: 'AI',
    description: 'Сервіс хостингу локальних великих мовних моделей (Llama-3, Mistral) на GPU нодах.',
    details: 'Обробляє RAG запити та структурує неструктуровані тексти за запитом AI воркера.',
    tech: 'vLLM, CUDA, Nvidia drivers, Llama 3 / Mistral-7B',
    security: 'Доступний виключно зсередини кластера Kubernetes (no public IP)',
    scaling: 'Тензорний паралелізм (Tensor Parallelism) на кількох GPU нодах'
  },
  {
    id: 'whisper',
    label: 'faster-whisper',
    group: 'AI',
    description: 'Сервіс перекладу аудіозаписів та дзвінків у текст (STT).',
    details: 'Обробляє аудіофайли з MinIO та повертає текстові транскрипції з таймкодами.',
    tech: 'CTranslate2, ONNX Runtime, Whisper Large V3',
    security: 'Повна ізоляція, робота offline (без запитів до OpenAI API)',
    scaling: 'Масштабування подів на CPU або GPU нодах'
  },
  {
    id: 'doctr',
    label: 'docTR OCR',
    group: 'AI',
    description: 'Сервіс вилучення тексту з відсканованих документів та зображень.',
    details: 'Аналізує зображення, розпізнає символи (OCR) та визначає структуру сторінок.',
    tech: 'docTR (TensorFlow/PyTorch), OpenCV',
    security: 'Внутрішній мікросервіс, файли передаються у бінарному форматі через gRPC',
    scaling: 'Реплікація за запитами за допомогою Kubernetes HPA'
  }
];

export const ARCHITECTURE_EDGES: ArchitectureEdge[] = [
  { from: 'client', to: 'gateway', label: 'HTTPS (REST/WebSockets)', type: 'sync' },
  { from: 'gateway', to: 'core_api', label: 'HTTP Proxy', type: 'sync' },
  
  // Core API connections
  { from: 'core_api', to: 'pg', label: 'SQL (Meta)', type: 'sync' },
  { from: 'core_api', to: 'graph_db', label: 'Cypher / Bolt', type: 'sync' },
  { from: 'core_api', to: 'vector_db', label: 'gRPC / HTTP', type: 'sync' },
  { from: 'core_api', to: 'search_db', label: 'REST (Text Search)', type: 'sync' },
  { from: 'core_api', to: 'minio', label: 'S3 Client', type: 'sync' },
  { from: 'core_api', to: 'kafka', label: 'Produce Event', type: 'async' },
  
  // Kafka to workers
  { from: 'kafka', to: 'osint_worker', label: 'Consume Search Job', type: 'async' },
  { from: 'kafka', to: 'ai_worker', label: 'Consume Document Job', type: 'async' },
  { from: 'kafka', to: 'etl_worker', label: 'Consume Sync Job', type: 'async' },
  
  // Workers to services/DBs
  { from: 'osint_worker', to: 'kafka', label: 'Produce Results', type: 'async' },
  { from: 'osint_worker', to: 'graph_db', label: 'Write entities', type: 'sync' },
  
  { from: 'ai_worker', to: 'vllm', label: 'gRPC (LLM inference)', type: 'sync' },
  { from: 'ai_worker', to: 'whisper', label: 'gRPC (STT request)', type: 'sync' },
  { from: 'ai_worker', to: 'doctr', label: 'gRPC (OCR request)', type: 'sync' },
  { from: 'ai_worker', to: 'vector_db', label: 'Upsert Vectors', type: 'sync' },
  { from: 'ai_worker', to: 'search_db', label: 'Index Text', type: 'sync' },
  
  { from: 'etl_worker', to: 'pg', label: 'Bulk Insert', type: 'sync' },
  { from: 'etl_worker', to: 'minio', label: 'Upload Files', type: 'sync' }
];

export const GAP_ITEMS: GapItem[] = [
  {
    id: 'no_changes',
    title: 'Інтегрувати без змін (Ready-to-use)',
    category: 'direct',
    categoryLabel: 'Інтеграція без змін',
    description: 'Компоненти, які мають зрілі, офіційні та перевірені часом Helm-чарти (наприклад, від Bitnami), і не потребують кастомізації коду для роботи.',
    actionItems: [
      'Qdrant (Vector DB) — розгортання офіційного Helm-чарту з увімкненим Raft-кластером',
      'OpenSearch — розгортання 3-нодового пошукового кластера',
      'PostgreSQL — реплікований кластер за допомогою CloudNativePG або Bitnami Postgres-HA',
      'MinIO — об’єктне сховище в розподіленому (distributed) режимі з шифруванням дисків',
      'Kafka / Redpanda — швидка шина даних на базі готових K8s маніфестів',
      'vLLM, faster-whisper — запуск у Docker на GPU-нодах як ізольованих сервісів з REST/gRPC API'
    ],
    difficulty: 'Легка',
    timeEstimate: '2-3 дні на сервіс'
  },
  {
    id: 'with_adaptation',
    title: 'Інтегрувати після адаптації (Wrappers Required)',
    category: 'adapt',
    categoryLabel: 'Адаптація та обгортки',
    description: 'Потужні OSINT інструменти, які з коробки призначені для консольного використання або локального UI. Їх потрібно інтегрувати в загальну мікросервісну шину.',
    actionItems: [
      'BBOT (Blackbird) — написання кастомної Python обгортки (wrapper) для перетворення консольного виводу в структуровані JSON повідомлення та відправки в Kafka.',
      'SpiderFoot — адаптація API для віддаленого запуску модулів за запитом та автоматичного експорту результатів.',
      'Airbyte — глибока кастомізація конекторів та інтеграція dbt-трансформацій усередині Kubernetes подів.'
    ],
    difficulty: 'Середня',
    timeEstimate: '2-3 тижні'
  },
  {
    id: 'replace_alt',
    title: 'Замінити альтернативою (Optimizations)',
    category: 'replace',
    categoryLabel: 'Заміна на кращі альтернативи',
    description: 'Оптимізація архітектури шляхом відмови від ліцензійно небезпечних або застарілих рішень на користь більш сучасних.',
    actionItems: [
      'Elasticsearch → замінити на OpenSearch (уникнення ліцензійних ризиків SSPL та обмежень комерціалізації SaaS).',
      'Tesseract OCR → замінити на docTR або PaddleOCR (значно якісніше розпізнавання складних PDF-файлів, судових рішень та сканів документів на базі ШІ).',
      'Оригінальний OpenAI Whisper → замінити на faster-whisper (оптимізований на C++ рушій, що в 4 рази швидший та значно економить дорогу VRAM відеокарт).'
    ],
    difficulty: 'Середня',
    timeEstimate: '1-2 тижні на заміну'
  },
  {
    id: 'not_recommended',
    title: 'Не рекомендується використовувати',
    category: 'not_recommended',
    categoryLabel: 'Не рекомендується',
    description: 'Категорії рішень, які часто зустрічаються у аматорських OSINT-скриптах, але категорично не підходять для промислової Enterprise платформи.',
    actionItems: [
      'Сирі GitHub-скрипти без підтримки — швидкі парсери соцмереж з GitHub, які ламаються при першій зміні API чи верстки сайту.',
      'Прямий скрапінг без проксі — запуск запитів без ротації IP, що призведе до миттєвого бану серверами-джерелами.',
      'Локальне збереження файлів на дисках воркерів — використання локального дискового простору замість MinIO/S3 створює точки відмови (SPOF).'
    ],
    difficulty: 'Критична',
    timeEstimate: 'Не підлягає оцінці (створює технічний борг)'
  },
  {
    id: 'in_house_dev',
    title: 'Власна експертиза (Develop from scratch)',
    category: 'in_house',
    categoryLabel: 'Власна розробка з нуля',
    description: 'Ядро унікальності платформи PREDATOR. Компоненти, для яких не існує готових open-source рішень на ринку, і які формують інтелектуальну власність компанії.',
    actionItems: [
      'Конектори до Українських реєстрів — стабільні асинхронні адаптери для роботи з державними API та реєстрами (Дія, ЄДР, судові рішення Prozorro, Data.gov.ua) з обходом обмежень та кешуванням.',
      'Entity Resolution Engine (Алгоритм злиття сутностей) — інтелектуальна логіка дедуплікації (наприклад, об’єднання записів "Іванов І.І." з судового реєстру та санкційного списку за допомогою ШІ-ембедінгів та онтологічного порівняння).',
      'Єдина онтологія даних (Data Mapping) — мапінг різношерстих даних із 50+ джерел у єдину нормалізовану схему графу для Neo4j та Qdrant.'
    ],
    difficulty: 'Висока',
    timeEstimate: '2-4 місяці активної розробки'
  }
];

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'phase1',
    title: 'Phase 1: MVP',
    timeframe: 'Місяці 1-3',
    focus: 'Базовий пайплайн, ручний OSINT та санкційний комплаєнс.',
    components: [
      'FastAPI Core Core API',
      'PostgreSQL (користувачі та метадані)',
      'OpenSearch (первинний пошук текстів)',
      'Інтеграція 5-10 базових модулів OSINT (Email, Phone, IP)',
      'Базовий інтерфейс на React',
      'Підключення OpenSanctions через API'
    ],
    risks: [
      'Затримки в узгодженні та розробці єдиної онтології даних (FtM)',
      'Обмеження безкоштовного API санкційних списків'
    ],
    milestones: [
      { text: 'Розгорнуто базовий каркас FastAPI та React UI', done: true },
      { text: 'Налаштовано базу PostgreSQL та індекс OpenSearch', done: true },
      { text: 'Реалізовано модуль збору даних по IP та телефонах', done: false },
      { text: 'Підключено імпорт санкційних списків OpenSanctions', done: false }
    ],
    gpuRequirements: 'Не потребує (може працювати на стандартних CPU інстансах)'
  },
  {
    id: 'phase2',
    title: 'Phase 2: Alpha / Data Enrichment',
    timeframe: 'Місяці 4-6',
    focus: 'Автоматизація збору даних, зв’язки та державні реєстри.',
    components: [
      'Kafka / Redpanda (шина повідомлень)',
      'Celery / Redis воркери',
      'Neo4j (візуалізація графів зв’язків)',
      'Розробка конекторів для державних API (Data.gov.ua, Prozorro)',
      'Створення модулів збору даних із судових рішень'
    ],
    risks: [
      'Високе навантаження на Neo4j при інтенсивному запису великої кількості зв’язків',
      'Часті блокування та зміни в українських державних реєстрах'
    ],
    milestones: [
      { text: 'Розгорнуто шину подій Kafka/Redpanda', done: false },
      { text: 'Інтегровано Neo4j графову базу та написані перші Cypher запити', done: false },
      { text: 'Розроблено стабільні конектори до ЄДР та Prozorro', done: false },
      { text: 'Створено інтерактивний UI для перегляду графів зв’язків', done: false }
    ],
    gpuRequirements: 'Мінімальні CPU ноди. Для Neo4j бажано RAM-оптимізовані ноди.'
  },
  {
    id: 'phase3',
    title: 'Phase 3: Beta / AI Integration',
    timeframe: 'Місяці 7-9',
    focus: 'Штучний інтелект, розпізнавання медіа та семантичний пошук.',
    components: [
      'vLLM (локальний хостинг Llama 3 / Mistral-7B)',
      'Qdrant (векторний пошук для RAG)',
      'docTR (вилучення тексту з фото статутів, паспортів)',
      'faster-whisper (транскрибування перехоплень, аудіо та дзвінків)',
      'Модуль RAG для інтелектуального пошуку по судових ухвалах'
    ],
    risks: [
      'Критична нестача GPU-ресурсів під час паралельної обробки великої кількості документів',
      'Складність тонкого налаштування моделей під українську мову'
    ],
    milestones: [
      { text: 'Розгорнуто кластер Qdrant та згенеровано перші ембедінги', done: false },
      { text: 'Запущено vLLM з моделлю Llama-3-8B-Instruct на GPU', done: false },
      { text: 'Інтегровано faster-whisper та docTR у конвеєри обробки медіа', done: false },
      { text: 'Створено AI-асистента для автоматичного аналізу судових справ', done: false }
    ],
    gpuRequirements: 'Обов’язково! Кластер з мінімум 2x Nvidia A100 (80GB) або 4x RTX 4090 / A6000.'
  },
  {
    id: 'phase4',
    title: 'Phase 4: Production-Ready',
    timeframe: 'Місяці 10-12',
    focus: 'Масштабування, промислова безпека та комерційний SaaS запуск.',
    components: [
      'Повний GitOps пайплайн (ArgoCD + Helm)',
      'Istio Service Mesh (шифрування трафіку mTLS)',
      'HashiCorp Vault для секретів та API-ключів',
      'Keycloak (автентифікація користувачів, OAuth2, SAML)',
      'Trivy (сканування образів на вразливості у CI/CD)'
    ],
    risks: [
      'Складність конфігурації Istio mTLS у розподіленому кластері',
      'Фінансові витрати на комерційну ліцензію OpenSanctions при SaaS-запуску'
    ],
    milestones: [
      { text: 'Побудовано повністю автоматизований GitOps репозиторій', done: false },
      { text: 'Впроваджено централізовану автентифікацію Keycloak та RBAC', done: false },
      { text: 'Налаштовано Istio mTLS та заблоковано незахищений внутрішній трафік', done: false },
      { text: 'Пройдено перший зовнішній аудит безпеки (Penetration Test)', done: false }
    ],
    gpuRequirements: 'Стабільні GPU для AI сервісів та високопродуктивні CPU ноди для баз даних.'
  },
  {
    id: 'phase5',
    title: 'Phase 5: Enterprise / Gov Edition',
    timeframe: 'Рік 2 і далі',
    focus: 'On-premise розгортання в закритих контурах (Air-gapped) та держ. сертифікація.',
    components: [
      'K3s / Rancher дистрибутив для локальних серверів',
      'Локальні оновлювані дзеркала державних реєстрів',
      'Сертифікація за вимогами КСЗІ (ДССЗЗІ України)',
      'Повна робота без доступу до мережі Інтернет (Air-gapped mode)'
    ],
    risks: [
      'Тривалий та бюрократизований процес сертифікації за стандартами ДССЗЗІ',
      'Складність оновлення баз даних у повністю ізольованих державних військових мережах'
    ],
    milestones: [
      { text: 'Створено офлайн Helm-пакет для розгортання PREDATOR в один клік', done: false },
      { text: 'Реалізовано механізм диференційних офлайн-оновлень реєстрів', done: false },
      { text: 'Підготовлено комплект документів для сертифікації КСЗІ', done: false },
      { text: 'Успішно впроваджено першу інсталяцію у закритому військовому контурі', done: false }
    ],
    gpuRequirements: 'Локальні GPU-сервери (наприклад, Nvidia DGX або локальні GPU ноди у клієнта).'
  }
];

export const COMPATIBILITY_SCORES = [
  { name: 'Qdrant (Vector DB)', score: 98, categories: { func: 10, sec: 10, lic: 10, stack: 10, support: 9 } },
  { name: 'FastAPI (Backend Core)', score: 98, categories: { func: 10, sec: 10, lic: 10, stack: 10, support: 9 } },
  { name: 'faster-whisper (STT)', score: 94, categories: { func: 10, sec: 9, lic: 10, stack: 9, support: 9 } },
  { name: 'OpenSearch (Search)', score: 92, categories: { func: 10, sec: 9, lic: 10, stack: 9, support: 7 } },
  { name: 'docTR (OCR)', score: 89, categories: { func: 9, sec: 9, lic: 10, stack: 9, support: 7 } },
  { name: 'BBOT (OSINT Engine)', score: 88, categories: { func: 10, sec: 8, lic: 7, stack: 9, support: 9 } },
  { name: 'Neo4j Community (Graph)', score: 85, categories: { func: 10, sec: 8, lic: 6, stack: 9, support: 8 } },
  { name: 'Airbyte (ETL)', score: 80, categories: { func: 9, sec: 8, lic: 6, stack: 8, support: 9 } }
];
