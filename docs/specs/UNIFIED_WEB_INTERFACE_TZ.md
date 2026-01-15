# 📋 ТЕХНІЧНЕ ЗАВДАННЯ: Unified Web Interface v2.0

**Проект:** Predator Analytics
**Версія документу:** 2.0
**Дата:** 2026-01-13
**Статус:** На впровадження

---

## 🔑 КЛЮЧОВЕ UX-ПРАВИЛО

> **Користувач бачить ТІЛЬКИ свій режим.**
> Він не бачить назв інших режимів.
> Немає військових, технічних або внутрішніх термінів.
> Усе написано людською українською мовою.

**Назви режимів у лівому сайдбарі:**
| Роль | Назва в UI | Опис |
|------|-----------|------|
| `client_basic` | **Клієнтський доступ** | Базовий режим перегляду інформації |
| `client_premium` | **Преміум-аналітика** | Розширений аналітичний режим |
| `admin` | **Адміністрування системи** | Внутрішній технічний режим |

> ⚠️ Клієнт ніколи не повинен запитувати: *«А що таке командир?»* або *«А я оператор чого?»*

---

## 📊 ЧАСТИНА 1: GAP-АНАЛІЗ

### 1.1 Поточний стан системи

#### Існуюча система ролей:
| Параметр | Поточно | Потрібно | GAP |
|----------|---------|----------|-----|
| Ролі | `EXPLORER`, `OPERATOR`, `COMMANDER` | `client_basic`, `client_premium`, `admin` | ⚠️ Перейменування + переосмислення |
| UI Shells | 3 shells (Explorer, Operator, Commander) | 1 Unified App + role-gated features | 🔴 Повна переробка |
| Підписки | `FREE`, `PRO`, `ENTERPRISE` | Інтегровано в ролі | ⚠️ Об'єднання |
| Юрисдикція | Частково (data_sectors) | Повна система jurisdiction | 🔴 Нова функціональність |
| Desktop/Tablet/Mobile | CSS responsive | Логічне перемикання | 🔴 Нова функціональність |
| Мова | Часткова українська | 100% українська (EN опційно) | ⚠️ Повна локалізація |

#### Існуючі views (18 шт):
```
ActivityView       AnalyticsView      AgentsView
CasesView          DataView           DatabasesView
DatasetStudio      DeploymentView     DocumentsView
LLMView            MonitoringView     NasView
OmniscienceView    ParsersView        SearchConsole
SecurityView       SettingsView       SuperIntelligenceView
```

#### Mapping views → нові ролі:

| View | client_basic | client_premium | admin |
|------|--------------|----------------|-------|
| SearchConsole | ✅ (обмежено) | ✅ (повно) | ❌ |
| DocumentsView | ✅ | ✅ | ❌ |
| CasesView | ✅ (текст) | ✅ (візуал) | ❌ |
| AnalyticsView | ❌ | ✅ | ❌ |
| DataView | ❌ | ✅ | ❌ |
| DatabasesView | ❌ | ❌ | ✅ |
| OmniscienceView | ❌ | ✅ | ❌ |
| MonitoringView | ❌ | ❌ | ✅ |
| SecurityView | ❌ | ❌ | ✅ |
| SettingsView | ❌ | ❌ | ✅ |
| AgentsView | ❌ | ❌ | ✅ |
| DeploymentView | ❌ | ❌ | ✅ |
| LLMView | ❌ | ❌ | ✅ |
| NasView | ❌ | ❌ | ✅ |
| DatasetStudio | ❌ | ❌ | ✅ |
| ParsersView | ❌ | ❌ | ✅ |
| SuperIntelligenceView | ❌ | ❌ | ✅ |
| ActivityView | ✅ (власне) | ✅ (все) | ✅ (audit) |

---

## 📐 ЧАСТИНА 2: АРХІТЕКТУРА РІШЕННЯ

### 2.1 Нова система ролей

