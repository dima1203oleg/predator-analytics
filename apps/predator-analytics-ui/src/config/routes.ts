/**
 * 🎯 Центральні константи маршрутів | PREDATOR UI v57.2-WRAITH
 *
 * Визначення маршрутів в одному місці дозволяє:
 * - Уникнути дублікатів шляхів
 * - Спростити рефакторинг та навігацію
 * - Забезпечити консистентність в усій програмі
 *
 * Комплаєнс: AGENTS.md (HR-03, українська мова в коментарях)
 */

export const ROUTES = {
  // 🏠 Основні маршрути
  HOME: '/',
  OVERVIEW: '/overview',
  PREDATOR_V24: '/predator-v24',

  // 📊 Аналітика та бізнес
  MARKET: '/market',
  FORECAST: '/forecast',
  DILIGENCE: '/diligence',
  OPPORTUNITIES: '/opportunities',

  // 🔍 Пошук та розвідка
  SEARCH: '/search',
  SEARCH_SMART: '/search-smart',
  COMPANIES_CERS: '/companies-cers',

  // 📈 Моніторинг та дашборди
  MONITORING: '/monitoring',
  MONITORING_REALTIME: '/monitoring/realtime',
  DASHBOARDS: '/dashboards',
  REALTIME_DASHBOARD: '/realtime/dashboard',

  // 🧠 Інтелект та аналітика
  INTELLIGENCE: '/intelligence',
  ANALYTICS: '/analytics',
  CUSTOMS_INTEL: '/customs-intel',
  NEXUS: '/nexus',

  // 📁 Дані та управління
  DOCUMENTS: '/documents',
  CASES: '/cases',
  DATA: '/data',
  DATABASES: '/databases',
  DATASETS: '/datasets',

  // 📋 Звіти та моніторинг
  REPORTS: '/reports',
  REPORTS_BUILDER: '/reports/builder',

  // 🕸️ Мережа та зв'язки
  GRAPH: '/graph',
  NETWORK: '/network/:ueid',
  ENTITY_GRAPH: '/entity-graph',

  // ⚙️ Налаштування та адмін
  SETTINGS: '/settings',
  ADMIN: '/admin',
  SECURITY: '/security',

  // 🤝 Клієнти
  CLIENTS: '/clients',
  CLIENTS_SEGMENT: '/clients/:segment',

  // 💰 Фінанси
  FINANCIALS: '/financials/:ueid',

  // 🏢 Компанії
  COMPANY_CERS: '/company/:id/cers',

  // 📱 Разові сторінки
  DUE_DILIGENCE: '/diligence/:ueid',
  FORECAST_COMPANY: '/forecast/:ueid',
} as const;

export type RouteKey = keyof typeof ROUTES;

export default ROUTES;

