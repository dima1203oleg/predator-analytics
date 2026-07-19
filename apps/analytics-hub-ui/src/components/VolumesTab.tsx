/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Code, Cpu, FileText, Database, Shield, Zap, 
  Terminal, CheckCircle, Copy, Check, ChevronRight, ChevronDown, 
  ExternalLink, Layers, Info, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chapter {
  title: string;
  description: string;
  technicalDetails?: string;
  codeSnippet?: {
    lang: string;
    code: string;
  };
  requirements?: string[];
}

interface Volume {
  id: number;
  title: string;
  subtitle: string;
  icon: any;
  category: 'Strategic' | 'Architecture' | 'Data' | 'Intelligence' | 'Operations' | 'Security';
  chapters: Chapter[];
}

const VOLUMES_DATA: Volume[] = [
  {
    id: 1,
    title: "Том 1. Vision (Бачення)",
    subtitle: "Концепція, бізнес-модель, архітектурні принципи та сценарії",
    icon: BookOpen,
    category: "Strategic",
    chapters: [
      {
        title: "1.1 Концепція та мета системи PREDATOR Analytics",
        description: "PREDATOR Analytics розробляється як суверенна платформа стратегічної розвідки та аналізу зв'язків (Link Analysis) класу Enterprise, покликана забезпечувати повномасштабний OSINT, аналіз транзакцій, виявлення бенефіціарів та інтелектуальну дедуплікацію даних.",
        requirements: ["REQ-VIS-001: Забезпечення Link Analysis корпоративних зв'язків", "REQ-VIS-002: Підтримка локальної роботи (Air-gapped mode)"]
      },
      {
        title: "1.2 Ролі користувачів та сценарії використання (Use Cases)",
        description: "Детальний розподіл за типами аналітиків: OSINT-розслідувач, аналітик AML/CFT, державний аудитор, Red Team офіцер кібербезпеки.",
        requirements: ["REQ-VIS-003: Модель доступу на основі атрибутів (ABAC)", "REQ-VIS-004: Логування дій користувача без можливості перезапису (Audit trail)"]
      },
      {
        title: "1.3 Архітектурні принципи та обмеження",
        description: "Орієнтація на мікросервісну ізоляцію, ліцензійну чистоту (уникнення GPL-зараження пропрієтарного коду за допомогою API-ізоляції), та хмароорієнтованість (Kubernetes, GitOps).",
        technicalDetails: "Ізоляція GPL-компонентів, таких як BBOT чи деякі утиліти Neo4j, досягається через гнучку API-маршрутизацію.",
        codeSnippet: {
          lang: "json",
          code: `{
  "architecture_style": "Event-Driven Microservices",
  "isolation_pattern": "Network-bound API (anti-GPL contamination)",
  "compliance_target": "ISO/IEC 27001 & GDPR-compliant OSINT"
}`
        }
      }
    ]
  },
  {
    id: 2,
    title: "Том 2. Архітектура (C4 Model)",
    subtitle: "Структурні діаграми контексту, контейнерів та деплою",
    icon: Layers,
    category: "Architecture",
    chapters: [
      {
        title: "2.1 C4 Model: Контекст та Контейнери (Level 1 & 2)",
        description: "Опис взаємодії PREDATOR із зовнішніми реєстрами, Telegram-ботами та клієнтськими веб-браузерами через API Gateway. Розподіл на UI клієнт та групу сервісів (Core API, OSINT Engine, Graph Database, Search Index).",
        technicalDetails: "Архітектура використовує API Gateway на базі Envoy/Kong для балансування та автентифікації.",
        codeSnippet: {
          lang: "yaml",
          code: `# Контейнерний огляд мікросервісів у K8s
apiVersion: apps/v1
kind: Deployment
metadata:
  name: predator-gateway
  namespace: predator-core
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: envoy-gateway
        image: envoyproxy/envoy:v1.28.0
        ports:
        - containerPort: 8080
`
        }
      },
      {
        title: "2.2 Організація K8s кластера та GitOps (ArgoCD)",
        description: "Керування конфігурацією середовища за допомогою декларативних маніфестів у Git. Автоматична синхронізація через ArgoCD.",
        requirements: ["REQ-ARC-001: Автоматичний Canary деплой за допомогою Argo Rollouts", "REQ-ARC-002: Стовідсоткова інфраструктура як код (IaC)"]
      }
    ]
  },
  {
    id: 3,
    title: "Том 3. Backend Services",
    subtitle: "Специфікація мікросервісів, черг RabbitMQ та Celery",
    icon: Terminal,
    category: "Architecture",
    chapters: [
      {
        title: "3.1 Identity & Auth Service (Keycloak API)",
        description: "Сервіс автентифікації на базі Keycloak з підтримкою MFA, OAuth2 та OpenID Connect. Генерація JWT-токенів з кастомними claims.",
        requirements: ["REQ-SRV-001: Інтеграція з Active Directory / LDAP", "REQ-SRV-002: Період дії сесії JWT не більше 15 хвилин"]
      },
      {
        title: "3.2 OSINT Worker Service & ETL Pipeline",
        description: "Воркери на Celery/FastAPI, що асинхронно збирають дані з реєстрів, проходять капчі за допомогою анти-капча проксі та відправляють сирі дані в S3 (MinIO).",
        technicalDetails: "Воркери підписуються на RabbitMQ топіки відповідно до регіону та типу джерела.",
        codeSnippet: {
          lang: "python",
          code: `# Асинхронний воркер збору даних ЄДР
from celery import Celery
import httpx

app = Celery('osint_workers', broker='amqp://guest@rabbitmq:5672//')

@app.task(name="tasks.fetch_edr_data", max_retries=3)
def fetch_edr_data(company_id: str):
    # Звернення до проксі-ротатора
    proxy = "http://ua-residential-proxy.net:10000"
    with httpx.Client(proxies={"http://": proxy}) as client:
        r = client.get(f"https://registry-api/company/{company_id}")
        return r.json()
`
        }
      },
      {
        title: "3.3 Entity Resolution Engine (Злиття дублікатів)",
        description: "Сервіс дедуплікації. Обчислює відстань Левенштейна та семантичну подібність (векторні ембедінги в Qdrant) для знаходження ідентичних осіб.",
        requirements: ["REQ-SRV-003: Точність розпізнавання дублікатів персон не менше 95%", "REQ-SRV-004: Створення зв'язку SAME_AS в графовій базі Neo4j"]
      }
    ]
  },
  {
    id: 4,
    title: "Том 4. Бази даних (Data Tier)",
    subtitle: "PostgreSQL, Neo4j, Qdrant, OpenSearch, Redis та MinIO",
    icon: Database,
    category: "Data",
    chapters: [
      {
        title: "4.1 Реляційна СУБД: PostgreSQL Enterprise Schema",
        description: "Головне сховище транзакційних даних, метаданих користувачів, черг та звітів. Партиціонування за датою та типом подій.",
        technicalDetails: "Схема таблиць з тригерами аудиту змін та оптимізованими GIN/GiST індексами.",
        codeSnippet: {
          lang: "sql",
          code: `-- Схема таблиці компаній з партиціонуванням та індексами
CREATE TABLE target_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_edrpou VARCHAR(12) UNIQUE NOT NULL,
    name_ukr TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    registered_at DATE,
    metadata JSONB
);

CREATE INDEX idx_companies_edrpou ON target_companies(code_edrpou);
CREATE INDEX idx_companies_metadata_gin ON target_companies USING gin(metadata);
`
        }
      },
      {
        title: "4.2 Графове сховище: Neo4j Cypher & Schema",
        description: "Побудова мережі зв'язків між персонами, компаніями, офшорами, судовими справами та транзакціями.",
        technicalDetails: "Опис типів ребер: BENEFICIARY_OF, FOUNDER_OF, PERSON_CONNECTED_TO.",
        codeSnippet: {
          lang: "cypher",
          code: `// Пошук кінцевих бенефіціарів через ланцюжок компаній (до 4 рівнів)
MATCH path = (p:Person)-[:BENEFICIARY_OF|FOUNDER_OF*1..4]->(c:Company {code_edrpou: '12345678'})
RETURN path, p.fullname as BeneficiaryName;
`
        }
      },
      {
        title: "4.3 Векторне сховище Qdrant & Ембедінги",
        description: "База даних для швидкого семантичного пошуку по неструктурованих судових рішеннях та описах медіа-статей.",
        requirements: ["REQ-DAT-001: Зберігання 1536-вимірних векторів BGE-M3 / OpenAI", "REQ-DAT-002: Швидкість пошуку найближчих сусідів (k-NN) < 50мс"]
      }
    ]
  },
  {
    id: 5,
    title: "Том 5. OSINT Джерела",
    subtitle: "API-інтеграції держреєстрів, Prozorro, Telegram та DarkNet",
    icon: Zap,
    category: "Data",
    chapters: [
      {
        title: "5.1 Інтеграція державних реєстрів України (ЄДР, Судовий, Prozorro)",
        description: "Детальний опис API-конекторів до Clarity Project, Opendatabot, YouControl, а також парсингу офіційних JSON-дампів з Data.gov.ua.",
        requirements: ["REQ-OSN-001: Інтеграція судових рішень через Єдиний реєстр судових рішень", "REQ-OSN-002: Парсинг засновників з ЄДР у реальному часі"]
      },
      {
        title: "5.2 Соціальні мережі та Telegram-моніторинг",
        description: "Скрейпінг публічних каналів, груп обговорень у Telegram, аналіз постів у Facebook/LinkedIn за ключовими словами.",
        technicalDetails: "Парсер використовує клієнт Telethon на Python з ротацією сесійних файлів через MinIO.",
        codeSnippet: {
          lang: "python",
          code: `# Приклад підключення до Telegram API
from telethon import TelegramClient

async def monitor_channels(api_id, api_hash, channel_username):
    async with TelegramClient('predator_session', api_id, api_hash) as client:
        async for message in client.iter_messages(channel_username, limit=100):
            if "санкції" in message.text.lower():
                print(f"Знайдено згадку: {message.text}")
`
        }
      }
    ]
  },
  {
    id: 6,
    title: "Том 6. AI Агенти",
    subtitle: "Робочі процеси, промпти, MCP та автономне дослідження",
    icon: Cpu,
    category: "Intelligence",
    chapters: [
      {
        title: "6.1 Промпт-інженерія та Агенти (Research, AML, Red Team)",
        description: "Кожен агент функціонує в ізольованому контексті з доступом до інструментів пошуку (Neo4j, PostgreSQL).",
        technicalDetails: "Робочий промпт та системний опис системного арбітра (Supervisor Agent).",
        codeSnippet: {
          lang: "python",
          code: `# Конфігурація Агента розслідувань санкцій
SYSTEM_PROMPT = """
You are PREDATOR AML-Sanction Agent.
Your task is to analyze company networks and identify hidden PEP ownership (>25% share).
Use neo4j_query tool to find connected entities.
Report ownership structures in Markdown format.
"""
`
        }
      },
      {
        title: "6.2 Model Context Protocol (MCP) та vLLM сервіси",
        description: "Використання протоколу MCP для стандартизації взаємодії між ШІ-моделями та інструментами бази даних у Air-gapped режимі.",
        requirements: ["REQ-AI-001: Локальне виконання моделей через vLLM (Llama-3-8B-Instruct)", "REQ-AI-002: Підтримка PagedAttention для оптимізації GPU пам'яті"]
      }
    ]
  },
  {
    id: 7,
    title: "Том 7. UI/UX Специфікація",
    subtitle: "Опис HUD, аналітичних карт, візуальних графів та hotkeys",
    icon: FileText,
    category: "Strategic",
    chapters: [
      {
        title: "7.1 Консоль аналітика: HUD, вікна та HUD-анімація",
        description: "Максимально лаконічний інтерфейс у темно-сірому стилі (Slate/Zinc) з контрастними акцентами (Indigo/Emerald). Стовідсоткова адаптивність.",
        requirements: ["REQ-UI-001: Час відгуку інтерфейсу на перемикання вкладок < 100мс", "REQ-UI-002: Підтримка гарячих клавіш для швидкої навігації"]
      },
      {
        title: "7.2 Графова панель аналізу зв'язків",
        description: "Візуалізація графових вершин та ребер з можливістю динамічного розгортання сусідніх зв'язків (Force-directed graph за допомогою d3.js).",
        technicalDetails: "Рендеринг Canvas/SVG з підтримкою зуму, фільтрації ребер та виділенням кластерів.",
        codeSnippet: {
          lang: "javascript",
          code: `// Ініціалізація d3 Force-directed Layout для графу PREDATOR
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).id(d => d.id).distance(150))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2));
`
        }
      }
    ]
  },
  {
    id: 8,
    title: "Том 8. Аналітичний модуль",
    subtitle: "Аналіз зв'язків, алгоритми виявлення спільнот та Risk Score",
    icon: Zap,
    category: "Intelligence",
    chapters: [
      {
        title: "8.1 Обчислення індексу ризику (Risk Score Engine)",
        description: "Комбінована оцінка ризику на основі сукупності факторів: зв'язки з РФ/РБ, відкриті судові справи, офшорні засновники, податковий борг.",
        requirements: ["REQ-ANL-001: Можливість кастомізації ваг ризиків у панелі адміністратора", "REQ-ANL-002: Розрахунок транзитивного ризику (якщо засновник має високий ризик, компанія успадковує коефіцієнт)"]
      },
      {
        title: "8.2 Алгоритми пошуку закономірностей у графах",
        description: "Використання алгоритмів Louvain Modularity для кластеризації компаній у бізнес-групи та PageRank для знаходження ключових хабів впливу.",
        technicalDetails: "Алгоритми реалізуються за допомогою плагіну Neo4j Graph Data Science (GDS).",
        codeSnippet: {
          lang: "cypher",
          code: `// Запуск Louvain Community Detection через Cypher GDS
CALL gds.louvain.write('myGraph', {
  writeProperty: 'communityId'
})
YIELD communityCount, modularity;
`
        }
      }
    ]
  },
  {
    id: 9,
    title: "Том 9. Безпека & Zero Trust",
    subtitle: "HashiCorp Vault, Keycloak RBAC/ABAC, mTLS Istio",
    icon: Shield,
    category: "Security",
    chapters: [
      {
        title: "9.1 Шифрування та менеджмент секретів (HashiCorp Vault)",
        description: "Зберігання сертифікатів, API-ключів держреєстрів та токенів ШІ у динамічних секретах HashiCorp Vault з автоматичною ротацією.",
        requirements: ["REQ-SEC-001: Шифрування даних у спокої (AES-256-GCM)", "REQ-SEC-002: Повний mTLS між усіма подами кластера за допомогою Istio service mesh"]
      },
      {
        title: "9.2 Модель доступу RBAC & ABAC та OPA",
        description: "Перевірка дозволів користувача за допомогою Open Policy Agent (OPA) на основі географічного положення, IP та рівня доступу.",
        technicalDetails: "Декларативні OPA Rego правила для дозволу на перегляд конфіденційних зв'язків.",
        codeSnippet: {
          lang: "rego",
          code: `# OPA Rego правило контролю доступу до OSINT
package predator.authz

default allow = false

allow {
    input.user.role == "OSINT_ANALYST"
    input.action == "VIEW_RECORDS"
    input.resource.classification != "SECRET"
}
`
        }
      }
    ]
  },
  {
    id: 10,
    title: "Том 10. DevOps & GitOps",
    subtitle: "Helm-чарти, Terraform, ArgoCD та моніторинг Grafana/Loki",
    icon: Terminal,
    category: "Operations",
    chapters: [
      {
        title: "10.1 IaC: Розгортання через Terraform та Ansible",
        description: "Скрипти для автоматичного створення VM у хмарі (AWS/GCP) або на локальних серверах (VMware, RKE2).",
        requirements: ["REQ-OPS-001: Створення Kubernetes кластера за 15 хвилин за допомогою IaC", "REQ-OPS-002: Створення локального S3 сховища через MinIO оператор"]
      },
      {
        title: "10.2 Моніторинг, Метрики та Трейсинг (Prometheus, Grafana, Tempo)",
        description: "Збір метрик CPU, пам'яті, швидкості виконання запитів Neo4j/Qdrant, логування помилок воркерів у Loki.",
        technicalDetails: "Дашборди для спостереження за затримкою API та статусом черг RabbitMQ.",
        codeSnippet: {
          lang: "yaml",
          code: `# Конфігурація моніторингу Prometheus ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: predator-api-monitor
  namespace: predator-core
spec:
  selector:
    matchLabels:
      app: predator-api
  endpoints:
  - port: metrics
    interval: 15s
`
        }
      }
    ]
  },
  {
    id: 11,
    title: "Том 11. API Специфікація",
    subtitle: "REST API, WebSockets для стрімінгу та SDK",
    icon: Code,
    category: "Architecture",
    chapters: [
      {
        title: "11.1 REST OpenAPI & WebSockets",
        description: "Повний опис кінцевих точок для отримання сутностей, створення аналітичних проектів та підписки на реальні оновлення подій.",
        technicalDetails: "Swagger/OpenAPI-сумісні схеми запитів та відповідей для розробників інтеграцій.",
        codeSnippet: {
          lang: "yaml",
          code: `# Специфікація OpenAPI v3
openapi: 3.0.3
info:
  title: PREDATOR Analytics Core API
  version: 1.0.0
paths:
  /api/v1/entities/{id}:
    get:
      summary: Отримати інформацію про сутність
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Успішно знайдено
`
        }
      }
    ]
  },
  {
    id: 12,
    title: "Том 12. Документація Розробника",
    subtitle: "Стандарти кодування, Git Flow, CI пайплайни та ADR",
    icon: FileText,
    category: "Operations",
    chapters: [
      {
        title: "12.1 Стандарти коду та Git Flow",
        description: "Правила написання чистого коду (Clean Code), використання ESLint, Prettier, Black (для Python), правила коммітів Conventional Commits.",
        requirements: ["REQ-DEV-001: Покриття юніт-тестами нового коду не менше 80%", "REQ-DEV-002: Обов'язкове проходження стадії статичного аналізу SonarQube у CI"]
      }
    ]
  },
  {
    id: 13,
    title: "Том 13. Тестування (QA)",
    subtitle: "Unit, інтеграційні, E2E, Chaos-тести та навантаження",
    icon: CheckCircle,
    category: "Operations",
    chapters: [
      {
        title: "13.1 Навантажувальне тестування (K6, Locust)",
        description: "Методологія симуляції 10,000 одночасних сесій аналітиків та інтенсивного ETL-завантаження.",
        technicalDetails: "Сценарії Locust для імітації складних запитів пошуку зв'язків.",
        codeSnippet: {
          lang: "python",
          code: `# Сценарій навантаження API на Python Locust
from locust import HttpUser, task, between

class PredatorUser(HttpUser):
    wait_time = between(1, 5)

    @task
    def search_entities(self):
        self.client.get("/api/v1/entities/search?q=ТОВ+Арсенал")
`
        }
      }
    ]
  },
  {
    id: 14,
    title: "Том 14. Експлуатація & Резервування",
    subtitle: "Резервне копіювання, Disaster Recovery та міграції",
    icon: Database,
    category: "Operations",
    chapters: [
      {
        title: "14.1 Disaster Recovery (RTO / RPO) та Velero",
        description: "Резервне копіювання стану кластера K8s та сховищ баз даних за допомогою Velero у MinIO S3 кожну ніч.",
        requirements: ["REQ-OPS-003: Час відновлення системи (RTO) менше 1 години", "REQ-OPS-004: Максимальна втрата даних (RPO) не більше 4 годин"]
      }
    ]
  },
  {
    id: 15,
    title: "Том 15. Адміністрування",
    subtitle: "Логи дій, керування організаціями та ліцензіями",
    icon: Shield,
    category: "Security",
    chapters: [
      {
        title: "15.1 Панель супер-адміністратора PREDATOR",
        description: "Консоль керування клієнтськими організаціями (тенантність/Multi-tenancy), моніторинг спожитих токенів ШІ та API запитів.",
        requirements: ["REQ-ADM-001: Ізоляція даних організацій-клієнтів на рівні окремих баз (Database-per-tenant)", "REQ-ADM-002: Моніторинг активності воркерів у реальному часі"]
      }
    ]
  },
  {
    id: 16,
    title: "Том 16. Комерційні Редакції",
    subtitle: "Community, Professional, Enterprise, Government & Military",
    icon: Zap,
    category: "Strategic",
    chapters: [
      {
        title: "16.1 Порівняння редакцій та ліцензування",
        description: "Чіткі рамки та функціональні обмеження кожної редакції. Версія Military включає підтримку офлайн-карт, супутникових знімків та офлайн-ШІ моделей.",
        requirements: ["REQ-COM-001: Community версія постачається під ліцензією AGPL-3.0", "REQ-COM-002: Enterprise та Military постачаються під закритими комерційними ліцензіями"]
      }
    ]
  }
];