```typescript
// src/types/roles.ts

export enum UserRole {
  CLIENT_BASIC = 'client_basic',
  CLIENT_PREMIUM = 'client_premium',
  ADMIN = 'admin',
}

// Цивільні назви для UI (ніяких технічних термінів!)
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.CLIENT_BASIC]: 'Клієнтський доступ',
  [UserRole.CLIENT_PREMIUM]: 'Преміум-аналітика',
  [UserRole.ADMIN]: 'Адміністрування системи',
};

// Короткі описи для підзаголовків
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.CLIENT_BASIC]: 'Базовий режим перегляду інформації',
  [UserRole.CLIENT_PREMIUM]: 'Розширений аналітичний режим',
  [UserRole.ADMIN]: 'Внутрішній технічний режим',
};

export interface RoleCapabilities {
  // UI Sections
  canSeeDashboards: boolean;
  canSeeVisualAnalytics: boolean;
  canSeeRelationsGraph: boolean;
  canSeeTimelines: boolean;
  canSeeOpenSearch: boolean;
  canSeeSensitiveData: boolean;
  canSeeSystemCore: boolean;

  // Features
  canAccessFullNewspaper: boolean;
  canAccessDetailedTrends: boolean;
  canToggleSensitiveData: boolean;
  canManageUsers: boolean;
  canManageJurisdictions: boolean;
  canViewAuditLogs: boolean;
}

export const ROLE_CAPABILITIES: Record<UserRole, RoleCapabilities> = {
  [UserRole.CLIENT_BASIC]: {
    canSeeDashboards: false,
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: false,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
  },
  [UserRole.CLIENT_PREMIUM]: {
    canSeeDashboards: true,
    canSeeVisualAnalytics: true,
    canSeeRelationsGraph: true,
    canSeeTimelines: true,
    canSeeOpenSearch: true,
    canSeeSensitiveData: true, // via toggle
    canSeeSystemCore: false,
    canAccessFullNewspaper: true,
    canAccessDetailedTrends: true,
    canToggleSensitiveData: true,
    canManageUsers: false,
    canManageJurisdictions: false,
    canViewAuditLogs: false,
  },
  [UserRole.ADMIN]: {
    canSeeDashboards: false, // Not product dashboards
    canSeeVisualAnalytics: false,
    canSeeRelationsGraph: false,
    canSeeTimelines: false,
    canSeeOpenSearch: false,
    canSeeSensitiveData: false,
    canSeeSystemCore: true,
    canAccessFullNewspaper: false,
    canAccessDetailedTrends: false,
    canToggleSensitiveData: false,
    canManageUsers: true,
    canManageJurisdictions: true,
    canViewAuditLogs: true,
  },
};
```

### 2.2 Нова структура навігації

```typescript
// src/config/navigation.ts

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
  premiumOnly?: boolean;
  adminOnly?: boolean;
}

export const NAVIGATION_CONFIG: Record<string, NavItem[]> = {
  // CLIENT SECTION (basic + premium)
  client: [
    { id: 'overview', label: 'Огляд', icon: 'Home', path: '/overview', roles: ['client_basic', 'client_premium'] },
    { id: 'search', label: 'Пошук', icon: 'Search', path: '/search', roles: ['client_basic', 'client_premium'] },
    { id: 'trends', label: 'Тренди', icon: 'TrendingUp', path: '/trends', roles: ['client_basic', 'client_premium'] },
    { id: 'newspaper', label: 'Ранкова Газета', icon: 'Newspaper', path: '/newspaper', roles: ['client_basic', 'client_premium'] },
    { id: 'reports', label: 'Звіти', icon: 'FileText', path: '/reports', roles: ['client_basic', 'client_premium'] },
    { id: 'profile', label: 'Профіль', icon: 'User', path: '/profile', roles: ['client_basic', 'client_premium'] },
  ],

  // PREMIUM ONLY
  premium: [
    { id: 'dashboards', label: 'Дашборди', icon: 'LayoutDashboard', path: '/dashboards', roles: ['client_premium'], premiumOnly: true },
    { id: 'visualAnalytics', label: 'Візуальна Аналітика', icon: 'BarChart3', path: '/analytics', roles: ['client_premium'], premiumOnly: true },
    { id: 'relations', label: 'Звʼязки', icon: 'Network', path: '/relations', roles: ['client_premium'], premiumOnly: true },
    { id: 'timelines', label: 'Часові Лінії', icon: 'Clock', path: '/timelines', roles: ['client_premium'], premiumOnly: true },
    { id: 'opensearch', label: 'OpenSearch', icon: 'Database', path: '/opensearch', roles: ['client_premium'], premiumOnly: true },
  ],

  // ADMIN ONLY
  admin: [
    { id: 'systemStatus', label: 'Стан Системи', icon: 'Activity', path: '/admin/status', roles: ['admin'], adminOnly: true },
    { id: 'infrastructure', label: 'Інфраструктура', icon: 'Server', path: '/admin/infra', roles: ['admin'], adminOnly: true },
    { id: 'services', label: 'Сервіси', icon: 'Boxes', path: '/admin/services', roles: ['admin'], adminOnly: true },
    { id: 'models', label: 'Моделі', icon: 'Brain', path: '/admin/models', roles: ['admin'], adminOnly: true },
    { id: 'users', label: 'Користувачі та Ролі', icon: 'Users', path: '/admin/users', roles: ['admin'], adminOnly: true },
    { id: 'jurisdictions', label: 'Юрисдикції', icon: 'Globe', path: '/admin/jurisdictions', roles: ['admin'], adminOnly: true },
    { id: 'audit', label: 'Журнали та Аудит', icon: 'ScrollText', path: '/admin/audit', roles: ['admin'], adminOnly: true },
  ],
};
```

