# 🎨 FRONTEND AUDIT: Маппінг views → 4 режими UI v4.2.0

> **Дата аудиту:** 7 березня 2026
> **Файлів:** 68 views, 261 компонентів (40 root + 53 premium + 10 layout + ~158 у підпапках)
> **Висновок:** Є розвинутий UI, потребує реорганізації в 4 canonical режими

---

## 1. ІСНУЮЧІ VIEWS → РЕЖИМИ v4.2.0

### 📊 РЕЖИМ «РИНОК» (COMP-156 MarketPage)

> Об'єднує існуючі views, що відповідають за ринкову аналітику, конкурентів, митниці

| Існуючий view | Розмір | Що взяти | Пріоритет |
|--------------|--------|---------|-----------|
| `DashboardView.tsx` | 27KB | KPI cards, overview layout | P0 |
| `AnalyticsView.tsx` | 37KB | Charts, analytics panels | P0 |
| `CustomsIntelligenceView.tsx` | 20KB | Customs table, filters | P0 |
| `CustomsIntelligencePremium.tsx` | 23KB | Premium customs features | P1 |
| `CompetitorIntelligenceView.tsx` | 24KB | Competitor radar table | P0 |
| `MarketAnalyticsPremium.tsx` | 24KB | Market charts, heatmaps | P1 |
| `TradeFlowMapPremium.tsx` | 16KB | Trade flow map | P1 |
| `SupplierDiscoveryPremium.tsx` | 17KB | Supplier search | P1 |
| `PriceComparisonPremium.tsx` | 15KB | Price comparison | P1 |
| `DataGovView.tsx` | 16KB | Відкриті дані України | P1 |
| `TendersView.tsx` | 14KB | Prozorro тендери | P1 |

**Підсумок:** 11 views → 1 MarketPage з вкладками/секціями

### 📈 РЕЖИМ «ПРОГНОЗ» (COMP-157 ForecastPage)

| Існуючий view | Розмір | Що взяти | Пріоритет |
|--------------|--------|---------|-----------|
| `ForecastView.tsx` | 16KB | Forecast charts with intervals | P0 |
| `AdvancedChartsPremium.tsx` | 19KB | Advanced charting | P1 |
| `ScenarioModeling.tsx` | 25KB | What-if simulator | P1 (Phase 2) |
| `ModelTrainingView.tsx` | 21KB | Model selector UI | P1 |
| `EnginesView.tsx` | 32KB | ML engines status | P1 |

**Підсумок:** 5 views → 1 ForecastPage

### 💡 РЕЖИМ «МОЖЛИВОСТІ» (COMP-158 OpportunitiesPage)

| Існуючий view | Розмір | Що взяти | Пріоритет |
|--------------|--------|---------|-----------|
| `AIInsightsHub.tsx` | 25KB | AI insights feed | P0 |
| `IntelligenceView.tsx` | 20KB | Intel cards | P0 |
| `ExecutiveBriefView.tsx` | 49KB | Executive summary | P1 |
| `ReportGenerator.tsx` | 14KB | Report generation | P1 (Phase 2) |

**Підсумок:** 4 views → 1 OpportunitiesPage

### ⚠️ РЕЖИМ «РИЗИКИ» (COMP-159 RisksPage) — Phase 2

| Існуючий view | Розмір | Що взяти | Пріоритет |
|--------------|--------|---------|-----------|
| `EntityRadarView.tsx` | 28KB | Entity CERS radar | P0 |
| `EntityGraphView.tsx` | 25KB | Graph visualization | P1 |
| `RiskScoringPremium.tsx` | 23KB | Risk scoring cards | P0 |
| `SanctionsScreening.tsx` | 15KB | Sanctions checker | P1 |
| `AlertCenterPremium.tsx` | 18KB | Alert center | P1 |

**Підсумок:** 5 views → 1 RisksPage (Phase 2)

---

## 2. УТИЛІТАРНІ VIEWS (не належать до 4 режимів)

