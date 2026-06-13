# PREDATOR Analytics Responsive UI & Final Spec Codemap

> Codemap що відображає доробки Responsive UI 2.0, Final Spec Execution, української локалізації та тестування інфраструктури.

## Trace ID: 1
**Title**: Responsive UI Architecture - Multi-Device Layout System
**Description**: Універсальна система layout routing для мобільних, планшетних та десктопних пристроїв з viewport detection

**Trace text diagram**:
Responsive UI Architecture
├── MainLayout Entry Point <-- MainLayout.tsx:7
│   ├── useViewport Hook Detection <-- useViewport.ts:1
│   │   ├── isCompact (mobile < 768px) <-- 1a
│   │   ├── isMedium (tablet 768-1024px) <-- 1b
│   │   └── isExpanded (desktop > 1024px) <-- 1c
│   ├── MobileLayout Routing <-- 1d
│   │   ├── Bottom Navigation Bar <-- MobileLayout.tsx:60
│   │   ├── Safe Area Padding (iOS) <-- MobileLayout.tsx:29
│   │   └── Compact Header <-- MobileLayout.tsx:27
│   ├── TabletLayout Routing <-- 1e
│   │   ├── Narrow Sidebar (compact) <-- TabletLayout.tsx:26
│   │   ├── Persistent Header <-- TabletLayout.tsx:23
│   │   └── Main Content Area <-- TabletLayout.tsx:28
│   └── DesktopLayout Routing <-- 1f
│       ├── Full Sidebar <-- DesktopLayout.tsx
│       ├── Context Rail <-- DesktopLayout.tsx
│       └── Workspace Strip <-- DesktopLayout.tsx
└── Hub Pages Integration
    ├── CommandHub <-- CommandHub.tsx:33
    ├── SearchHub <-- SearchHub.tsx:27
    ├── OSINTHub <-- OSINTHub.tsx:20
    ├── FinancialHub <-- FinancialHub.tsx:27
    └── MarketPage <-- MarketPage.tsx:282

**Location ID: 1a**
**Title**: Mobile Viewport Detection
**Description**: Визначення мобільного viewport (< 768px) через useViewport hook
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/hooks/useViewport.ts

**Location ID: 1b**
**Title**: Tablet Viewport Detection
**Description**: Визначення планшетного viewport (768-1024px) для compact layout
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/hooks/useViewport.ts

**Location ID: 1c**
**Title**: Desktop Viewport Detection
**Description**: Визначення десктопного viewport (> 1024px) для full layout
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/hooks/useViewport.ts

**Location ID: 1d**
**Title**: MobileLayout Component
**Description**: Мобільний layout з bottom navigation та safe area padding для iOS
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/layout/MobileLayout.tsx:12

**Location ID: 1e**
**Title**: TabletLayout Component
**Description**: Планшетний layout з narrow sidebar та persistent header
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/layout/TabletLayout.tsx:13

**Location ID: 1f**
**Title**: DesktopLayout Component
**Description**: Десктопний layout з full sidebar, context rail та workspace strip
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/layout/DesktopLayout.tsx

---

## Trace ID: 2
**Title**: Final Spec Execution - Premium Analytics Components
**Description**: Реалізація premium компонентів WhatIf, DigitalTwin, RegulatoryRadar, ConnectionExplorer3D

**Trace text diagram**:
Final Spec Components
├── WhatIf Simulator <-- WhatIfSimulatorView.tsx:1
│   ├── Scenario Modeling Engine <-- 2a
│   ├── Parameter Sliders <-- WhatIfSimulatorView.tsx
│   └── Impact Visualization <-- WhatIfSimulatorView.tsx
├── Digital Twin Viewer <-- DigitalTwinView.tsx:1
│   ├── Entity Mirror Engine <-- 2b
│   ├── Real-time Sync <-- DigitalTwinView.tsx
│   └── Predictive Analytics <-- DigitalTwinView.tsx
├── Regulatory Radar <-- RegulatoryRadarView.tsx:1
│   ├── Compliance Scanner <-- 2c
│   ├── Risk Heatmap <-- RegulatoryRadarView.tsx
│   └── Alert System <-- RegulatoryRadarView.tsx
└── Connection Explorer 3D <-- ConnectionExplorer3DView.tsx:1
    ├── 3D Graph Rendering <-- 2d
    ├── Interactive Navigation <-- ConnectionExplorer3DView.tsx
    └── Multi-hop Analysis <-- ConnectionExplorer3DView.tsx

