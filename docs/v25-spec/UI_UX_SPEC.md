# 🎨 UI/UX Специфікація: Predator Analytics v45.0

> **Повна Специфікація UI/UX з Інтеграцією Self-Healing та AI-Оркестрації**

> **Версія документа:** 25.0
> **Статус:** Затверджено до розробки
> **Дата:** 10.01.2026

---

## Зміст

1. [Мета та Концепція](#1-мета-та-концепція)
2. [Рольова Модель та Data Visibility](#2-рольова-модель-та-data-visibility)
3. [Архітектура Інтерфейсу: Dimensional UI](#3-архітектура-інтерфейсу-dimensional-ui)
4. [Компоненти Інтерфейсу](#4-компоненти-інтерфейсу)
5. [Мобільний Інтерфейс: Tactical View](#5-мобільний-інтерфейс-tactical-view)
6. [UX Принципи та Дизайн](#6-ux-принципи-та-дизайн)
7. [Roadmap](#7-roadmap)
8. [KPI та Критерії Прийому](#8-kpi-та-критерії-прийому)

---

## 1. Мета та Концепція

### 1.1. Головне завдання

Створення **інтуїтивно зрозумілого, високопродуктивного** веб-інтерфейсу системи Predator Analytics, що забезпечує:

- ⚡ Миттєвий доступ до аналітичних даних
- 🔍 Управління розвідкою (OSINT)
- 🛡️ Моніторинг загроз

### 1.2. Філософія: Dimensional UI

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DIMENSIONAL UI CONCEPT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Інтерфейс, що ЗМІНЮЄТЬСЯ залежно від:                                     │
│                                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │              │    │              │    │              │                  │
│   │  👤 РОЛЬ     │    │  📱 ПРИСТРІЙ │    │  🎯 КОНТЕКСТ │                  │
│   │  користувача │    │  (PC/Mobile/ │    │    задачі    │                  │
│   │              │    │   TV/Tablet) │    │              │                  │
│   └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                                              │
│   ════════════════════════════════════════════════════════════════════════  │
│                                                                              │
│   Результат: Максимальна ВІЗУАЛЬНА ЧИСТОТА                                  │
│              при збереженні ПОТУЖНОГО ФУНКЦІОНАЛУ                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Рольова Модель та Data Visibility

### 2.1. Архітектура Рівнів Доступу

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA VISIBILITY LEVELS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │    LEVEL 4: ADMIN / COMMANDER                                        │   │
│   │    ═══════════════════════════                                       │   │
│   │    🔐 System God Mode                                                │   │
│   │    • Управління користувачами, білінг, API                          │   │
│   │    • Конфігурація ETL, LLM моделей                                  │   │
│   │    • Повний Audit Log                                                │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │    LEVEL 3: CLIENT / EXPLORER                                        │   │
│   │    ═══════════════════════════                                       │   │
│   │    👤 Основний робочий простір                                       │   │
│   │    • Повний доступ до даних (без маскування)                        │   │
│   │    • Data Hub, графи зв'язків, OSINT                                │   │
│   │    • Self-Service дашборди                                           │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │    LEVEL 2: PUBLIC / RESTRICTED                                      │   │
│   │    ════════════════════════════                                      │   │
│   │    👁️ Обмежений перегляд                                             │   │
│   │    • Тільки агреговані графіки                                      │   │
│   │    • MASKING: 34******, Comp****** Ltd                              │   │
│   │    • Заборонено: експорт, деталі                                    │   │
│   ├─────────────────────────────────────────────────────────────────────┤   │
│   │    LEVEL 1: TACTICAL MOBILE                                          │   │
│   │    ════════════════════════════                                      │   │
│   │    📱 Обрізаний мобільний UI                                         │   │
│   │    • Smart Search (Google-style)                                    │   │
│   │    • Red Flags індикатори                                           │   │
│   │    • Voice Input                                                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Деталізація рівнів

#### Level 1: Public / Restricted

| Аспект | Опис |
|--------|------|
| **Призначення** | Демо-доступ, аудити, молодший персонал |
| **Дані** | Агреговані графіки та аналітика |
| **Masking** | ЄДРПОУ: `34******`, ПІБ: `Іван***` |
| **Заборонено** | Експорт, детальні картки |

```typescript
// Приклад маскування на Frontend
const maskData = (value: string, type: 'edrpou' | 'name' | 'iban') => {
  switch (type) {
    case 'edrpou': return value.slice(0, 2) + '******'
    case 'name': return value.slice(0, 4) + '******'
    case 'iban': return 'UA**' + '*'.repeat(25)
  }
}

// ⚠️ ВАЖЛИВО: Маскування НА БЕКЕНДІ, не CSS!
// Restricted user не отримує raw дані у JSON response
```

#### Level 2: Client / Explorer

| Аспект | Опис |
|--------|------|
| **Призначення** | Бізнесмени, детективи, аналітики |
| **Дані** | Повний доступ у межах передплати |
| **Інструменти** | Data Hub, графи зв'язків, OSINT |
| **Кастомізація** | Self-Service дашборди з OpenSearch |

#### Level 3: Admin / Commander

| Аспект | Опис |
|--------|------|
| **Призначення** | Тех. адміни, керівництво безпеки |
| **Можливості** | User Management, Billing, API Config |
| **Системні** | ETL pipelines, LLM config, Logs |
| **Аудит** | Хто, коли, які дані переглядав |

#### Level 4: Tactical Mobile

| Аспект | Опис |
|--------|------|
| **Призначення** | Швидкий доступ "у полі" |
| **Концепція** | Максимальне спрощення |
| **Функції** | Smart Search, Red Flags, Voice |

---

## 3. Архітектура Інтерфейсу: Dimensional UI

### 3.1. Технологічний Стек

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND STACK                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│   │   FRAMEWORK     │   │     STATE       │   │      UI         │          │
│   │   ───────────   │   │   ─────────     │   │   ──────────    │          │
│   │   Next.js 14+   │   │   Zustand       │   │   Tailwind CSS  │          │
│   │   (App Router)  │   │   (Lightweight) │   │   + Shadcn/ui   │          │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘          │
│                                                                              │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐          │
│   │   REAL-TIME     │   │   ANALYTICS     │   │    GRAPHS       │          │
│   │   ───────────   │   │   ─────────     │   │   ──────────    │          │
│   │   WebSocket     │   │   Recharts      │   │   React Flow    │          │
│   │   (Live updates)│   │   D3.js         │   │   (Connections) │          │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Технологія | Версія | Призначення |
|------------|--------|-------------|
| **Next.js** | 14+ | App Router, SSR, SEO |
| **Zustand** | 4+ | Легкий State Management |
| **Tailwind CSS** | 3+ | Utility-first стилізація |
| **Shadcn/ui** | latest | Компоненти (accessible) |
| **WebSocket** | - | Real-time оновлення |
| **Recharts** | 2+ | Графіки та діаграми |
| **D3.js** | 7+ | Складні візуалізації |
| **React Flow** | 11+ | Графи зв'язків |

### 3.2. Структура проекту

```
apps/predator-analytics-ui/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/               # Protected routes
│   │   ├── @modal/                # Parallel routes for modals
│   │   ├── explorer/              # Data Explorer
│   │   ├── analytics/             # OpenSearch Analytics
│   │   ├── admin/                 # Admin Panel
│   │   └── layout.tsx             # Dashboard layout
│   └── api/                       # API routes
├── components/
│   ├── dimensional/               # Role-adaptive components
│   │   ├── shells/                # ExplorerShell, CommanderShell
│   │   └── primitives/            # Shared primitives
│   ├── dashboard/                 # Dashboard widgets
│   ├── data-explorer/             # Table components
│   ├── analytics/                 # Charts & graphs
│   └── ui/                        # Shadcn/ui components
├── hooks/
│   ├── useRole.ts                 # Role detection
│   ├── useDataVisibility.ts       # Data masking
│   └── useRealtime.ts             # WebSocket
├── stores/
│   ├── authStore.ts               # Auth state
│   ├── dashboardStore.ts          # Widget layout
│   └── searchStore.ts             # Search state
└── lib/
    ├── rbac.ts                    # RBAC utilities
    └── masking.ts                 # Data masking
```

---

## 4. Компоненти Інтерфейсу

### 4.1. Dashboard — Адаптивний Робочий Стіл

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CONTEXT-AWARE DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Дашборд автоматично адаптується під професію користувача:                 │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  👔 БАНКІР                                                            │ │
│   │  ─────────                                                            │ │
│   │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │ │
│   │  │ Credit    │ │ Financial │ │ Risk      │ │ Related   │            │ │
│   │  │ Scoring   │ │ Metrics   │ │ Indicators│ │ Persons   │            │ │
│   │  └───────────┘ └───────────┘ └───────────┘ └───────────┘            │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  👮 ПРАВООХОРОНЕЦЬ                                                    │ │
│   │  ────────────────                                                     │ │
│   │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │ │
│   │  │ Connection│ │ Criminal  │ │ Border    │ │ Assets    │            │ │
│   │  │ Graphs    │ │ Cases     │ │ Crossings │ │ Registry  │            │ │
│   │  └───────────┘ └───────────┘ └───────────┘ └───────────┘            │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  🏛️ ЧИНОВНИК / ІНСПЕКТОР                                             │ │
│   │  ─────────────────────────                                            │ │
│   │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │ │
│   │  │ Tenders   │ │ PEP Links │ │ Declara-  │ │ Conflicts │            │ │
│   │  │ Monitor   │ │ Analysis  │ │ tions     │ │ of Interest│           │ │
│   │  └───────────┘ └───────────┘ └───────────┘ └───────────┘            │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │  💼 БІЗНЕСМЕН                                                         │ │
│   │  ───────────                                                          │ │
│   │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │ │
│   │  │ Competitor│ │ Counter-  │ │ Reputation│ │ Market    │            │ │
│   │  │ Intel     │ │ party Due │ │ Monitor   │ │ Analysis  │            │ │
│   │  └───────────┘ └───────────┘ └───────────┘ └───────────┘            │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2. OpenSearch Analytics Module

```typescript
// "Серце" кастомізації
interface OpenSearchWidget {
  id: string
  type: 'chart' | 'pie' | 'table' | 'metric'
  title: string
  query: string      // OpenSearch query
  visualization: {
    type: string
    options: Record<string, any>
  }
}

const AnalyticsModule = () => {
  return (
    <DragDropContext onDragEnd={handleReorder}>
      <Droppable droppableId="dashboard">
        {/* Drag & Drop конструктор */}
        <WidgetLibrary>
          <Widget title="Динаміка судових рішень" />
          <Widget title="Розподіл за регіонами" />
          <Widget title="Топ-10 ризикових компаній" />
        </WidgetLibrary>

        {/* User's Dashboard */}
        <DashboardGrid widgets={userWidgets} />
      </Droppable>
    </DragDropContext>
  )
}

// Drill-down: Клік по стовпчику → фільтр таблиці
const handleChartClick = (dataPoint: DataPoint) => {
  setTableFilter({ [dataPoint.dimension]: dataPoint.value })
}

// Custom Alerts: "Стежити" за піковим значенням
const createAlert = async (trigger: AlertTrigger) => {
  await api.createMonitoringTrigger({
    condition: trigger.condition,
    threshold: trigger.value,
    notification: { telegram: true, email: true }
  })
}
```

### 4.3. Data Explorer — Smart Grid

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA EXPLORER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🔍 Search: [                                                    ]   │   │
│   │                                                                      │   │
│   │  Filters: [Industry ▼] [Region ▼] [Risk ▼] [Date Range]            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  SMART GRID (Virtual Scroll - мільйони рядків)                      │   │
│   │  ───────────────────────────────────────────────────────────────    │   │
│   │                                                                      │   │
│   │  │ Company        │ EDRPOU   │ Risk  │ Revenue    │ Actions │       │   │
│   │  ├────────────────┼──────────┼───────┼────────────┼─────────┤       │   │
│   │  │ ТОВ "Ромашка"  │ 12345678 │ 🔴    │ $1.2M      │ ⋯ ▼     │       │   │
│   │  │ ПП "Сонце"     │ 87654321 │ 🟢    │ $450K      │ ⋯ ▼     │       │   │
│   │  │ АТ "Промінь"   │ 11223344 │ 🟡    │ $3.8M      │ ⋯ ▼     │       │   │
│   │  │ ...                                                              │   │
│   │                                                                      │   │
│   │  ┌─────────────────────────────────────────────────────────────┐    │   │
│   │  │ Inline Actions (при наведенні):                             │    │   │
│   │  │  [➕ Моніторинг] [🕸️ Граф] [📥 Експорт] [🔍 Деталі]        │    │   │
│   │  └─────────────────────────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  PRIVACY BLUR (для Restricted users)                                │   │
│   │  ───────────────────────────────────────────────────────────────    │   │
│   │                                                                      │   │
│   │  │ Company        │ EDRPOU   │ Risk  │ Revenue    │                 │   │
│   │  ├────────────────┼──────────┼───────┼────────────┤                 │   │
│   │  │ ████████████   │ ████████ │ 🔴    │ ████████   │                 │   │
│   │  │                │          │       │            │                 │   │
│   │  │  ⚠️ Access Denied (при наведенні)                               │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4. Admin Panel (Level 3+)

```typescript
const AdminPanel = () => {
  // Тільки для Admin / Commander
  const { role } = useRole()
  if (!['admin', 'commander'].includes(role)) {
    return <AccessDenied />
  }

  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">👥 Users</TabsTrigger>
        <TabsTrigger value="system">⚙️ System Health</TabsTrigger>
        <TabsTrigger value="audit">📋 Audit Log</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        {/* User Management */}
        <UserTable>
          <Column field="email" />
          <Column field="role" editable />
          <Column field="maskingLevel" editable />
          <Column field="lastLogin" />
        </UserTable>
      </TabsContent>

      <TabsContent value="system">
        {/* System Health */}
        <MetricCard title="Kafka Queue" value={kafkaLag} />
        <MetricCard title="Indexing Status" value={indexStatus} />
        <MetricCard title="CPU / RAM" value={resourceUsage} />
      </TabsContent>

      <TabsContent value="audit">
        {/* Audit Log */}
        <AuditLog
          columns={['user', 'action', 'target', 'timestamp']}
          filter={{ dateRange: 'last7days' }}
        />
        {/* Хто шукав "ТОВ Ромашка" */}
      </TabsContent>
    </Tabs>
  )
}
```

---

## 5. Мобільний Інтерфейс: Tactical View

### 5.1. Автоактивація

```typescript
// Автоматичне визначення мобільного пристрою
const useTacticalMode = () => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const forceTactical = useUserPreference('forceTacticalMode')

  return isMobile || forceTactical
}
```

### 5.2. Екрани Tactical View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TACTICAL MOBILE INTERFACE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ЕКРАН 1: ПОШУК ТА СТРІЧКА                                                 │
│   ══════════════════════════                                                 │
│                                                                              │
│   ┌──────────────────────────────────────────┐                              │
│   │  ╭────────────────────────────────────╮  │                              │
│   │  │  🔍 Пошук компанії чи особи...     │  │                              │
│   │  │                              🎤    │  │  ← Voice Input               │
│   │  ╰────────────────────────────────────╯  │                              │
│   │                                          │                              │
│   │  📌 ВАЖЛИВЕ                              │                              │
│   │  ──────────                              │                              │
│   │  ┌────────────────────────────────────┐  │                              │
│   │  │ 🔴 У компанії "Х" змінився директор│  │                              │
│   │  │    2 хвилини тому                  │  │                              │
│   │  └────────────────────────────────────┘  │                              │
│   │  ┌────────────────────────────────────┐  │                              │
│   │  │ 🟡 Новий судовий позов проти "Y"   │  │                              │
│   │  │    15 хвилин тому                  │  │                              │
│   │  └────────────────────────────────────┘  │                              │
│   │  ┌────────────────────────────────────┐  │                              │
│   │  │ 🟢 Компанія "Z" погасила борг      │  │                              │
│   │  │    1 година тому                   │  │                              │
│   │  └────────────────────────────────────┘  │                              │
│   └──────────────────────────────────────────┘                              │
│                                                                              │
│   ЕКРАН 2: КАРТКА ОБ'ЄКТА (MOBILE)                                          │
│   ════════════════════════════════                                           │
│                                                                              │
│   ┌──────────────────────────────────────────┐                              │
│   │                                          │                              │
│   │  ╭────────────────────────────────────╮  │                              │
│   │  │        ТОВ "РОМАШКА"               │  │                              │
│   │  │        ЄДРПОУ: 12345678            │  │                              │
│   │  ╰────────────────────────────────────╯  │                              │
│   │                                          │                              │
│   │  ┌────────────────────────────────────┐  │                              │
│   │  │           СВІТЛОФОР                │  │                              │
│   │  │                                    │  │                              │
│   │  │      🔴 ВИСОКИЙ РИЗИК              │  │                              │
│   │  │                                    │  │                              │
│   │  │  • Санкції: ТАК                    │  │                              │
│   │  │  • Суди: 3 активних                │  │                              │
│   │  │  • Борги: 1.2M UAH                 │  │                              │
│   │  └────────────────────────────────────┘  │                              │
│   │                                          │                              │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │                              │
│   │  │    📞    │ │    🗺️    │ │    📄    │ │                              │
│   │  │ Дзвінок  │ │Навігація │ │   PDF    │ │                              │
│   │  └──────────┘ └──────────┘ └──────────┘ │                              │
│   └──────────────────────────────────────────┘                              │
│                                                                              │
│   ЕКРАН 3: ЧАТ З AI-АСИСТЕНТОМ                                              │
│   ══════════════════════════════                                             │
│                                                                              │
│   ┌──────────────────────────────────────────┐                              │
│   │                                          │                              │
│   │  🎤 "Знайди зв'язки між Іваненком       │                              │
│   │      та компанією Солар"                 │                              │
│   │                                          │                              │
│   │  ──────────────────────────────────────  │                              │
│   │                                          │                              │
│   │  🤖 Знайдено 3 прямих зв'язки:           │                              │
│   │                                          │                              │
│   │  1. Іваненко І.П. — засновник            │                              │
│   │     ТОВ "Солар Груп" (25% частки)        │                              │
│   │                                          │                              │
│   │  2. Спільний бенефіціар з                │                              │
│   │     ПП "Сонячна Енергія"                 │                              │
│   │                                          │                              │
│   │  3. Судовий спір (справа №...)           │                              │
│   │                                          │                              │
│   └──────────────────────────────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. UX Принципи та Дизайн

### 6.1. Ключові Принципи

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          UX PRINCIPLES                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🎯 ПРИНЦИП "3 КЛІКІВ"                                                      │
│   ─────────────────────                                                      │
│   До будь-якої критичної інформації ≤ 3 кліки                               │
│                                                                              │
│   🌙 DARK MODE FIRST                                                         │
│   ──────────────────                                                         │
│   Основна тема — темна (професійна, менше втомлює очі)                      │
│   Опція перемикання на світлу                                               │
│                                                                              │
│   🎨 ВИСОКА КОНТРАСТНІСТЬ                                                    │
│   ───────────────────────                                                    │
│   Статуси та ризики чітко виділяються кольором:                             │
│   🔴 Critical  🟠 High  🟡 Medium  🟢 Low  ⚪ Unknown                        │
│                                                                              │
│   ⬜ NO LOADING SPINNERS                                                     │
│   ──────────────────────                                                     │
│   Skeleton Screens (сірі прямокутники) замість спінерів                     │
│   → Відчуття миттєвої реакції інтерфейсу                                    │
│                                                                              │
│   💡 ІНТУЇТИВНІСТЬ                                                           │
│   ─────────────────                                                          │
│   Tooltips при наведенні на кожен складний термін чи іконку                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2. Skeleton Screens

```typescript
// Замість спінера — структурний скелетон
const DataExplorerSkeleton = () => (
  <div className="space-y-4">
    {/* Search bar skeleton */}
    <Skeleton className="h-10 w-full" />

    {/* Filter bar skeleton */}
    <div className="flex gap-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>

    {/* Table rows skeleton */}
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
)

// Suspense boundary
<Suspense fallback={<DataExplorerSkeleton />}>
  <DataExplorer />
</Suspense>
```

### 6.3. Кольорова палітра (Dark Theme)

```css
:root {
  /* Background */
  --bg-primary: hsl(222, 47%, 8%);      /* #0a0f1a */
  --bg-secondary: hsl(222, 47%, 11%);   /* #0f172a */
  --bg-elevated: hsl(222, 47%, 15%);    /* #1e293b */

  /* Text */
  --text-primary: hsl(210, 40%, 98%);   /* #f8fafc */
  --text-secondary: hsl(215, 20%, 65%); /* #94a3b8 */
  --text-muted: hsl(215, 16%, 47%);     /* #64748b */

  /* Accents */
  --accent-primary: hsl(217, 91%, 60%); /* #3b82f6 */
  --accent-success: hsl(142, 76%, 36%); /* #16a34a */
  --accent-warning: hsl(38, 92%, 50%);  /* #f59e0b */
  --accent-danger: hsl(0, 84%, 60%);    /* #ef4444 */

  /* Risk indicators */
  --risk-critical: hsl(0, 84%, 60%);
  --risk-high: hsl(25, 95%, 53%);
  --risk-medium: hsl(45, 93%, 47%);
  --risk-low: hsl(142, 76%, 36%);

  /* Glow effects */
  --glow-blue: 0 0 20px rgba(59, 130, 246, 0.5);
  --glow-red: 0 0 20px rgba(239, 68, 68, 0.5);
}
```

---

## 7. Roadmap

### Етап 1: Core UI & Security (Тижні 1-4)

| Завдання | Пріоритет | Статус |
|----------|-----------|--------|
| Next.js App Router архітектура | 🔴 Critical | ⬜ |
| Authentication (JWT + Redis) | 🔴 Critical | ⬜ |
| RBAC (Role-Based Access Control) | 🔴 Critical | ⬜ |
| Data Masking механізм | 🔴 Critical | ⬜ |
| Базовий Data Explorer | 🟠 High | ⬜ |

### Етап 2: Analytics & OpenSearch (Тижні 5-8)

| Завдання | Пріоритет | Статус |
|----------|-----------|--------|
| OpenSearch віджети інтеграція | 🔴 Critical | ⬜ |
| Drag & Drop конструктор дашбордів | 🟠 High | ⬜ |
| Drill-down функціонал | 🟠 High | ⬜ |
| Профілі (Банкір, Детектив) | 🟡 Medium | ⬜ |

### Етап 3: Tactical Mobile & Admin (Тижні 9-12)

| Завдання | Пріоритет | Статус |
|----------|-----------|--------|
| Адаптивний мобільний інтерфейс | 🟠 High | ⬜ |
| Voice Input інтеграція | 🟡 Medium | ⬜ |
| Admin Panel | 🟠 High | ⬜ |
| Audit Log | 🟡 Medium | ⬜ |
| UX polish & User testing | 🔴 Critical | ⬜ |

---

## 8. KPI та Критерії Прийому

### 8.1. Performance KPIs

| Метрика | Target | Поточне | Статус |
|---------|--------|---------|--------|
| **Швидкість пошуку** | < 1 сек | - | ⬜ |
| **First Contentful Paint** | < 1.5 сек | - | ⬜ |
| **Time to Interactive** | < 3 сек | - | ⬜ |
| **Lighthouse Score (Mobile)** | ≥ 90 | - | ⬜ |

### 8.2. Security KPIs

| Критерій | Вимога | Статус |
|----------|--------|--------|
| **Backend Masking** | Restricted user НЕ отримує raw дані в JSON | ⬜ |
| **Frontend Blur** | Тільки візуальне доповнення, не захист | ⬜ |
| **Audit Trail** | Кожна дія логується | ⬜ |

### 8.3. Usability KPIs

| Критерій | Вимога | Статус |
|----------|--------|--------|
| **Onboarding** | Новий користувач виконує перевірку контрагента без інструкції | ⬜ |
| **3-Click Rule** | Критична інформація ≤ 3 кліки | ⬜ |
| **Mobile Usability** | Повна функціональність Tactical View | ⬜ |

---

## 9. Додатки

### 9.1. Приклад RBAC Policy

```typescript
// lib/rbac.ts
const permissions = {
  restricted: {
    canView: ['aggregated_analytics'],
    canExport: false,
    maskingLevel: 'full',
    viewDetails: false,
  },
  explorer: {
    canView: ['all_data'],
    canExport: true,
    maskingLevel: 'none',
    viewDetails: true,
  },
  commander: {
    canView: ['all_data', 'system_config'],
    canExport: true,
    maskingLevel: 'none',
    viewDetails: true,
    canManageUsers: true,
    canViewAudit: true,
  },
} as const

export const checkPermission = (
  role: keyof typeof permissions,
  action: string
) => {
  return permissions[role]?.[action] ?? false
}
```

### 9.2. Компонент Privacy Blur

```tsx
// components/PrivacyBlur.tsx
interface PrivacyBlurProps {
  value: string
  canView: boolean
  maskType?: 'edrpou' | 'name' | 'iban'
}

export const PrivacyBlur = ({ value, canView, maskType }: PrivacyBlurProps) => {
  if (canView) {
    return <span>{value}</span>
  }

  return (
    <span
      className="blur-sm hover:blur-none transition-all cursor-not-allowed"
      title="Access Denied"
    >
      {maskData(value, maskType)}
    </span>
  )
}
```

---

## 10. Інтеграція з Backend

### 10.1. Data Hub — Управління Джерелами Даних

```typescript
// Data Hub API Integration
interface Source {
  id: string
  name: string
  type: 'csv' | 'api' | 'database' | 'scraper'
  status: 'connected' | 'syncing' | 'error'
  lastSync: Date
  recordCount: number
}

interface Dataset {
  id: string
  sourceId: string
  name: string
  status: 'uploaded' | 'processing' | 'indexed' | 'failed'
  createdAt: Date
  schema: Record<string, string>
}

// TanStack Query для кешування
const useDataSources = () => {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => api.get('/api/v1/sources'),
    staleTime: 30_000, // 30 секунд
    refetchOnWindowFocus: true,
  })
}

// Real-time статуси через WebSocket
const useDatasetStatus = (datasetId: string) => {
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/datasets/${datasetId}/status`)
    ws.onmessage = (event) => {
      const status = JSON.parse(event.data)
      queryClient.setQueryData(['dataset', datasetId], status)
    }
    return () => ws.close()
  }, [datasetId])
}
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA HUB VIEW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🗄️ DATA HUB                                           [+ Додати]   │   │
│   │                                                                      │   │
│   │  Джерела даних                                                       │   │
│   │  ─────────────                                                       │   │
│   │  │ Назва           │ Тип      │ Статус      │ Записів  │ Дії │       │   │
│   │  ├─────────────────┼──────────┼─────────────┼──────────┼─────┤       │   │
│   │  │ Реєстр компаній │ API      │ 🟢 Connected│ 1.2M     │ ⋯   │       │   │
│   │  │ Судові справи   │ Scraper  │ 🔄 Syncing  │ 450K     │ ⋯   │       │   │
│   │  │ Customs.csv     │ CSV      │ 🟢 Indexed  │ 89K      │ ⋯   │       │   │
│   │  │ Санкції API     │ API      │ 🔴 Error    │ -        │ ⋯   │       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2. Upload Wizard — Завантаження Файлів

```typescript
// Upload Wizard з Drag & Drop
const UploadWizard = () => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [progress, setProgress] = useState(0)

  // Drag & Drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    setFile(file)

    // Прев'ю (перші 10 рядків) через API
    const formData = new FormData()
    formData.append('file', file)
    const preview = await api.post('/api/v1/datasets/preview', formData)
    setPreview(preview)
  }, [])

  // SSE для прогресу
  const startProcessing = async () => {
    const job = await api.post('/api/v1/datasets/upload', { file })

    const eventSource = new EventSource(`/api/v1/jobs/${job.id}/progress`)
    eventSource.onmessage = (event) => {
      const { progress, status } = JSON.parse(event.data)
      setProgress(progress)

      if (status === 'completed' || status === 'failed') {
        eventSource.close()
      }
    }
  }

  return (
    <div>
      <DropZone onDrop={onDrop}>
        <p>📁 Перетягніть CSV/Excel файл сюди</p>
      </DropZone>

      {preview && (
        <PreviewTable
          columns={preview.columns}
          rows={preview.rows}
        />
      )}

      {progress > 0 && (
        <Progress value={progress} className="w-full" />
      )}

      <Button onClick={startProcessing}>
        🚀 Почати обробку
      </Button>
    </div>
  )
}
```

### 10.3. Self-Healing Індикатори в UI

```typescript
// Інтеграція з Self-Healing системою
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'recovering' | 'maintenance'
  message?: string
  recoveryProgress?: number
  estimatedTime?: string
}

const SystemHealthBanner = () => {
  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/api/v1/health/detailed'),
    refetchInterval: 5000, // Кожні 5 секунд
  })

  if (health?.status === 'healthy') return null

  return (
    <Alert variant={health?.status === 'recovering' ? 'warning' : 'destructive'}>
      {health?.status === 'recovering' && (
        <>
          <AlertTitle>🔄 Система відновлюється</AlertTitle>
          <AlertDescription>
            {health.message}
            <Progress value={health.recoveryProgress} className="mt-2" />
            <span className="text-sm text-muted">
              Очікуваний час: {health.estimatedTime}
            </span>
          </AlertDescription>
        </>
      )}

      {health?.status === 'degraded' && (
        <>
          <AlertTitle>⚠️ Обмежена функціональність</AlertTitle>
          <AlertDescription>{health.message}</AlertDescription>
        </>
      )}
    </Alert>
  )
}
```

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SELF-HEALING UI INDICATORS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  🔄 SYSTEM RECOVERING                                                │   │
│   │  ──────────────────────────────────────────────────────────────────  │   │
│   │                                                                      │   │
│   │  Виявлено збій у сервісі індексації.                                │   │
│   │  Автоматичне відновлення в процесі...                               │   │
│   │                                                                      │   │
│   │  [████████████████░░░░] 78%                                          │   │
│   │                                                                      │   │
│   │  Очікуваний час: ~2 хвилини                                          │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Додаткові Можливості

### 11.1. Voice Input (Web Speech API)

```typescript
// Голосовий ввід для Tactical Mobile
const useVoiceInput = () => {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast.error('Браузер не підтримує голосовий ввід')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'uk-UA'  // Українська
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
      setTranscript(transcript)
    }

    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }

  return { transcript, isListening, startListening }
}

// Використання в пошуку
const TacticalSearch = () => {
  const { transcript, isListening, startListening } = useVoiceInput()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (transcript) setQuery(transcript)
  }, [transcript])

  return (
    <div className="search-container">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Пошук компанії чи особи..."
      />
      <Button
        onClick={startListening}
        variant={isListening ? 'destructive' : 'outline'}
      >
        🎤 {isListening ? 'Слухаю...' : 'Голос'}
      </Button>
    </div>
  )
}
```

### 11.2. PWA для Offline режиму

```typescript
// next.config.js - PWA конфігурація
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.predator\.analytics/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 24 години
        },
      },
    },
  ],
})

module.exports = withPWA({
  // Next.js config
})
```

### 11.3. Empty States з CTA

```typescript
// Порожні стани з закликами до дії
const EmptyState = ({
  icon,
  title,
  description,
  action
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4 max-w-md">{description}</p>
    {action && (
      <Button onClick={action.onClick}>
        {action.icon} {action.label}
      </Button>
    )}
  </div>
)

// Приклади
<EmptyState
  icon="📊"
  title="Немає джерел даних"
  description="Додайте перше джерело даних для початку роботи з аналітикою"
  action={{
    icon: '➕',
    label: 'Додати Source',
    onClick: () => router.push('/data-hub/add')
  }}
/>

<EmptyState
  icon="🔍"
  title="Нічого не знайдено"
  description="Спробуйте змінити параметри пошуку або фільтри"
  action={{
    icon: '🔄',
    label: 'Скинути фільтри',
    onClick: resetFilters
  }}
/>
```

### 11.4. WCAG 2.1 Compliance

```typescript
// Accessibility вимоги
const AccessibleButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <button
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={props['aria-label'] || String(children)}
      className={cn(
        // Мінімальний контраст 4.5:1
        'bg-primary text-primary-foreground',
        // Focus visible для клавіатурної навігації
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        // Мінімальний розмір touch target 44x44px
        'min-h-[44px] min-w-[44px]',
        props.className
      )}
      {...props}
    >
      {children}
    </button>
  )
)

// Screen reader announcements
const useAnnounce = () => {
  const announce = (message: string, assertive = false) => {
    const el = document.createElement('div')
    el.setAttribute('aria-live', assertive ? 'assertive' : 'polite')
    el.setAttribute('aria-atomic', 'true')
    el.className = 'sr-only'
    el.textContent = message
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 1000)
  }
  return { announce }
}
```

---

## 12. Зв'язок з іншими специфікаціями

| Документ | Зв'язок |
|----------|---------|
| [SPEC_v45_DETAILED.md](./SPEC_v45_DETAILED.md) | Архітектура бекенду, Temporal, Kafka |
| [SPEC_v45.md](./SPEC_v45.md) | AI агенти, гібридний пошук |
| [openapi.yaml](./openapi.yaml) | REST API ендпоінти |
| [diagrams/](./diagrams/) | Архітектурні діаграми |

---

**Затверджено:** UI/UX Architect
**Дата:** 10.01.2026

---

*© 2026 Predator Analytics. Усі права захищено.*
