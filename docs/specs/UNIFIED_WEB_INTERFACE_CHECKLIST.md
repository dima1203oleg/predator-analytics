# ✅ UNIFIED WEB INTERFACE - IMPLEMENTATION CHECKLIST

**Документ:** Чекліст впровадження
**Версія:** 1.0
**Дата старту:** ___________
**Дата завершення:** ___________

---

## 🔴 ФАЗА 1: ПІДГОТОВКА (Days 1-3)

### 1.1 Нова система ролей
- [ ] Створити `src/config/roles.ts`
  - [ ] Enum `UserRole` (client_basic, client_premium, admin)
  - [ ] Interface `RoleCapabilities`
  - [ ] Const `ROLE_CAPABILITIES` mapping

### 1.2 Contexts
- [ ] Створити `src/context/RoleContext.tsx`
  - [ ] `RoleProvider` component
  - [ ] `useRole()` hook
  - [ ] Integration з auth
- [ ] Створити `src/context/DisplayModeContext.tsx`
  - [ ] Enum `DisplayMode` (desktop, tablet, mobile)
  - [ ] `DisplayModeProvider`
  - [ ] `useDisplayMode()` hook
  - [ ] Local storage persistence
- [ ] Створити `src/context/JurisdictionContext.tsx`
  - [ ] Jurisdiction types (UA, EU, INTL)
  - [ ] Field visibility rules
- [ ] Створити `src/context/SensitiveDataContext.tsx`
  - [ ] Toggle state
  - [ ] Acknowledgment state
  - [ ] Audit logging integration

### 1.3 Navigation Config
- [ ] Створити `src/config/navigation.ts`
  - [ ] Client section items
  - [ ] Premium section items
  - [ ] Admin section items
  - [ ] Icons mapping

### 1.4 Локалізація
- [ ] Створити `src/i18n/uk.json`
  - [ ] Navigation labels
  - [ ] Common UI elements
  - [ ] Error messages
  - [ ] Prompts and notifications
- [ ] Створити `src/i18n/en.json` (optional)
- [ ] Інтегрувати i18next

---

## 🟡 ФАЗА 2: LAYOUT ТА GUARDS (Days 4-6)

### 2.1 Unified Layout
- [ ] Створити `src/components/layout/UnifiedLayout.tsx`
  - [ ] Role-aware structure
  - [ ] DisplayMode-responsive
  - [ ] Header + Sidebar + Main area
- [ ] Створити `src/components/layout/Sidebar.tsx`
  - [ ] Dynamic items based on role
  - [ ] Collapsible on tablet/mobile
  - [ ] Active state indication
- [ ] Створити `src/components/layout/TopBar.tsx`
  - [ ] User info
  - [ ] DisplayModeSwitcher
  - [ ] Notifications (optional)
  - [ ] Language switcher (optional)
- [ ] Створити `src/components/layout/DisplayModeSwitcher.tsx`
  - [ ] Desktop/Tablet/Mobile buttons
  - [ ] Visual indication

### 2.2 Guards
- [ ] Створити `src/components/guards/RoleGuard.tsx`
  - [ ] `allowedRoles` prop
  - [ ] `fallback` prop
  - [ ] `showUpgrade` prop
- [ ] Створити `src/components/guards/PremiumGuard.tsx`
  - [ ] Wrapper for premium-only content
  - [ ] UpgradePrompt integration
- [ ] Створити `src/components/guards/AdminGuard.tsx`
  - [ ] Strict admin-only wrapper
  - [ ] AccessDenied fallback

### 2.3 Shared Components
- [ ] Створити `src/components/shared/UpgradePrompt.tsx`
  - [ ] Premium benefits list
  - [ ] CTA button
- [ ] Створити `src/components/shared/AccessDenied.tsx`
  - [ ] Clear message
  - [ ] Navigation back
- [ ] Створити `src/components/shared/SensitiveDataToggle.tsx`
  - [ ] Checkbox with label
  - [ ] Acknowledgment modal
  - [ ] Audit logging

### 2.4 Router Update
- [ ] Оновити `src/app/Router.tsx`
  - [ ] Role-based route protection
  - [ ] Lazy loading for premium routes
  - [ ] Admin route isolation

---

## 🟢 ФАЗА 3: CLIENT VIEWS (Days 7-10)

### 3.1 Overview (всі клієнти)
- [ ] Створити `src/components/client/Overview/index.tsx`
  - [ ] Welcome section
  - [ ] Quick stats (role-appropriate)
  - [ ] Recent activity
  - [ ] Quick links

### 3.2 Search (всі клієнти, різна глибина)
- [ ] Створити `src/components/client/Search/index.tsx`
  - [ ] Search input
  - [ ] Filters (premium: more filters)
  - [ ] Results list
  - [ ] Result detail (premium: full details)
- [ ] Мігрувати логіку з `SearchConsole.tsx`

### 3.3 Trends (всі клієнти, різна деталізація)
- [ ] Створити `src/components/client/Trends/index.tsx`
  - [ ] Basic: загальні тренди
  - [ ] Premium: сегментовані тренди
- [ ] Створити `TrendCard.tsx`
- [ ] Створити `TrendChart.tsx` (premium only)

### 3.4 Morning Newspaper
- [ ] Створити `src/components/client/Newspaper/index.tsx`
  - [ ] Basic: короткий огляд (3-5 stories)
  - [ ] Premium: повна версія (10+ stories)
  - [ ] Deep insights (premium)
- [ ] Створити `NewspaperArticle.tsx`
- [ ] Створити `InsightCard.tsx` (premium)

### 3.5 Reports
- [ ] Створити `src/components/client/Reports/index.tsx`
  - [ ] Report list
  - [ ] Report detail view
  - [ ] Download options

