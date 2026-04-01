# 🦅 PREDATOR Analytics UI v55.1.0

> Преміальний OSINT-інтерфейс для митної аналітики України

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

---

## 📋 Зміст

- [Про проект](#про-проект)
- [Технології](#технології)
- [Швидкий старт](#швидкий-старт)
- [Розробка](#розробка)
- [Production Deployment](#production-deployment)
- [Структура проекту](#структура-проекту)
- [Документація](#документація)

---

## 🎯 Про проект

**PREDATOR Analytics UI** — це сучасний веб-інтерфейс для OSINT-платформи митної аналітики України. Система забезпечує:

- 🔍 **Аналітика ризиків** — CERS scoring, SHAP decomposition
- 🌐 **Entity Graph** — візуалізація зв'язків компаній та осіб
- 🤖 **AI Copilot** — інтелектуальний асистент для аналітиків
- 📊 **Real-time моніторинг** — система метрик та алертів
- 🛡️ **Безпека** — RLS, RBAC, audit logging

### Ключові можливості

- ✅ **100% українізація** — весь UI українською мовою (HR-03, HR-04)
- ✅ **Production-ready** — TypeScript без помилок, оптимізований build
- ✅ **Docker-first** — multi-stage build, non-root user (HR-05)
- ✅ **Modern stack** — React 18, TypeScript 5, Vite 5, Tailwind CSS
- ✅ **Performance** — chunk splitting, terser мініфікація, gzip compression

---

## 🛠 Технології

### Core Stack

| Категорія | Технологія | Версія |
|-----------|------------|--------|
| **Framework** | React | 18.3 |
| **Build Tool** | Vite | 5.4 |
| **Language** | TypeScript | 5.3 |
| **Styling** | Tailwind CSS | 3.4 |
| **Components** | Shadcn UI | latest |
| **State** | Zustand | 5.0 |
| **Routing** | React Router | 6.26 |
| **HTTP** | Axios | 1.7 |

### Visualization

| Призначення | Бібліотека | Версія |
|-------------|------------|--------|
| **Charts** | Recharts | 2.12 |
| **Advanced Charts** | ECharts | 5.5 |
| **3D Graphics** | Three.js + React Three Fiber | 8.17 |
| **Network Graphs** | Cytoscape.js | 3.30 |
| **Animation** | Framer Motion | 11.5 |

### Development

| Інструмент | Призначення |
|------------|-------------|
| **ESLint** | Linting |
| **Prettier** | Code formatting |
| **Playwright** | E2E testing |
| **Vitest** | Unit testing |

### Infrastructure

- **Docker**: Multi-stage build, Alpine Linux
- **Nginx**: Reverse proxy, caching, gzip
- **Kubernetes**: Helm charts, ArgoCD GitOps

---

## 🚀 Швидкий старт

### Вимоги

- **Node.js**: 20.x
- **Docker**: 24.x+ (рекомендовано)
- **npm**: 10.x

### Локальний запуск (Docker Compose)

```bash
# 1. Клонувати репозиторій
git clone https://github.com/dima1203oleg/predator-analytics.git
cd predator-analytics

# 2. Запустити фронтенд
docker-compose -f docker-compose.frontend.yml up -d

# 3. Відкрити в браузері
open http://localhost:3030
```

### Локальний запуск (Development)

```bash
# 1. Перейти до директорії UI
cd apps/predator-analytics-ui

# 2. Встановити залежності
npm ci

# 3. Запустити dev сервер
npm run dev

# 4. Відкрити http://localhost:3030
```

---

## 💻 Розробка

### Доступні команди

```bash
# Development сервер (порт 3030)
npm run dev

# TypeScript перевірка
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview

# Lint код
npm run lint

# E2E тести
npx playwright test

# E2E тести з UI
npx playwright test --ui
```

### Структура проекту

```
apps/predator-analytics-ui/
├── src/
│   ├── components/        # React компоненти
│   │   ├── ui/           # Базові UI компоненти (Shadcn)
│   │   ├── ai/           # AI Copilot компоненти
│   │   ├── graph/        # Graph visualization
│   │   └── premium/      # Premium features
│   ├── views/            # Сторінки (Pages)
│   ├── services/         # API clients
│   ├── store/            # Zustand state management
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── locales/          # i18n (українська/англійська)
│   └── types/            # TypeScript types
├── e2e/                  # Playwright E2E тести
├── public/               # Static assets
├── dist/                 # Production build output
├── Dockerfile            # Multi-stage Docker build
├── nginx.conf            # Nginx конфігурація
├── vite.config.ts        # Vite конфігурація
├── tsconfig.json         # TypeScript конфігурація
├── tailwind.config.js    # Tailwind CSS конфігурація
└── package.json          # Dependencies
```

### Coding Standards

#### TypeScript
- ✅ Strict mode enabled
- ✅ No implicit `any`
- ✅ Explicit return types для функцій
- ✅ Proper typing для props та state

#### React
- ✅ Functional components з hooks
- ✅ TypeScript для всіх компонентів
- ✅ Proper prop validation
- ✅ Мемоізація для performance

#### Styling
- ✅ Tailwind CSS utility classes
- ✅ Shadcn UI компоненти
- ✅ Responsive design (mobile-first)
- ✅ Dark theme підтримка

#### Git Commits
```bash
# Формат: feat|fix|chore|docs(scope): опис
git commit -m "feat(dashboard): додати CERS scoring widget"
git commit -m "fix(graph): виправити memory leak в cytoscape"
git commit -m "chore(deps): оновити React до 18.3"
```

---

## 🏭 Production Deployment

### Docker Build

```bash
# Побудувати production образ
docker build -t predator-analytics-ui:v55.1.0-production .

# Запустити контейнер
docker run -d \
  --name predator-frontend \
  -p 3030:3030 \
  -e API_UPSTREAM=http://your-api-server:8000 \
  predator-analytics-ui:v55.1.0-production
```

### Kubernetes Deployment

```bash
# Встановити через Helm
helm install predator-frontend deploy/helm/predator \
  --namespace predator \
  --set frontend.image.tag=v55.1.0-production

# Або через ArgoCD
kubectl apply -f deploy/argocd/predator/frontend.yaml
```

### Environment Variables

```bash
# Runtime upstream для nginx усередині контейнера
API_UPSTREAM=http://host.docker.internal:9080

# Feature Flags (опціонально)
VITE_ENABLE_AI_COPILOT=true
VITE_ENABLE_GRAPH_3D=true
```

### Production Checklist

- [ ] TypeScript компіляція без помилок
- [ ] Vite build успішний
- [ ] E2E тести пройдені
- [ ] Docker образ побудований
- [ ] Health checks працюють
- [ ] Environment variables налаштовані
- [ ] SSL/TLS сертифікати налаштовані
- [ ] Backup стратегія визначена

---

## 📊 Performance Metrics

### Bundle Sizes (Production)

```
Total size: ~2.8 MB (gzipped: ~800 KB)

Largest chunks:
- vendor-echarts:  1,017 kB (gzip: 276 kB)
- vendor-three:      617 kB (gzip: 183 kB)
- index:             436 kB (gzip: 108 kB)
- vendor-recharts:   162 kB (gzip:  53 kB)
- vendor-react:      162 kB (gzip:  33 kB)
```

### Optimizations

- ✅ **Terser мініфікація** — `drop_console`, `drop_debugger`
- ✅ **Chunk splitting** — vendor бібліотеки розділені
- ✅ **Gzip compression** — Nginx рівень
- ✅ **Code splitting** — lazy loading для routes
- ✅ **Tree shaking** — unused code видалено

### Lighthouse Score (Target)

- 🎯 **Performance**: 90+
- 🎯 **Accessibility**: 95+
- 🎯 **Best Practices**: 95+
- 🎯 **SEO**: 90+

---

## 📚 Документація

### Основна документація

- [CHANGELOG.md](./CHANGELOG.md) — Історія змін
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Інструкції з deployment
- [AGENTS.md](../../AGENTS.md) — Правила розробки для ШІ-агентів

### API Documentation

- Backend API: `http://localhost:8000/docs` (Swagger)
- GraphQL: `http://localhost:8000/graphql` (GraphiQL)

### Додаткові ресурси

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)

---

## 🤝 Contributing

### Workflow

1. Створити feature branch: `git checkout -b feat/my-feature`
2. Зробити зміни та commit: `git commit -m "feat(scope): опис"`
3. Push до GitHub: `git push origin feat/my-feature`
4. Створити Pull Request
5. Дочекатися code review та CI/CD checks
6. Merge після approval

### Code Review Checklist

- [ ] TypeScript без помилок
- [ ] Тести пройдені
- [ ] Код відповідає style guide
- [ ] Коментарі українською (HR-03)
- [ ] UI тексти українською (HR-04)
- [ ] Документація оновлена
- [ ] CHANGELOG.md оновлено

---

## 📝 License

**Proprietary** — PREDATOR Analytics © 2026

Всі права захищені. Використання, копіювання, модифікація та розповсюдження цього програмного забезпечення без письмового дозволу власника заборонено.

---

## 📞 Контакти

- **Email**: support@predator-analytics.ua
- **GitHub**: [dima1203oleg/predator-analytics](https://github.com/dima1203oleg/predator-analytics)
- **Documentation**: [docs.predator-analytics.ua](https://docs.predator-analytics.ua)

---

## 🎖️ Compliance

### AGENTS.md Rules

- ✅ **HR-03**: Коментарі / документація / UI — ВИКЛЮЧНО українською
- ✅ **HR-04**: Англійська в UI = критична помилка
- ✅ **HR-05**: Docker: multi-stage, non-root user (predator UID 1001)
- ✅ **HR-09**: Кожна зміна: тести
- ✅ **HR-10**: Порт UI: 3030
- ✅ **HR-13**: Формат коміту: `feat|fix|chore|docs(scope): опис`

---

**Версія**: v55.1.0-production  
**Build Date**: 2026-03-13  
**Status**: ✅ Production Ready
