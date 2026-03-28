import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Shield, 
  Search, 
  FileText, 
  Database, 
  Zap, 
  Network, 
  Lock, 
  Users, 
  Target, 
  Newspaper, 
  Briefcase, 
  TrendingUp, 
  Box, 
  Brain,
  Layers,
  Activity,
  Eye,
  Anchor,
  Building2,
  Radar,
  FlaskConical,
  Factory,
  Workflow,
  ScrollText,
  AlertTriangle,
  Globe,
  Scale,
  Ship,
  Landmark,
  Compass,
  LineChart,
  Cpu,
  Blocks,
  Wrench,
  Upload,
  BrainCircuit,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  roles?: string[];
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  collapsed?: boolean;
}

/**
 * Канонічна навігація PREDATOR Analytics v56.1
 * Синхронізована з AppRoutesNew.tsx
 * Усі шляхи відповідають реальним маршрутам
 */
export const navigationConfig: NavSection[] = [
  {
    id: 'command',
    label: 'Командний Центр',
    items: [
      { id: 'dashboard', label: 'Панель управління', path: '/', icon: LayoutDashboard },
      { id: 'overview', label: 'Огляд системи', path: '/overview', icon: Eye },
      { id: 'omni', label: 'Omniscience', path: '/omni', icon: Layers },
      { id: 'monitoring', label: 'Моніторинг', path: '/monitoring', icon: Activity },
      { id: 'morning-brief', label: 'Ранковий брифінг', path: '/morning-brief', icon: Compass },
    ],
  },
  {
    id: 'intelligence',
    label: 'Корпоративна Розвідка',
    items: [
      { id: 'intelligence', label: 'Центр Розвідки', path: '/intelligence', icon: Radar },
      { id: 'market', label: 'Аналіз Ринку', path: '/market', icon: TrendingUp },
      { id: 'forecast', label: 'Прогнозування', path: '/forecast', icon: Target },
      { id: 'diligence', label: 'Due Diligence', path: '/diligence', icon: Search },
      { id: 'opportunities', label: 'Можливості', path: '/opportunities', icon: Briefcase },
      { id: 'competitor-intel', label: 'Конкуренти', path: '/competitor-intel', icon: Eye },
      { id: 'modeling', label: 'Моделювання', path: '/modeling', icon: FlaskConical },
    ],
  },
  {
    id: 'customs',
    label: 'Митна Розвідка',
    items: [
      { id: 'customs-intel', label: 'Митна аналітика', path: '/customs-intel', icon: Shield },
      { id: 'customs-premium', label: 'Customs Pro', path: '/customs-premium', icon: Shield, badge: 'PRO' },
      { id: 'aml', label: 'AML Скоринг', path: '/aml', icon: AlertTriangle },
      { id: 'sanctions', label: 'Санкції', path: '/sanctions', icon: Scale },
      { id: 'risk-scoring', label: 'Ризик-скоринг', path: '/risk-scoring', icon: Target },
      { id: 'trade-map', label: 'Карта торгівлі', path: '/trade-map', icon: Globe },
      { id: 'price-compare', label: 'Порівняння цін', path: '/price-compare', icon: BarChart3 },
    ],
  },
  {
    id: 'osint',
    label: 'OSINT та Реєстри',
    items: [
      { id: 'search', label: 'Пошуковий центр', path: '/search', icon: Search },
      { id: 'graph', label: 'Граф зв\'язків', path: '/graph', icon: Network },
      { id: 'entity-graph', label: 'Entity Graph', path: '/entity-graph', icon: Network },
      { id: 'registries', label: 'Реєстри', path: '/registries', icon: Database },
      { id: 'tenders', label: 'Тендери', path: '/tenders', icon: Briefcase },
      { id: 'maritime', label: 'Морський трафік', path: '/maritime', icon: Ship },
      { id: 'datagov', label: 'Держреєстри', path: '/datagov', icon: Landmark },
      { id: 'documents', label: 'Документи', path: '/documents', icon: FileText },
    ],
  },
  {
    id: 'analytics-tools',
    label: 'Аналітичний Арсенал',
    items: [
      { id: 'analytics', label: 'Аналітика', path: '/analytics', icon: BarChart3 },
      { id: 'reports', label: 'Звіти', path: '/reports', icon: FileText },
      { id: 'builder', label: 'Дашборд білдер', path: '/builder', icon: Blocks },
      { id: 'charts', label: 'Чарти Pro', path: '/charts', icon: LineChart },
      { id: 'realtime', label: 'Реалтайм', path: '/realtime', icon: Activity, badge: 'LIVE' },
      { id: 'market-analytics', label: 'Market Analytics', path: '/market-analytics', icon: TrendingUp },
    ],
  },
  {
    id: 'clients',
    label: 'Клієнти',
    items: [
      { id: 'clients', label: 'Клієнтський центр', path: '/clients', icon: Users },
      { id: 'referral-control', label: 'Реферальний контроль', path: '/referral-control', icon: Users },
      { id: 'suppliers', label: 'Постачальники', path: '/suppliers', icon: Building2 },
    ],
  },
  {
    id: 'client-arsenal',
    label: 'Клієнтський Арсенал',
    items: [
      { id: 'newspaper', label: 'Ранкова Газета', path: '/newspaper', icon: Newspaper },
      { id: 'compromat', label: 'Досьє персони', path: '/compromat-person', icon: FileText },
      { id: 'compromat-firm', label: 'Досьє компанії', path: '/compromat-firm', icon: Building2 },
      { id: 'power-structure', label: 'Структура влади', path: '/power-structure', icon: Landmark },
      { id: 'supply-chain', label: 'Ланцюги постачання', path: '/supply-chain', icon: Box },
    ],
  },
  {
    id: 'ai-autonomy',
    label: 'ШІ та Автономність',
    items: [
      { id: 'llm', label: 'LLM Studio', path: '/llm', icon: Brain },
      { id: 'agents', label: 'Агенти', path: '/agents', icon: Users },
      { id: 'knowledge', label: 'База знань', path: '/knowledge', icon: BrainCircuit },
      { id: 'ai-insights', label: 'AI Інсайти', path: '/ai-insights', icon: Zap },
      { id: 'super', label: 'Суперінтелект', path: '/super', icon: Brain, badge: 'α' },
      { id: 'training', label: 'Тренування моделей', path: '/training', icon: Cpu },
      { id: 'engines', label: 'Двигуни', path: '/engines', icon: Cpu },
      { id: 'ai-control', label: 'AI Control Plane', path: '/admin/ai-control', icon: Zap, roles: ['admin'] },
    ],
  },
  {
    id: 'factory',
    label: 'Фабрика',
    items: [
      { id: 'system-factory', label: 'System Factory', path: '/system-factory', icon: Factory },
      { id: 'factory-studio', label: 'Factory Studio', path: '/factory-studio', icon: Wrench },
      { id: 'pipeline', label: 'Пайплайни', path: '/pipeline', icon: Workflow },
      { id: 'components', label: 'Компоненти', path: '/components', icon: Blocks },
      { id: 'autonomy', label: 'Автономність', path: '/autonomy', icon: Zap, roles: ['admin'] },
    ],
  },
  {
    id: 'data-platform',
    label: 'Платформа Даних',
    items: [
      { id: 'data', label: 'Сховище даних', path: '/data', icon: Database },
      { id: 'ingestion', label: 'Завантаження', path: '/ingestion', icon: Upload },
      { id: 'parsers', label: 'Парсери', path: '/parsers', icon: ScrollText },
      { id: 'databases', label: 'Бази даних', path: '/databases', icon: Database },
      { id: 'datasets', label: 'Датасети', path: '/datasets', icon: Layers },
      { id: 'export', label: 'Експорт', path: '/export', icon: Upload },
    ],
  },
  {
    id: 'administration',
    label: 'Адміністрування',
    items: [
      { id: 'governance', label: 'Sovereign Governance', path: '/governance', icon: Shield, roles: ['admin'] },
      { id: 'security', label: 'Безпека', path: '/security', icon: Lock },
      { id: 'compliance', label: 'Комплаєнс', path: '/compliance', icon: Scale },
      { id: 'deployment', label: 'Деплоймент', path: '/deployment', icon: Globe },
      { id: 'settings', label: 'Налаштування', path: '/settings', icon: Settings },
    ],
  },
];