### 3.6 Profile
- [ ] Створити `src/components/client/Profile/index.tsx`
  - [ ] User info
  - [ ] Subscription status
  - [ ] Preferences
  - [ ] Upgrade button (for basic)

---

## 🔵 ФАЗА 4: PREMIUM VIEWS (Days 11-15)

### 4.1 Dashboards
- [ ] Створити `src/components/premium/Dashboards/index.tsx`
  - [ ] Dashboard grid
  - [ ] Widget components
  - [ ] Customization (optional)
- [ ] Lazy load: `React.lazy()` + `Suspense`

### 4.2 Visual Analytics
- [ ] Створити `src/components/premium/VisualAnalytics/index.tsx`
  - [ ] Charts container
  - [ ] Filter panel
  - [ ] Data visualization
- [ ] Мігрувати з `AnalyticsView.tsx`
- [ ] Lazy load

### 4.3 Relations Graph
- [ ] Створити `src/components/premium/Relations/index.tsx`
  - [ ] Network graph visualization
  - [ ] Entity details panel
  - [ ] Filtering
- [ ] Lazy load

### 4.4 Timelines
- [ ] Створити `src/components/premium/Timelines/index.tsx`
  - [ ] Horizontal timeline
  - [ ] Event details
  - [ ] Zoom controls
- [ ] Lazy load

### 4.5 OpenSearch Embed
- [ ] Створити `src/components/premium/OpenSearch/index.tsx`
  - [ ] Iframe container
  - [ ] Auth passthrough
  - [ ] Responsive sizing
- [ ] Lazy load

### 4.6 Sensitive Data Toggle Integration
- [ ] Додати toggle до всіх premium views
- [ ] Implement field masking logic
- [ ] Test audit logging

---

## 🟣 ФАЗА 5: ADMIN VIEWS (Days 16-19)

### 5.1 System Status
- [ ] Створити `src/components/admin/SystemStatus/index.tsx`
  - [ ] Service health cards
  - [ ] Resource usage
  - [ ] Alerts
- [ ] Мігрувати з `MonitoringView.tsx`

### 5.2 Infrastructure
- [ ] Створити `src/components/admin/Infrastructure/index.tsx`
  - [ ] Docker containers
  - [ ] Servers
  - [ ] Network

### 5.3 Services
- [ ] Створити `src/components/admin/Services/index.tsx`
  - [ ] Microservice list
  - [ ] Health checks
  - [ ] Restart controls

### 5.4 Models
- [ ] Створити `src/components/admin/Models/index.tsx`
  - [ ] ML models
  - [ ] LLM status
  - [ ] Training jobs
- [ ] Мігрувати з `LLMView.tsx`, `NasView.tsx`

### 5.5 Users & Roles
- [ ] Створити `src/components/admin/UsersRoles/index.tsx`
  - [ ] User list
  - [ ] Role assignment
  - [ ] Permission management
- [ ] Мігрувати з `SecurityView.tsx`

### 5.6 Jurisdictions
- [ ] Створити `src/components/admin/Jurisdictions/index.tsx`
  - [ ] Jurisdiction list
  - [ ] Field visibility rules
  - [ ] Create/Edit forms

### 5.7 Audit Logs
- [ ] Створити `src/components/admin/AuditLogs/index.tsx`
  - [ ] Log table
  - [ ] Filters
  - [ ] Export
- [ ] Мігрувати з `ActivityView.tsx`

---

## ⚫ ФАЗА 6: CLEANUP & TESTING (Days 20-22)

### 6.1 Видалити застаріле
- [ ] Видалити `ExplorerShell.tsx`
- [ ] Видалити `OperatorShell.tsx`
- [ ] Видалити `CommanderShell.tsx`
- [ ] Видалити `ShellContext.tsx`
- [ ] Видалити `ShellSwitcher.tsx`
- [ ] Оновити `App.tsx` (використовувати UnifiedLayout)

### 6.2 Unit Tests
- [ ] Test `RoleGuard` component
- [ ] Test `useRole` hook
- [ ] Test `useDisplayMode` hook
- [ ] Test navigation config

### 6.3 Integration Tests
- [ ] Test role switching
- [ ] Test display mode switching
- [ ] Test sensitive data toggle

### 6.4 E2E Tests
- [ ] Scenario: client_basic user flow
- [ ] Scenario: client_premium user flow
- [ ] Scenario: admin user flow
- [ ] Scenario: upgrade prompt flow

### 6.5 Performance
- [ ] Run Lighthouse audit
- [ ] Check bundle sizes
- [ ] Verify lazy loading works
- [ ] Check first paint time

---

## 🚀 ФАЗА 7: DEPLOYMENT

### 7.1 Staging
- [ ] Deploy to staging environment
- [ ] Full QA pass
- [ ] Fix critical issues

### 7.2 Production
- [ ] Create backup of current UI
- [ ] Deploy new UI
- [ ] Smoke test
- [ ] Monitor errors

### 7.3 Documentation
- [ ] Update README
- [ ] Update API docs
- [ ] Update user guide

---

## 📊 PROGRESS TRACKER

| Фаза | Статус | Дата початку | Дата завершення |
|------|--------|--------------|-----------------|
| Фаза 1: Підготовка | ⬜ TODO | | |
| Фаза 2: Layout | ⬜ TODO | | |
| Фаза 3: Client Views | ⬜ TODO | | |
| Фаза 4: Premium Views | ⬜ TODO | | |
| Фаза 5: Admin Views | ⬜ TODO | | |
| Фаза 6: Testing | ⬜ TODO | | |
| Фаза 7: Deployment | ⬜ TODO | | |

**Легенда:**
- ⬜ TODO
- 🟨 IN PROGRESS
- ✅ DONE
- ❌ BLOCKED

---

*Чекліст створено: 2026-01-13*