### Системне управління (Sidebar → ⚙️ Налаштування)

| Існуючий view | Маппінг | Зберігаємо? |
|--------------|---------|-------------|
| `SettingsView.tsx` | Settings page | ✅ Зберегти |
| `SecurityView.tsx` | Security page | ✅ Зберегти |
| `MonitoringView.tsx` (67KB!) | System monitoring | ✅ Admin only |
| `DeploymentView.tsx` | Deployment status | 🟡 Admin only |
| `DatabasesView.tsx` | DB management | 🟡 Admin only |
| `ApiDocumentationView.tsx` | API docs embed | ✅ Зберегти |

### Data Management

| Існуючий view | Маппінг | Зберігаємо? |
|--------------|---------|-------------|
| `DataIngestionHub.tsx` (36KB) | ETL upload UI | ✅ Sprint 2 |
| `DataView.tsx` | Raw data viewer | ✅ Зберегти |
| `DatasetStudio.tsx` | Dataset management | 🟡 Phase 2 |
| `DataExportCenter.tsx` | Export PDF/Excel | 🟡 Phase 4 |
| `PipelineManagerView.tsx` | Pipeline status | 🟡 Sprint 2 |

### AI/ML Views

| Існуючий view | Маппінг | Зберігаємо? |
|--------------|---------|-------------|
| `AgentsView.tsx` | AI agents status | 🟡 Phase 3 |
| `LLMView.tsx` | LLM management | 🟡 Phase 2 |
| `KnowledgeEngineeringView.tsx` | Knowledge base | 🟡 Phase 2 |

### Legacy/Архівувати

| Існуючий view | Розмір | Причина |
|--------------|--------|---------|
| `AutonomyDashboard.tsx` | 45KB | Legacy AZR concept |
| `AutoFactoryView.tsx` | 49KB | Legacy auto-factory |
| `SovereignObserverView.tsx` | 25KB | Legacy v55 |
| `SuperIntelligenceView.tsx` | 23KB | Legacy SI |
| `OmniscienceView.tsx` | 32KB | Legacy omniscience |
| `EvolutionView.tsx` | 18KB | Legacy NAS |
| `ComponentsRegistryView.tsx` | 22KB | Dev tool |
| `SystemVerificationSuite.tsx` | 28KB | Dev/test tool |
| `PlaceholderView.tsx` | 8KB | Placeholder |
| `MobileCommandCenter.tsx` | 18KB | Not in MVP |
| `PremiumHubView.tsx` | 39KB | Marketing page |
| `RealTimeDashboard.tsx` | 15KB | Rebuild in Phase 3 |
| `DashboardBuilderView.tsx` | 1.2KB | Stub |
| `DashboardBuilderPremium.tsx` | 20KB | Phase 4 feature |
| `CasesView.tsx` | 15KB | Not in v4.2.0 |
| `ComplianceView.tsx` | 13KB | Phase 4 |
| `ActivityView.tsx` | 14KB | Rebuild |
| `DocumentsView.tsx` | 24KB | Phase 2 |
| `UserAnalyticsDashboard.tsx` | 14KB | Phase 4 |
| `SubscriptionManagement.tsx` | 16KB | Phase 4 |
| `IntegrationHub.tsx` | 20KB | Phase 2 |
| `GraphView.tsx` | 13KB | → EntityGraphView |
| `NasView.tsx` | 10KB | Legacy NAS |
| `ParsersView.tsx` | 23KB | Dev tool |
| `WidgetLibrary.tsx` | 17KB | Phase 4 |
| `SearchConsole.tsx` | 37KB | → components/search |
| `SearchView.tsx` | 35KB | → components/search |

---

## 3. КОМПОНЕНТИ (261 файлів)

### Layout (COMP-167, COMP-168) — COMP-ID маппінг