### 2.3 Display Mode System

```typescript
// src/context/DisplayModeContext.tsx

export enum DisplayMode {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
}

export interface DisplayModeConfig {
  mode: DisplayMode;
  layout: 'multi-panel' | 'reduced' | 'card-based';
  density: 'comfortable' | 'compact' | 'touch';
  showSidebar: boolean;
  maxColumns: number;
}

export const DISPLAY_CONFIGS: Record<DisplayMode, DisplayModeConfig> = {
  [DisplayMode.DESKTOP]: {
    mode: DisplayMode.DESKTOP,
    layout: 'multi-panel',
    density: 'comfortable',
    showSidebar: true,
    maxColumns: 4,
  },
  [DisplayMode.TABLET]: {
    mode: DisplayMode.TABLET,
    layout: 'reduced',
    density: 'compact',
    showSidebar: true,
    maxColumns: 2,
  },
  [DisplayMode.MOBILE]: {
    mode: DisplayMode.MOBILE,
    layout: 'card-based',
    density: 'touch',
    showSidebar: false,
    maxColumns: 1,
  },
};
```

---

## 🏗️ ЧАСТИНА 3: СТРУКТУРА НОВИХ КОМПОНЕНТІВ

### 3.1 Файлова структура

```
src/
├── app/
│   ├── App.tsx                    # Єдина точка входу
│   └── Router.tsx                 # Role-based routing
│
├── config/
│   ├── navigation.ts              # Конфіг навігації
│   ├── roles.ts                   # Визначення ролей
│   ├── jurisdictions.ts           # Юрисдикції
│   └── features.ts                # Feature flags
│
├── context/
│   ├── AuthContext.tsx            # Автентифікація
│   ├── RoleContext.tsx            # НОВИЙ: Role management
│   ├── DisplayModeContext.tsx     # НОВИЙ: Desktop/Tablet/Mobile
│   ├── JurisdictionContext.tsx    # НОВИЙ: Юрисдикція
│   ├── SensitiveDataContext.tsx   # НОВИЙ: Sensitive toggle
│   └── LanguageContext.tsx        # НОВИЙ: UK/EN
│
├── components/
│   ├── layout/
│   │   ├── UnifiedLayout.tsx      # Головний layout
│   │   ├── Sidebar.tsx            # Role-aware sidebar
│   │   ├── TopBar.tsx             # З mode switcher
│   │   └── DisplayModeSwitcher.tsx
│   │
│   ├── guards/
│   │   ├── RoleGuard.tsx          # Role-based rendering
│   │   ├── PremiumGuard.tsx       # Premium-only wrapper
│   │   └── AdminGuard.tsx         # Admin-only wrapper
│   │
│   ├── client/                    # CLIENT COMPONENTS
│   │   ├── Overview/
│   │   ├── Search/
│   │   ├── Trends/
│   │   ├── Newspaper/
│   │   ├── Reports/
│   │   └── Profile/
│   │
│   ├── premium/                   # PREMIUM COMPONENTS (lazy-loaded)
│   │   ├── Dashboards/
│   │   ├── VisualAnalytics/
│   │   ├── Relations/
│   │   ├── Timelines/
│   │   └── OpenSearch/
│   │
│   ├── admin/                     # ADMIN COMPONENTS
│   │   ├── SystemStatus/
│   │   ├── Infrastructure/
│   │   ├── Services/
│   │   ├── Models/
│   │   ├── UsersRoles/
│   │   ├── Jurisdictions/
│   │   └── AuditLogs/
│   │
│   └── shared/
│       ├── SensitiveDataToggle.tsx
│       ├── UpgradePrompt.tsx
│       └── AccessDenied.tsx
│
├── hooks/
│   ├── useRole.ts
│   ├── useDisplayMode.ts
│   ├── useJurisdiction.ts
│   ├── useSensitiveData.ts
│   └── useFeatureFlag.ts
│
├── i18n/
│   ├── uk.json                    # Українська (primary)
│   └── en.json                    # English (optional)
│
└── services/
    ├── api.ts
    ├── auth.ts
    └── audit.ts                   # Logging sensitive access
```

