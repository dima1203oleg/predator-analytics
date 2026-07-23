export const SIDEBAR_GROUPS = [
  {
    id: 'core',
    label: 'Операційне Ядро',
    items: [
      { id: 'live-analytical-center', label: 'Живе ШІ-Ядро (Live)', badge: 'НАЖИВО', badgeColor: 'emerald' },
      { id: 'dashboard', label: 'Аналітичний Дашборд', badge: 'НАЖИВО', badgeColor: 'emerald' },
      { id: 'osint', label: 'OSINT Пошук', badge: 'РИЗИК', badgeColor: 'rose' },
      { id: 'person-profiler', label: 'Досьє & Портрет Особи', badge: 'НОМІНАЛИ', badgeColor: 'rose' }
    ]
  },
  {
    id: 'specialized',
    label: 'Спеціалізовані Інструменти',
    items: [
      { id: 'maps', label: 'Інтерактивна Карта', badge: 'КАРТА', badgeColor: 'blue' },
      { id: 'media-forensics', label: 'Аналіз Медіа', badge: 'ШІ', badgeColor: 'fuchsia' },
      { id: 'sandbox', label: 'Аналітична Пісочниця', badge: 'ПІСОЧНИЦЯ', badgeColor: 'indigo' },
      { id: 'data-ingestion', label: 'Імпорт Даних', badge: '', badgeColor: '' }
    ]
  },
  {
    id: 'admin',
    label: 'Адміністрування',
    items: [
      { id: 'admin-back-office', label: 'Консоль управління', badge: '', badgeColor: '' },
      { id: 'autonomous-factory', label: 'Автономна Фабрика', badge: '', badgeColor: '' }
    ]
  },
  {
    id: 'architecture',
    label: 'Архітектура Інфраструктури',
    items: [
      { id: 'architecture', label: 'Граф залежностей', badge: '', badgeColor: '' },
      { id: 'gap', label: 'Аналіз прогалин', badge: '', badgeColor: '' },
      { id: 'roadmap', label: 'Дорожня карта', badge: '', badgeColor: '' },
      { id: 'catalog', label: 'Каталог рішень', badge: '', badgeColor: '' },
      { id: 'license', label: 'Сумісність ліцензій', badge: '', badgeColor: '' },
      { id: 'volumes', label: 'Томи ТЗ', badge: '', badgeColor: '' },
      { id: 'advisor', label: 'ШІ-Архітектор', badge: '', badgeColor: '' }
    ]
  }
];