| Існуючий файл | COMP-ID | Стан | Дія |
|--------------|---------|------|-----|
| `layout/MainLayout.tsx` | COMP-167 (AppShell) | 🔄 | Рефакторити |
| `layout/UnifiedLayout.tsx` | alt AppShell | 🔄 | Об'єднати з MainLayout |
| `layout/Sidebar.tsx` | COMP-168 | 🔄 | Перебудувати на 4 режими |
| `layout/TopBar.tsx` | Top Bar | ✅ | Мінімальний рефакторинг |
| `layout/PageTransition.tsx` | Animation | ✅ | Зберегти |
| `layout/DynamicSystemAura.tsx` | FX | 🟡 | Зберегти для естетики |
| `layout/OperatorIdentity.tsx` | User badge | ✅ | Зберегти |
| `layout/DisplayModeSwitcher.tsx` | Theme switch | ✅ | Зберегти |
| `layout/AdminLicenseModal.tsx` | Admin | 🟡 | Phase 4 |
| `layout/UserOnboarding.tsx` | Onboarding | 🟡 | Sprint 6 |

### Shared/UI Components (корисні для всіх режимів)

| Компонент | Маппінг | Збережемо? |
|-----------|---------|-----------|
| `ErrorBoundary.tsx` | Error handling | ✅ |
| `Skeleton.tsx` | Loading states | ✅ |
| `Toast.tsx` / `EnhancedToast.tsx` | Notifications | ✅ |
| `Modal.tsx` / `DocumentModal.tsx` | Modals | ✅ |
| `EnhancedButton.tsx` | UI | ✅ |
| `EnhancedChart.tsx` | COMP-163 (Charts) | ✅ |
| `StatusIndicator.tsx` | UI | ✅ |
| `ViewHeader.tsx` | Page header | ✅ |
| `TacticalCard.tsx` | Card component | ✅ |
| `HoloContainer.tsx` | Container | ✅ |
| `Logo.tsx` | Branding | ✅ |
| `CommandPalette.tsx` | Search (⌘K) | ✅ COMP-165 |
| `GlobalSearchOverlay.tsx` | Search overlay | ✅ COMP-165 |
| `NotificationDrawer.tsx` | COMP-166 | ✅ |
| `LoginScreen.tsx` | Auth UI | ✅ Sprint 6 |
| `BootScreen.tsx` | Loading screen | ✅ |

### Premium Components (53 файлів)
> Багата бібліотека premium UI. Зберегти ВСЕ, використовувати вибірково.

### Specialized (архівувати)

| Компонент | Причина |
|-----------|---------|
| `AZRConstitutionalDashboard.tsx` | Legacy AZR |
| `AzrHyperWidget.tsx` | Legacy AZR |
| `CyberGrid.tsx` | Cosmetic |
| `CyberOrb.tsx` | Cosmetic (можна залишити для WOW) |
| `NeuralCore.tsx` | Cosmetic |
| `TripleAgentPanel.tsx` | Legacy |
| `LLMCouncilPanel.tsx` | Phase 2 |
| `LLMHealthMonitor.tsx` | Phase 2 |
| `JobQueueMonitor.tsx` | Admin only |
| `StorageAnalytics.tsx` | Admin only |
| `RealTimeSystemMetrics.tsx` | Admin only |

---

## 4. ROUTER MAPPING

### Поточний стан (AppRoutesNew.tsx — 222 рядки, ~50 routes)

```
Існуючі маршрути → v4.2.0 маршрути
═══════════════════════════════════
/ (Dashboard)          → / (MarketPage)
/analytics             → /market
/customs-intelligence  → /market/customs
/competitor-intel      → /market/competitors
/forecast              → /forecast
/scenario-modeling     → /forecast/simulator (Phase 2)
/ai-insights           → /opportunities
/intelligence          → /opportunities/intel
/entity-radar          → /risks (Phase 2)
/entity-graph          → /risks/graph (Phase 2)
/sanctions             → /risks/sanctions (Phase 2)
/search                → Global search overlay
/settings              → /settings
/data                  → /admin/data
/deployment            → /admin/deployment
/monitoring            → /admin/monitoring
/databases             → /admin/databases
/agents                → /admin/agents (Phase 3)
/llm                   → /admin/llm (Phase 2)
```

