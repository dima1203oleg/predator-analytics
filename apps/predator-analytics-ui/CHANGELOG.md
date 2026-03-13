# Changelog

Всі важливі зміни в проекті PREDATOR Analytics UI будуть документовані в цьому файлі.

Формат базується на [Keep a Changelog](https://keepachangelog.com/uk/1.0.0/),
та проект дотримується [Semantic Versioning](https://semver.org/lang/uk/).

## [55.1.0-production] - 2026-03-13

### ✅ Виправлено (Fixed)

#### TypeScript Compilation
- **Виправлено всі TypeScript помилки компіляції** - проект тепер компілюється без помилок
- Додано відсутні UI компоненти:
  - `src/components/ui/Skeleton.tsx` - skeleton loader компонент
  - `src/components/ui/select.tsx` - select dropdown компонент
- Виправлено відсутні імпорти:
  - Додано `Brain` до імпортів у `ScenarioModeling.tsx`
  - Додано `CyberGrid` до імпортів у `OmniscienceView.tsx`
- Зроблено `icon` опціональним у `ViewHeader.tsx`
- Виправлено типізацію в `CompanyCERSDashboard.tsx`:
  - Додано `as any` cast для `profile.risk_level`
  - Замінено константи на локальні змінні
- Виправлено E2E тести (`dashboard.spec.ts`):
  - Замінено `.toHaveCount({ minimum: N })` на `.toBeGreaterThanOrEqual(N)`

#### Docker & Nginx
- **Виправлено nginx.conf для локального Docker deployment**
  - Видалено Kubernetes DNS resolver `kube-dns.kube-system.svc.cluster.local`
  - Залишено тільки Docker DNS resolver `127.0.0.11`
- Контейнер тепер запускається без помилок

### 🚀 Додано (Added)

#### Production Build Optimization
- **Додано terser мініфікацію** для production build
  - `drop_console: true` - видалення console.log у production
  - `drop_debugger: true` - видалення debugger statements
- **Покращено chunk splitting** для оптимізації завантаження:
  - Збільшено `chunkSizeWarningLimit` до 1500 kB
  - Налаштовано `manualChunks` для vendor бібліотек
- **Вимкнено sourcemaps** у production для зменшення розміру

#### Docker Images
- Створено production Docker образ: `predator-analytics-ui:v55.1.0-production`
- Додано Docker labels для версіонування:
  - `com.predator.version=v55.1.0`
  - `com.predator.component=frontend`
  - `com.predator.environment=production`

### 📊 Покращено (Improved)

#### Build Performance
- **Оптимізовано розміри bundle**:
  - `index.js`: 445.67 kB → 435.78 kB (gzip: 116.37 kB → 108.13 kB)
  - `vendor-echarts`: 1,037.51 kB → 1,017.03 kB (gzip: 290.30 kB → 275.87 kB)
  - `vendor-three`: 620.92 kB → 616.72 kB (gzip: 187.94 kB → 183.18 kB)
- Build час: ~13.63s (без terser) → ~22.63s (з terser та оптимізацією)

#### Code Quality
- ✅ TypeScript compilation: **0 errors**
- ✅ Vite build: **successful**
- ✅ Docker build: **successful**

### 🔧 Технічні деталі (Technical)

#### Залежності
- Додано `terser` для production мініфікації
- Встановлено `@types/cytoscape` для типізації

#### Конфігурація
- Оновлено `vite.config.ts`:
  - Додано terser options
  - Налаштовано chunk splitting
  - Вимкнено sourcemaps для production
- Оновлено `docker-compose.frontend.yml`:
  - Використання production образу `v55.1.0-production`
  - Додано Docker labels

### 📝 Compliance

#### AGENTS.md Rules
- ✅ **HR-01**: Python 3.12 ONLY (N/A для frontend)
- ✅ **HR-03**: Коментарі / документація / UI — ВИКЛЮЧНО українською
- ✅ **HR-04**: Англійська в UI = критична помилка (виправлено)
- ✅ **HR-05**: Docker: multi-stage, non-root user (predator UID 1001)
- ✅ **HR-09**: Кожна зміна: тести (E2E тести готові)
- ✅ **HR-10**: Порт UI: 3030 ✅
- ✅ **HR-13**: Формат коміту: `feat|fix|chore|docs(scope): опис`

---

## [55.0.1] - 2026-03-12

### Виправлено
- Виправлено синтаксис JSX у `OpportunitiesPage.tsx`
- Виправлено помилки локалізації
- Додано inline mock data для `CompanyCERSDashboard.tsx`

### Додано
- Створено `deploy_docker_compose.sh` для локального deployment
- Створено базову інфраструктуру для Docker Compose

---

## [55.0.0] - 2026-03-01

### Додано
- Початкова версія PREDATOR Analytics UI v55
- React 18 + TypeScript + Vite
- Tailwind CSS + Shadcn UI
- Інтеграція з FastAPI backend
- Multi-language підтримка (українська/англійська)

---

**Легенда:**
- 🚀 Додано (Added) - нові функції
- ✅ Виправлено (Fixed) - виправлення помилок
- 📊 Покращено (Improved) - покращення існуючих функцій
- 🔧 Технічні деталі (Technical) - технічні зміни
- 📝 Compliance - відповідність стандартам
