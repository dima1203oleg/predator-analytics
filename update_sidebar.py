import codecs

path = '/Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui/src/components/layout/Sidebar.tsx'
with codecs.open(path, 'r', 'utf-8') as f:
    content = f.read()

start_str = "const buildNavGroups = (): NavGroup[] => ["
end_str = "];\n\n/* ═══════════════════════════════════════════════════════════════════\n   SIDEBAR COMPONENT"

new_nav_groups = """const buildNavGroups = (): NavGroup[] => [
  {
    title: 'КОМАНДНИЙ ЦЕНТР',
    subtitle: 'Контроль і статус',
    accent: 'indigo',
    items: [
      { name: 'Огляд Системи', path: '/overview', icon: LayoutDashboard },
      { name: 'Ранковий Брифінг', path: '/morning-brief', icon: Radio },
      { name: 'Омніскоп', path: '/omni', icon: Eye },
      { name: 'Стрічка Подій', path: '/news', icon: Activity },
      {
        name: 'Оперативний Моніторинг',
        path: '/dashboards',
        icon: Gauge,
        subItems: [
          { name: 'Реальний Час', path: '/realtime' },
          { name: 'Верифікація Системи', path: '/verify-system', role: 'admin' },
          { name: 'Суверенний Спостерігач', path: '/som', role: 'admin' },
        ],
      },
    ],
  },

  {
    title: 'ІНТЕЛЕКТ & РОЗВІДКА',
    subtitle: 'OSINT та пошук',
    accent: 'cyan',
    items: [
      { name: 'Глобальний Пошук', path: '/search-v2', icon: Search },
      {
        name: 'Граф-Аналітика',
        path: '/graph',
        icon: Network,
        subItems: [
          { name: 'Граф Зв\\u2019язків', path: '/graph' },
          { name: 'Граф Сутностей', path: '/entity-graph' },
          { name: 'Радар Сутностей', path: '/competitor-radar' },
        ],
      },
      { name: 'Морська Розвідка', path: '/maritime', icon: Ship },
      { name: 'Конкурентна Розвідка', path: '/competitor-intel', icon: Crosshair, premium: true },
    ],
  },

  {
    title: 'МИТНИЙ КОНТРОЛЬ',
    subtitle: 'Ризики та комплаєнс',
    accent: 'emerald',
    items: [
      { name: 'Митна Аналітика', path: '/customs-intel', icon: Scale },
      { name: 'Центр Інтелекту', path: '/intelligence', icon: BrainCircuit },
      { name: 'Ризик-Скоринг', path: '/risk-scoring', icon: AlertCircle, premium: true },
      { name: 'AML Аналізатор', path: '/aml', icon: ShieldAlert },
      { name: 'Санкційний Скринінг', path: '/sanctions', icon: Shield, premium: true },
      { name: 'Комплаєнс', path: '/compliance', icon: ShieldCheck },
      { name: 'Моделювання Сценаріїв', path: '/modeling', icon: Target, premium: true },
      { name: 'CERS Еволюція', path: '/evolution', icon: TrendingUp },
    ],
  },

  {
    title: 'ПАПКИ ТА СПРАВИ',
    subtitle: 'Досьє та розслідування',
    accent: 'violet',
    items: [
      { name: 'Досьє Компаній', path: '/clients/business', icon: Building2 },
      { name: 'Відкриті Справи', path: '/cases', icon: FolderOpen },
      { name: 'Архів Документів', path: '/documents', icon: Archive },
      {
        name: 'Публічні Дані',
        path: '/tenders',
        icon: Globe,
        subItems: [
          { name: 'Prozorro Тендери', path: '/tenders' },
          { name: 'Держ.Дані API', path: '/datagov' },
          { name: 'Публічні Реєстри', path: '/registries' },
        ],
      },
    ],
  },

  {
    title: 'AI ПЛАТФОРМА',
    subtitle: 'Штучний інтелект',
    accent: 'orange',
    items: [
      { name: 'Автономна Фабрика', path: '/factory', icon: Factory },
      {
        name: 'Флот Агентів',
        path: '/agents',
        icon: Bot,
        subItems: [
          { name: 'Менеджер Агентів', path: '/agents' },
          { name: 'Оркестратор Pipeline', path: '/pipeline' },
          { name: 'Контроль Автономності', path: '/autonomy', role: 'admin' },
        ],
      },
      {
        name: 'Мовні Моделі',
        path: '/llm',
        icon: MessageSquare,
        premium: true,
        subItems: [
          { name: 'LLM Консоль', path: '/llm' },
          { name: 'NAS Arena', path: '/llm/nas', premium: true },
          { name: 'Тренування Моделей', path: '/training', role: 'admin' },
          { name: 'Движки (Engines)', path: '/engines', role: 'admin' },
        ],
      },
      { name: 'Інженерія Знань', path: '/knowledge', icon: BookOpen },
      { name: 'Суперінтелект', path: '/super', icon: Rocket, role: 'admin' },
      { name: 'AI Інсайти', path: '/ai-insights', icon: Sparkles, premium: true },
      { name: 'Студія Факторів', path: '/system-factory', icon: Factory, role: 'admin' },
    ],
  },

  {
    title: 'ДАТА ІНЖЕНЕРІЯ',
    subtitle: 'Сховища та інджест',
    accent: 'blue',
    items: [
      { name: 'Огляд Даних', path: '/data', icon: Database },
      { name: 'Інджестинг Потоків', path: '/ingestion', icon: Zap },
      { name: 'Парсери & Конектори', path: '/parsers', icon: Workflow },
      {
        name: 'Датасети',
        path: '/datasets',
        icon: Boxes,
        subItems: [
          { name: 'Студія Датасетів', path: '/datasets' },
          { name: 'Менеджер Датасетів', path: '/datasets-manager' },
        ],
      },
      { name: 'Адміністрування БД', path: '/databases', icon: Database, role: 'admin' },
    ],
  },

  {
    title: 'КОМЕРЦІЯ & PREMIUM',
    subtitle: 'Макро-аналітика',
    accent: 'amber',
    items: [
      { name: 'Premium Хаб', path: '/premium-hub', icon: Crown, premium: true },
      { name: 'Аналітика Ринку', path: '/market-analytics', icon: BarChart3, premium: true },
      { name: 'Торгові Потоки', path: '/trade-map', icon: Map, premium: true },
      { name: 'Пошук Постачальників', path: '/suppliers', icon: Globe, premium: true },
      { name: 'Порівняння Цін', path: '/price-compare', icon: Scale, premium: true },
      { name: 'Центр Сповіщень', path: '/alerts', icon: AlertTriangle, premium: true },
    ],
  },

  {
    title: 'ІНФРАСТРУКТУРА',
    subtitle: 'Система та безпека',
    accent: 'rose',
    items: [
      { name: 'Деплоймент (K8s)', path: '/deployment', icon: Layers, role: 'admin' },
      { name: 'Безпека / Audit Log', path: '/security', icon: Shield, role: 'admin' },
      { name: 'Управління (Governance)', path: '/governance', icon: Landmark, role: 'admin' },
      { name: 'Сис. Дашборди', path: '/user-analytics', icon: BarChart3, role: 'admin' },
    ],
  },

  {
    title: 'КОНФІГУРАЦІЯ',
    subtitle: 'Налаштування',
    accent: 'slate',
    items: [
      { name: 'Налаштування', path: '/settings', icon: Settings },
      { name: 'Підписка', path: '/subscription', icon: Crown },
      { name: 'Конструктор Звітів', path: '/reports', icon: FileText },
      { name: 'Конструктор Дашбордів', path: '/builder', icon: LayoutDashboard },
      { name: 'Експорт Даних', path: '/export', icon: Archive },
      { name: 'Інтеграції', path: '/integrations', icon: Network },
      { name: 'API Документація', path: '/api-docs', icon: BookOpen, role: 'admin' },
      { name: 'Бібліотека UI', path: '/components', icon: Boxes, role: 'admin' },
    ],
  }"""

if start_str in content and end_str in content:
    content = content[:content.find(start_str)] + new_nav_groups + "\n" + content[content.find(end_str):]
    content = content.replace("titles.add('ШТАБ');", "titles.add('КОМАНДНИЙ ЦЕНТР');")
    content = content.replace("useState<Set<string>>(new Set(['ШТАБ']));", "useState<Set<string>>(new Set(['КОМАНДНИЙ ЦЕНТР']));")
    
    with codecs.open(path, 'w', 'utf-8') as f:
        f.write(content)
    print("Sidebar nav groups successfully updated!")
else:
    print("Could not find delimiters.")