**Location ID: 2a**
**Title**: WhatIf Simulator Engine
**Description**: Сценарне моделювання з параметричними слайдерами та візуалізацією впливу
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/features/forecast/WhatIfSimulatorView.tsx

**Location ID: 2b**
**Title**: Digital Twin Engine
**Description**: Цифровий двійник сутностей з real-time sync та предиктивною аналітикою
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/features/modeling/DigitalTwinView.tsx

**Location ID: 2c**
**Title**: Regulatory Radar Scanner
**Description**: Сканер комплаєнсу з risk heatmap та alert system
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/features/intelligence/RegulatoryRadarView.tsx

**Location ID: 2d**
**Title**: Connection Explorer 3D
**Description**: 3D граф рендеринг з інтерактивною навігацією та multi-hop аналізом
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/features/network/ConnectionExplorer3DView.tsx

---

## Trace ID: 3
**Title**: Mobile Sovereign Command Center
**Description**: Мобільна версія командного центру з LLM Tri-State routing та slide-to-execute actions

**Trace text diagram**:
Mobile Sovereign Command Center
├── Component Entry <-- MobileSovereignCommandCenter.tsx:14
│   ├── System Status Hooks <-- 3a
│   │   ├── useSystemStatus <-- MobileSovereignCommandCenter.tsx:15
│   │   ├── useSystemStats <-- MobileSovereignCommandCenter.tsx:16
│   │   └── useAIEngines <-- MobileSovereignCommandCenter.tsx:17
│   ├── LLM Tri-State Display <-- 3b
│   │   ├── SOVEREIGN (Red) <-- MobileSovereignCommandCenter.tsx:47
│   │   ├── HYBRID (Green) <-- MobileSovereignCommandCenter.tsx:48
│   │   └── CLOUD (Blue) <-- MobileSovereignCommandCenter.tsx:49
│   ├── Quick Stats Grid <-- 3c
│   │   ├── VRAM Usage <-- MobileSovereignCommandCenter.tsx:66
│   │   ├── CPU Load <-- MobileSovereignCommandCenter.tsx:73
│   │   ├── NVIDIA Node Status <-- MobileSovereignCommandCenter.tsx:80
│   │   └── AI Engines Count <-- MobileSovereignCommandCenter.tsx:89
│   └── Slide-to-Execute Actions <-- 3d
│       ├── Core Recalibration <-- MobileSovereignCommandCenter.tsx:117
│       └── Emergency OODA Gate <-- MobileSovereignCommandCenter.tsx:126

**Location ID: 3a**
**Title**: Mobile System Status Hooks
**Description**: Інтеграція system status, stats та AI engines hooks для мобільного UI
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages/admin/tabs/MobileSovereignCommandCenter.tsx:15

**Location ID: 3b**
**Title**: LLM Tri-State Mobile Display
**Description**: Візуалізація LLM routing mode (SOVEREIGN/HYBRID/CLOUD) з color coding
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages/admin/tabs/MobileSovereignCommandCenter.tsx:45

**Location ID: 3c**
**Title**: Mobile Quick Stats Grid
**Description**: 2x2 grid з VRAM, CPU, NVIDIA status та AI engines count
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages/admin/tabs/MobileSovereignCommandCenter.tsx:60

**Location ID: 3d**
**Title**: Mobile Slide-to-Execute Actions
**Description**: Критичні дії з slide-to-execute UI pattern для мобільних
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages/admin/tabs/MobileSovereignCommandCenter.tsx:116

---

## Trace ID: 4
**Title**: Ukrainian Localization - HR-04 Compliance
**Description**: Повна українська локалізація інтерфейсу (100% UI текстів, кнопок, алертів)