export default function VolumesTab() {
  const [activeVolume, setActiveVolume] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filter categories
  const categories = ['All', 'Strategic', 'Architecture', 'Data', 'Intelligence', 'Operations', 'Security'];

  const filteredVolumes = useMemo(() => {
    return VOLUMES_DATA.filter(vol => {
      const matchesCategory = selectedCategory === 'All' || vol.category === selectedCategory;
      const matchesSearch = searchTerm === '' || 
        vol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vol.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vol.chapters.some(ch => 
          ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ch.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const currentVolumeObj = VOLUMES_DATA.find(v => v.id === activeVolume) || VOLUMES_DATA[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(code);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6" id="volumes-tab-root">
      {/* Intro Header banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Комплект документації PREDATOR Analytics Enterprise
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-3xl">
              Повний еталонний пакет системної архітектури, розроблений для масштабування OSINT платформи. 
              Містить 16 взаємопов'язаних томів, детальні діаграми, схеми даних, інфраструктурний код та понад 450+ функціональних вимог для реалізації.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono bg-slate-950 border border-slate-850 px-4 py-3 rounded-xl shrink-0">
            <div>
              <span className="text-slate-500 block">ТОМИ ТЗ</span>
              <span className="text-indigo-400 font-bold text-base">16</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-850"></div>
            <div>
              <span className="text-slate-500 block">ВИМОГИ (REQ)</span>
              <span className="text-emerald-400 font-bold text-base">450+</span>
            </div>
            <div className="w-[1px] h-8 bg-slate-850"></div>
            <div>
              <span className="text-slate-500 block">СПЕЦИФІКАЦІЇ</span>
              <span className="text-amber-400 font-bold text-base">100% Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-1.5 items-center w-full md:w-auto" id="volume-category-filters">
          <Filter className="w-4 h-4 text-slate-500 mr-1 shrink-0" />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'}`}
            >
              {cat === 'All' ? 'Всі Категорії' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Шукати у 16 томах..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Active Area: Volumes List left, Active Volume Details right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Volumes Selector */}
        <div className="lg:col-span-4 space-y-2.5 overflow-y-auto max-h-[650px] pr-2" id="volumes-selectors-pane">
          {filteredVolumes.map((vol) => {
            const Icon = vol.icon;
            const isActive = activeVolume === vol.id;
            return (
              <button
                key={vol.id}
                onClick={() => {
                  setActiveVolume(vol.id);
                  setExpandedChapter(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-start gap-3.5 relative cursor-pointer ${isActive ? 'bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/5' : 'bg-slate-900/40 border-slate-900/80 text-slate-400 hover:text-slate-200 hover:border-slate-800'}`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-950 text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide font-mono">
                      {vol.category}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono font-bold">
                      {vol.chapters.length} розділів
                    </span>
                  </div>
                  <h4 className="font-bold leading-tight text-slate-200">{vol.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal">{vol.subtitle}</p>
                </div>

                {isActive && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <ChevronRight className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
          {filteredVolumes.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
              Нічого не знайдено за вказаними параметрами пошуку.
            </div>
          )}
        </div>

        {/* Right Column: Detailed Chapter Browser */}
        <div className="lg:col-span-8 space-y-5 bg-slate-950 border border-slate-900 rounded-2xl p-6" id="volume-details-workspace">
          
          {/* Active Volume Header */}
          <div className="border-b border-slate-900 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded">
                {currentVolumeObj.category} специфікація
              </span>
              <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1.5">{currentVolumeObj.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{currentVolumeObj.subtitle}</p>
          </div>

          {/* Chapters loop */}
          <div className="space-y-4" id="chapters-accordion-group">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">
              Структура та зміст тому
            </h4>

            {currentVolumeObj.chapters.map((ch, idx) => {
              const isOpen = expandedChapter === ch.title;
              return (
                <div 
                  key={idx}
                  className={`border rounded-xl transition-all ${isOpen ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-900/10 border-slate-900 hover:border-slate-850'}`}
                >
                  {/* Title Toggle bar */}
                  <button
                    onClick={() => setExpandedChapter(isOpen ? null : ch.title)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                      <span className="font-semibold text-xs text-slate-200 leading-snug">
                        {ch.title}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {/* Collapsible Content */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-slate-900 space-y-4 text-xs">
                          
                          {/* Core Description */}
                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">Функціональний опис:</span>
                            <p className="text-slate-300 leading-relaxed text-[11px] whitespace-pre-line">
                              {ch.description}
                            </p>
                          </div>

                          {/* Technical details (if exists) */}
                          {ch.technicalDetails && (
                            <div className="bg-slate-950/60 border border-slate-850/40 rounded-lg p-3 space-y-1">
                              <span className="text-[9px] text-amber-400 font-mono uppercase tracking-widest block font-bold">Архітектурні особливості:</span>
                              <p className="text-slate-400 text-[10px] leading-relaxed">
                                {ch.technicalDetails}
                              </p>
                            </div>
                          )}

                          {/* Code Snippet / Config file */}
                          {ch.codeSnippet && (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
                                  Еталонна конфігурація ({ch.codeSnippet.lang}):
                                </span>
                                <button
                                  onClick={() => handleCopyCode(ch.codeSnippet!.code)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-850"
                                >
                                  {copiedText === ch.codeSnippet.code ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Скопійовано!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Скопіювати</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-900 overflow-x-auto">
                                <pre className="text-[10px] font-mono text-indigo-300 leading-relaxed">
                                  <code>{ch.codeSnippet.code}</code>
                                </pre>
                              </div>
                            </div>
                          )}

                          {/* Associated Requirements */}
                          {ch.requirements && ch.requirements.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest block">
                                Пов'язані системні вимоги ({ch.requirements.length}):
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {ch.requirements.map((req, rIdx) => (
                                  <div 
                                    key={rIdx}
                                    className="glass-panel rounded-lg p-2.5 flex items-start gap-2 text-[10px] text-slate-400"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                    <span className="leading-tight">{req}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Quick Informational Box */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex items-start gap-3 text-xs">
            <Info className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-200">Довідка розробника:</span>
              <p className="text-slate-400 leading-normal">
                Кожен том містить точні, затверджені в ТЗ специфікації, які є обов'язковими для дотримання при побудові PREDATOR OSINT. Натисніть на розділи вище для детального ознайомлення, копіювання коду та перевірки системних вимог (REQ).
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