### Target Router (Sprint 1)

```typescript
// 4 основних режими
{ path: '/',                element: <MarketPage /> }
{ path: '/market/*',        element: <MarketPage /> }
{ path: '/forecast/*',      element: <ForecastPage /> }
{ path: '/opportunities/*', element: <OpportunitiesPage /> }
{ path: '/risks/*',         element: <RisksPage /> }      // Phase 2

// Утилітарні
{ path: '/settings',        element: <SettingsView /> }
{ path: '/search',          element: <SearchConsole /> }

// Admin (захищені)
{ path: '/admin/*',         element: <AdminLayout /> }

// Legacy redirects (backward compatibility)
{ path: '/dashboard',       redirect: '/' }
{ path: '/analytics',       redirect: '/market' }
// ...
```

---

## 5. EXISTING TECH STACK (FRONTEND)

### ✅ Вже встановлено та відповідає ТЗ

| Бібліотека | Версія | COMP-ID |
|-----------|--------|---------|
| React | 18.2 | ✅ |
| TypeScript | 5.x | ✅ |
| Vite | 5.x | COMP-016 ✅ |
| TailwindCSS | 3.4 | ✅ |
| @tanstack/react-query | 5.17 | ✅ |
| ECharts | 5.5 | COMP-163 ✅ |
| react-router-dom | 6.21 | COMP-169 ✅ |
| framer-motion | 11.0 | ✅ (анімації) |
| Zustand | 4.5 | ✅ (стейт) |
| lucide-react | 0.294 | ✅ (іконки) |
| Playwright | 1.58 | ✅ (E2E) |
| Vitest | 1.0 | ✅ (unit) |
| axios | 1.6 | ✅ (HTTP) |
| recharts | 2.10 | ✅ (alt charts) |
| xlsx | 0.18 | ✅ (Excel) |

### 📋 Потрібно додати

| Бібліотека | Для чого | COMP-ID | Спринт |
|-----------|---------|---------|--------|
| TanStack Table | Data tables | COMP-164 | 3 |
| Cytoscape.js | Graph viz | COMP-161 | Phase 2 |
| MapLibre GL | Maps | COMP-162 | Phase 2 |
| Shadcn/ui | UI components | — | 1 (optional) |

---

## 6. ЗВЕДЕНА СТАТИСТИКА

```
FRONTEND AUDIT SUMMARY
═════════════════════════════════════════
Views загалом:                     68
  → MarketPage:                    11 views
  → ForecastPage:                   5 views
  → OpportunitiesPage:              4 views
  → RisksPage (Phase 2):            5 views
  → Settings/Admin:                 6 views
  → Data Management:                5 views
  → AI/ML Views (Phase 2+):         3 views
  → Legacy/Archive:               ~27 views

Components загалом:               261
  → Root level:                     40
  → Layout:                         10
  → Premium:                        53
  → Subdirectories:               ~158

РЕАЛЬНИЙ ПРОГРЕС Frontend:         ~25%
  (layout, router, 30+ reusable components exist)
═════════════════════════════════════════
```

---

## 7. РЕКОМЕНДАЦІЇ ДЛЯ SPRINT 1

1. **Не видаляти** жоден view — відключити від router через `lazy()` guard
2. **Створити** `src/pages/` з 3 canonical pages (Market, Forecast, Opportunities)
3. **Рефакторити** `AppRoutesNew.tsx` → `app/router.tsx` з 4 режимами
4. **Sidebar** — перебудувати на canonical menu (📊 Ринок, 📈 Прогноз, 💡 Можливості, ⚙️ Налаштування)
5. **Зберегти** всі existing components — вони корисні як будівельні блоки