**Trace text diagram**:
Ukrainian Localization
├── Translation Files <-- locales/uk/
│   ├── LC_MESSAGES/ <-- 4a
│   │   ├── common.json <-- locales/uk/LC_MESSAGES/
│   │   ├── navigation.json <-- locales/uk/LC_MESSAGES/
│   │   └── components.json <-- locales/uk/LC_MESSAGES/
├── Mobile Components Translation <-- 4b
│   ├── MobileLayout.tsx <-- MobileLayout.tsx:18
│   │   ├── 'Головна' (Home) <-- MobileLayout.tsx:18
│   │   ├── 'Пошук' (Search) <-- MobileLayout.tsx:19
│   │   ├── 'OSINT' <-- MobileLayout.tsx:20
│   │   └── 'Маркет' (Market) <-- MobileLayout.tsx:21
│   └── MobileSovereignCommandCenter.tsx <-- MobileSovereignCommandCenter.tsx:36
│       ├── 'МАРШРУТИЗАЦІЯ LLM OODA' <-- MobileSovereignCommandCenter.tsx:52
│       ├── 'ВІДЕОПАМ'ЯТЬ' <-- MobileSovereignCommandCenter.tsx:63
│       └── 'ЗАВАНТАЖЕННЯ CPU' <-- MobileSovereignCommandCenter.tsx:70
└── Desktop Components Translation <-- 4c
    ├── All View Components <-- features/**/*View.tsx
    ├── All Hub Pages <-- pages/**/*Hub.tsx
    └── All UI Components <-- components/**/*.tsx

**Location ID: 4a**
**Title**: Ukrainian Translation Files
**Description**: JSON файли перекладів для common, navigation, components
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/locales/uk/LC_MESSAGES/

**Location ID: 4b**
**Title**: Mobile Components Translation
**Description**: Переклад мобільних компонентів (MobileLayout, MobileSovereignCommandCenter)
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/components/layout/MobileLayout.tsx:18

**Location ID: 4c**
**Title**: Desktop Components Translation
**Description**: Переклад всіх десктопних компонентів (Views, Hubs, UI components)
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/features/

---

## Trace ID: 5
**Title**: Testing Infrastructure - E2E & DOM Tests
**Description**: Комплексна тестова інфраструктура з Playwright E2E та Vitest DOM тестами

**Trace text diagram**:
Testing Infrastructure
├── Playwright E2E Tests <-- e2e/
│   ├── Final Spec Elite Views <-- 5a
│   │   ├── WhatIf Simulator <-- e2e/whatIf.spec.ts
│   │   ├── Digital Twin <-- e2e/digitalTwin.spec.ts
│   │   ├── Regulatory Radar <-- e2e/regulatoryRadar.spec.ts
│   │   └── Connection Explorer 3D <-- e2e/connectionExplorer3D.spec.ts
│   └── Mobile Views <-- e2e/mobile/
│       ├── MobileSovereignCommandCenter <-- e2e/mobile/mobileSovereignCommandCenter.spec.ts
│       └── MobileCouncilJudge <-- e2e/mobile/mobileCouncilJudge.spec.ts
├── Vitest DOM Tests <-- src/**/__tests__/
│   ├── Mobile Components Tests <-- 5b
│   │   ├── MobileSovereignCommandCenter.test.tsx <-- pages/admin/tabs/__tests__/
│   │   ├── MobileCouncilJudgeView.test.tsx <-- features/ai/__tests__/
│   │   └── MobileZradaControlView.test.tsx <-- features/intelligence/__tests__/
│   ├── Final Spec Components Tests <-- 5c
│   │   ├── WhatIfSimulatorView.test.tsx <-- features/forecast/__tests__/
│   │   ├── DigitalTwinView.test.tsx <-- features/modeling/__tests__/
│   │   ├── RegulatoryRadarView.test.tsx <-- features/intelligence/__tests__/
│   │   └── ConnectionExplorer3DView.test.tsx <-- features/network/__tests__/
│   └── UI Polish Tests <-- 5d
│       ├── BrandLoader.test.tsx <-- src/__tests__/polish/
│       ├── SlideToExecute.test.tsx <-- src/__tests__/polish/
│       └── ThermalCard.test.tsx <-- src/__tests__/polish/
└── Test Configuration
    ├── playwright.config.ts <-- playwright.config.ts:1
    ├── vitest.config.ts <-- vitest.config.ts:1
    └── Test Utilities <-- src/__tests__/utils/

**Location ID: 5a**
**Title**: Playwright E2E Tests for Final Spec
**Description**: E2E тести для WhatIf, DigitalTwin, RegulatoryRadar, ConnectionExplorer3D
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/e2e/

