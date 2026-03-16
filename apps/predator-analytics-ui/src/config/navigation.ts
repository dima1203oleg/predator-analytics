import { UserRole } from './roles';

export interface NavItem {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  path: string;
  roles: UserRole[];
  premiumOnly?: boolean;
  adminOnly?: boolean;
}

export const NAVIGATION_CONFIG: Record<string, NavItem[]> = {
  // Дашборд – базовий огляд системи
  dashboard: [
    {
      id: 'overview',
      label: 'Огляд',
      icon: 'Home',
      path: '/overview',
      roles: [UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM],
    },
    {
      id: 'profile',
      label: 'Профіль',
      icon: 'User',
      path: '/profile',
      roles: [UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM],
    },
  ],
  // Аналітика – преміум‑фічі
  analytics: [
    {
      id: 'dashboards',
      label: 'Дашборди',
      icon: 'LayoutDashboard',
      path: '/dashboards',
      roles: [UserRole.CLIENT_PREMIUM],
      premiumOnly: true,
    },
    {
      id: 'visualAnalytics',
      label: 'Візуальна Аналітика',
      icon: 'BarChart3',
      path: '/analytics',
      roles: [UserRole.CLIENT_PREMIUM],
      premiumOnly: true,
    },
    {
      id: 'relations',
      label: 'Звʼязки',
      icon: 'Network',
      path: '/relations',
      roles: [UserRole.CLIENT_PREMIUM],
      premiumOnly: true,
    },
    {
      id: 'timelines',
      label: 'Часові Лінії',
      icon: 'Clock',
      path: '/timelines',
      roles: [UserRole.CLIENT_PREMIUM],
      premiumOnly: true,
    },
    {
      id: 'opensearch',
      label: 'Пошукова Аналітика',
      icon: 'Database',
      path: '/opensearch',
      roles: [UserRole.CLIENT_PREMIUM],
      premiumOnly: true,
    },
  ],
  // Джерела даних – доступ до сховищ та інжесту
  dataSources: [
    {
      id: 'search',
      label: 'Пошук',
      icon: 'Search',
      path: '/search',
      roles: [UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM],
    },
    {
      id: 'newspaper',
      label: 'Ранкова Газета',
      icon: 'Newspaper',
      path: '/newspaper',
      roles: [UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM],
    },
  ],
  // Конвеєри – статуси ETL / Kafka
  pipelines: [
    {
      id: 'trends',
      label: 'Тренди',
      icon: 'TrendingUp',
      path: '/trends',
      roles: [UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM],
    },
  ],
  // Моделі – ML‑моделі та їх моніторинг
  models: [],
  // Аномалії – виявлення та індикатори
  anomalies: [],
  // Звіти – готові PDF/CSV звіти
  reports: [
    {
      id: 'reports',
      label: 'Звіти',
      icon: 'FileText',
      path: '/reports',
      roles: [UserRole.CLIENT_BASIC, UserRole.CLIENT_PREMIUM],
    },
  ],
  // Система моніторингу – адміністрування та статуси
  systemMonitoring: [
    {
      id: 'systemStatus',
      label: 'Стан Системи',
      icon: 'Activity',
      path: '/admin/status',
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
    {
      id: 'infrastructure',
      label: 'Інфраструктура',
      icon: 'Server',
      path: '/admin/infra',
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
    {
      id: 'services',
      label: 'Сервіси',
      icon: 'Boxes',
      path: '/admin/services',
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
    {
      id: 'modelsAdmin',
      label: 'Моделі',
      icon: 'Brain',
      path: '/admin/models',
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
    {
      id: 'users',
      label: 'Користувачі та Ролі',
      icon: 'Users',
      path: '/admin/users',
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
    {
      id: 'audit',
      label: 'Журнали та Аудит',
      icon: 'ScrollText',
      path: '/admin/audit',
      roles: [UserRole.ADMIN],
      adminOnly: true,
    },
  ],
  // Налаштування – користувацькі та системні налаштування
  settings: [],
};