### 3.2 Ключові компоненти

#### RoleGuard.tsx
```typescript
// src/components/guards/RoleGuard.tsx

import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/config/roles';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
  showUpgrade = false,
}) => {
  const { role, capabilities } = useRole();

  if (!allowedRoles.includes(role)) {
    if (showUpgrade && role === UserRole.CLIENT_BASIC) {
      return <UpgradePrompt />;
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

#### SensitiveDataToggle.tsx
```typescript
// src/components/shared/SensitiveDataToggle.tsx

import { useSensitiveData } from '@/hooks/useSensitiveData';
import { useAudit } from '@/hooks/useAudit';

export const SensitiveDataToggle: React.FC = () => {
  const { isEnabled, setEnabled, acknowledged, setAcknowledged } = useSensitiveData();
  const { logSensitiveAccess } = useAudit();

  const handleToggle = () => {
    if (!isEnabled && !acknowledged) {
      // Show acknowledgment modal first
      return;
    }

    const newState = !isEnabled;
    setEnabled(newState);
    logSensitiveAccess({
      action: newState ? 'ENABLED' : 'DISABLED',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
      <input
        type="checkbox"
        checked={isEnabled}
        onChange={handleToggle}
        className="toggle toggle-warning"
      />
      <span className="text-sm text-amber-200">
        Показувати розширені дані (юридична відповідальність підтверджена)
      </span>
    </div>
  );
};
```

#### DisplayModeSwitcher.tsx
```typescript
// src/components/layout/DisplayModeSwitcher.tsx

import { useDisplayMode } from '@/hooks/useDisplayMode';
import { DisplayMode } from '@/context/DisplayModeContext';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

export const DisplayModeSwitcher: React.FC = () => {
  const { mode, setMode } = useDisplayMode();

  const modes = [
    { id: DisplayMode.DESKTOP, icon: Monitor, label: 'Комп\'ютер' },
    { id: DisplayMode.TABLET, icon: Tablet, label: 'Планшет' },
    { id: DisplayMode.MOBILE, icon: Smartphone, label: 'Телефон' },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setMode(id)}
          className={`p-2 rounded-md transition-all ${
            mode === id
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
          title={label}
        >
          <Icon size={18} />
        </button>
      ))}
    </div>
  );
};
```

---

## 📋 ЧАСТИНА 4: ПЛАН ВПРОВАДЖЕННЯ

### Фаза 1: Підготовка (2-3 дні)

| # | Завдання | Файли | Пріоритет |
|---|----------|-------|-----------|
| 1.1 | Створити нову систему ролей | `src/config/roles.ts` | 🔴 HIGH |
| 1.2 | Створити RoleContext | `src/context/RoleContext.tsx` | 🔴 HIGH |
| 1.3 | Створити DisplayModeContext | `src/context/DisplayModeContext.tsx` | 🔴 HIGH |
| 1.4 | Створити JurisdictionContext | `src/context/JurisdictionContext.tsx` | 🟡 MED |
| 1.5 | Створити конфіг навігації | `src/config/navigation.ts` | 🔴 HIGH |
| 1.6 | Повна локалізація UK | `src/i18n/uk.json` | 🟡 MED |

### Фаза 2: Layout та Guards (2-3 дні)

| # | Завдання | Файли | Пріоритет |
|---|----------|-------|-----------|
| 2.1 | UnifiedLayout | `src/components/layout/UnifiedLayout.tsx` | 🔴 HIGH |
| 2.2 | Role-aware Sidebar | `src/components/layout/Sidebar.tsx` | 🔴 HIGH |
| 2.3 | TopBar з DisplayModeSwitcher | `src/components/layout/TopBar.tsx` | 🔴 HIGH |
| 2.4 | RoleGuard | `src/components/guards/RoleGuard.tsx` | 🔴 HIGH |
| 2.5 | PremiumGuard | `src/components/guards/PremiumGuard.tsx` | 🔴 HIGH |
| 2.6 | AdminGuard | `src/components/guards/AdminGuard.tsx` | 🟡 MED |

### Фаза 3: Client Views (3-4 дні)

| # | Завдання | Опис |
|---|----------|------|
| 3.1 | Overview | Загальна сторінка для всіх клієнтів |
| 3.2 | Search | Пошук з обмеженнями для basic |
| 3.3 | Trends | Тренди (basic: загальні, premium: деталізовані) |
| 3.4 | MorningNewspaper | Ранкова газета (basic: коротка, premium: повна) |
| 3.5 | Reports | Текстові звіти |
| 3.6 | Profile | Профіль користувача |

### Фаза 4: Premium Views (4-5 днів)

| # | Завдання | Lazy-load | Опис |
|---|----------|-----------|------|
| 4.1 | Dashboards | ✅ | Все візуальне аналітичне |
| 4.2 | VisualAnalytics | ✅ | Графіки, діаграми |
| 4.3 | Relations | ✅ | Графи зв'язків |
| 4.4 | Timelines | ✅ | Часові лінії подій |
| 4.5 | OpenSearchEmbed | ✅ | Embedded OpenSearch Dashboards |
| 4.6 | SensitiveDataToggle | ✅ | Перемикач чутливих даних |

### Фаза 5: Admin Views (3-4 дні)

| # | Завдання | Опис |
|---|----------|------|
| 5.1 | SystemStatus | Стан системи (ребренд MonitoringView) |
| 5.2 | Infrastructure | Docker, сервери, мережа |
| 5.3 | Services | Мікросервіси, health checks |
| 5.4 | Models | ML моделі, LLM |
| 5.5 | UsersRoles | Управління користувачами |
| 5.6 | Jurisdictions | Управління юрисдикціями |
| 5.7 | AuditLogs | Журнали аудиту |

### Фаза 6: Тестування та Деплой (2-3 дні)

| # | Завдання |
|---|----------|
| 6.1 | Unit tests для guards |
| 6.2 | Integration tests для role switching |
| 6.3 | E2E тест: basic user flow |
| 6.4 | E2E тест: premium user flow |
| 6.5 | E2E тест: admin user flow |
| 6.6 | Performance audit (bundle size) |
| 6.7 | Production deploy |

---

## 🔒 ЧАСТИНА 5: БЕЗПЕКА

### 5.1 Frontend Enforcement

```typescript
// ПРАВИЛО: Ніколи не рендерити заборонені компоненти

// ❌ НЕПРАВИЛЬНО
<DashboardPanel disabled={!isPremium} />

// ✅ ПРАВИЛЬНО
{isPremium && <DashboardPanel />}

// АБО через guard
<PremiumGuard>
  <DashboardPanel />
</PremiumGuard>
```

### 5.2 Backend Enforcement (API)

```yaml
API Scopes:
  /api/v1/client/*:
    - client_basic: read (limited fields)
    - client_premium: read (all fields + sensitive via toggle)

  /api/v1/analytics/*:
    - client_basic: DENIED
    - client_premium: read

  /api/v1/admin/*:
    - client_*: DENIED
    - admin: full access
```

### 5.3 Sensitive Data Logging

```typescript
interface SensitiveAccessLog {
  user_id: string;
  action: 'ENABLED' | 'DISABLED' | 'VIEWED_FIELD';
  field_type?: string;
  jurisdiction: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
}

// Всі перемикачі логуються в Truth Ledger
```

---

## 📊 ЧАСТИНА 6: МЕТРИКИ УСПІХУ

### 6.1 Технічні критерії

| Критерій | Ціль | Перевірка |
|----------|------|-----------|
| Basic user не бачить дашборди | 100% | E2E тест |
| Premium user бачить upgrade value | Чітко | UX review |
| Admin UI повністю ізольований | 100% | E2E тест |
| Desktop UX повний | 100% | Manual QA |
| Мова проста, неформальна | 100% | Copy review |
| Bundle size (basic) | < 500KB | Webpack analysis |
| Bundle size (premium) | < 1.5MB | Webpack analysis |
| First paint | < 1.5s | Lighthouse |

### 6.2 Бізнес-критерії

| Критерій | Метрика |
|----------|---------|
| Conversion basic→premium | Track via analytics |
| Time to first insight | < 30 sec |
| User satisfaction | NPS survey |

---

## 🛠️ ЧАСТИНА 7: ТЕХНІЧНИЙ СТЕК

### Підтверджено (без змін):
- ✅ React 18
- ✅ TypeScript
- ✅ Tailwind CSS (dark theme)
- ✅ Vite

### Потрібно додати/оновити:
- 🆕 Zustand (замість розрізнених Context)
- 🆕 React Query (для API caching)
- 🆕 React Router v6 (role-based routing)
- 🆕 i18next (для локалізації)

### Backend (тільки інтеграція):
- FastAPI (існує)
- JWT Auth (існує, потрібно додати role claims)
- API scopes (потрібно імплементувати)

---

## 📎 ДОДАТКИ

### Додаток A: Mapping старих ролей на нові

| Стара роль | Нова роль | Примітка |
|------------|-----------|----------|
| EXPLORER (FREE) | client_basic | |
| EXPLORER (PRO) | client_premium | |
| OPERATOR | client_premium | Merge |
| COMMANDER | admin | Якщо системний адмін |
| COMMANDER | client_premium | Якщо аналітик |

### Додаток B: Видалені/замінені views

| Старий view | Дія |
|-------------|-----|
| ExplorerShell | ВИДАЛИТИ (замінити на UnifiedLayout) |
| OperatorShell | ВИДАЛИТИ |
| CommanderShell | ВИДАЛИТИ |
| ShellContext | ВИДАЛИТИ |
| ShellSwitcher | ВИДАЛИТИ |

### Додаток C: Перейменування views

| Старий view | Новий view | Роль |
|-------------|------------|------|
| MonitoringView | SystemStatus | admin |
| SecurityView | → admin/Security | admin |
| SettingsView | → admin/Settings | admin |
| AgentsView | → admin/Agents | admin |
| DeploymentView | → admin/Deployment | admin |
| CasesView | → client/Cases | client_* |
| SearchConsole | → client/Search | client_* |

---

## ✅ ВИСНОВОК

Це ТЗ визначає повну трансформацію UI Predator Analytics з multi-shell архітектури на unified role-gated app.

**Ключові переваги:**
1. Одна кодова база, менше дублювання
2. Чіткий поділ клієнтів і адмінів
3. Premium value чітко відчувається
4. Desktop-first UX
5. 100% українська мова

**Орієнтовний термін:** 15-20 робочих днів

**Наступний крок:** Затвердження ТЗ та початок Фази 1.

---

*Документ підготовлено: 2026-01-13*
*Версія: 2.0*