**Location ID: 5b**
**Title**: Mobile Components DOM Tests
**Description**: Vitest тести для MobileSovereignCommandCenter, MobileCouncilJudge, MobileZradaControl
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/pages/admin/tabs/__tests__/MobileSovereignCommandCenter.test.tsx

**Location ID: 5c**
**Title**: Final Spec Components DOM Tests
**Description**: Vitest тести для WhatIf, DigitalTwin, RegulatoryRadar, ConnectionExplorer3D
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/features/forecast/__tests__/WhatIfSimulatorView.test.tsx

**Location ID: 5d**
**Title**: UI Polish DOM Tests
**Description**: Тести для BrandLoader, SlideToExecute, ThermalCard компонентів
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/src/__tests__/polish/

---

## Trace ID: 6
**Title**: Deployment & Infrastructure Updates
**Description**: Оновлення deployment на NVIDIA сервері та zrok tunnel configuration

**Trace text diagram**:
Deployment Updates
├── NVIDIA Server Deployment <-- 194.177.1.240
│   ├── Frontend Image Update <-- 6a
│   │   ├── v61.0.634 (latest) <-- git log: d460317d8
│   │   ├── Port: 3030 <-- deployment config
│   │   └── Zrok Tunnel <-- 6b
│   │       ├── URL: https://30ditqc28551.share.zrok.io <-- memory
│   │       └── Local Port: 3030 <-- memory
│   └── Helm Release
│       ├── Release: predator-v61 <-- memory
│       ├── Namespace: predator-v61 <-- memory
│       └── Revision: 7 <-- memory
└── Local Development Environment
    ├── MacBook (IDE Only) <-- HR-21
    │   ├── Port: 3030 <-- HR-10
    │   ├── Mock API: 9080 <-- HR-10
    │   └── Zrok Tunnel: https://6t7yqkozh1li.share.zrok.io <-- memory
    └── NVIDIA (Compute Node) <-- HR-22
        ├── Static IP: 178.214.200.25 <-- memory
        └── All 8 Databases Deployed <-- memory

**Location ID: 6a**
**Title**: Frontend Image Update
**Description**: Оновлення frontend Docker образу до v61.0.634 на NVIDIA сервері
**Path:LineNumber**: /Users/Shared/Predator_60/.git/COMMIT_EDITMSG (commit d460317d8)

**Location ID: 6b**
**Title**: Zrok Tunnel Configuration
**Description**: Публічний тунель для доступу до frontend через zrok
**Path:LineNumber**: /Users/Shared/Predator_60/apps/predator-analytics-ui/zrok_overview.json

---

## Summary of Key Improvements

### Responsive UI 2.0
- ✅ MobileLayout з bottom navigation та safe area padding
- ✅ TabletLayout з narrow sidebar та persistent header
- ✅ MainLayout unified routing на основі viewport detection
- ✅ MobileSovereignCommandCenter для мобільного адміністрування
- ✅ MobileCouncilJudgeView та MobileZradaControlView для мобільних AI features

### Final Spec Execution
- ✅ WhatIfSimulatorView - сценарне моделювання
- ✅ DigitalTwinView - цифровий двійник сутностей
- ✅ RegulatoryRadarView - регуляторний радар
- ✅ ConnectionExplorer3DView - 3D експлорер зв'язків

### Ukrainian Localization (HR-04)
- ✅ 100% переклад UI текстів українською
- ✅ Переклад всіх мобільних компонентів
- ✅ Переклад всіх десктопних компонентів
- ✅ Переклад navigation, buttons, alerts, tooltips

### Testing Infrastructure
- ✅ Playwright E2E тести для Final Spec Views
- ✅ Vitest DOM тести для Mobile Components
- ✅ Vitest DOM тести для Final Spec Components
- ✅ UI Polish тести (BrandLoader, SlideToExecute, ThermalCard)
- ✅ Виправлення імпортів (named imports та vi з vitest)

### Deployment
- ✅ Frontend образ v61.0.634 на NVIDIA сервері
- ✅ Zrok tunnel для публічного доступу
- ✅ MacBook як IDE only (HR-21)
- ✅ NVIDIA як Compute Node (HR-22)

### Bug Fixes
- ✅ Виправлення TS помилок
- ✅ Видалення MOCK даних
- ✅ Відновлення MainLayout
- ✅ Виправлення імпортів в тестах
