/**
 * Короткі бізнес-підказки для робочого простору (українською).
 * Доповнюють описи з навігації там, де контекст загальний.
 */

const DEFAULT_DETAIL =
  'Обирайте модуль у меню зліва або натисніть ⌘K / Ctrl+K, щоб швидко знайти звіт, контрагента чи дію. Праворуч — контекст і наступні кроки.';

const PREFIX_HINTS: Array<{ prefix: string; title: string; detail: string }> = [
  {
    prefix: '/command',
    title: 'Командний центр',
    detail:
      'Огляд KPI, брифінгу та ризиків на одному екрані. Зручно для керівництва будь-якої галузі: від виробництва до послуг.',
  },
  {
    prefix: '/market',
    title: 'Ринок і попит',
    detail: 'Аналізуйте тренди та попит, щоб планувати закупівлі, продажі й логістику на основі даних.',
  },
  {
    prefix: '/search',
    title: 'Пошук і перевірки',
    detail: 'Швидко знаходьте компанії, декларації та звʼязки — для комплаєнсу, закупівель і партнерських перевірок.',
  },
  {
    prefix: '/osint',
    title: 'Зовнішні джерела',
    detail: 'Зʼєднуйте відкриті дані з внутрішніми сигналами для повної картини по контрагенту або регіону.',
  },
  {
    prefix: '/financial',
    title: 'Фінанси та ризики',
    detail: 'Оцінюйте платоспроможність і фрод-сигнали перед угодою або кредитним рішенням.',
  },
  {
    prefix: '/agents',
    title: 'ШІ та автоматизація',
    detail: 'Ставте запитання природною мовою та отримуйте чернетки звітів і перевірок — економте час аналітиків.',
  },
  {
    prefix: '/system',
    title: 'Система та доступи',
    detail: 'Контролюйте стан сервісів і ролі команди, щоб платформа залишалась стабільною для бізнесу.',
  },
  {
    prefix: '/admin',
    title: 'Адміністрування',
    detail: 'Налаштування інфраструктури та політик для безпечної роботи всіх контурів.',
  },
];

function normalizePath(pathname: string): string {
  const base = pathname.split('?')[0] ?? '/';
  if (base === '' || base === '/') return '/';
  return base.endsWith('/') && base.length > 1 ? base.slice(0, -1) : base;
}

export function resolveWorkspaceBusinessHint(pathname: string): { title: string; detail: string } | null {
  const path = normalizePath(pathname);
  const hit = PREFIX_HINTS.find((row) => path === row.prefix || path.startsWith(`${row.prefix}/`));
  if (!hit) return null;
  return { title: hit.title, detail: hit.detail };
}

export function buildWorkspaceGuidanceLine(options: {
  pathname: string;
  sectionOutcome?: string;
  itemDescription?: string;
}): string {
  const fromNav = options.itemDescription?.trim() || options.sectionOutcome?.trim();
  if (fromNav && fromNav.length > 0) {
    return fromNav.length > 280 ? `${fromNav.slice(0, 277)}…` : fromNav;
  }

  const prefixHint = resolveWorkspaceBusinessHint(options.pathname);
  if (prefixHint) return prefixHint.detail;

  return DEFAULT_DETAIL;
}

export function buildWorkspaceGuidanceTitle(options: {
  pathname: string;
  sectionLabel?: string;
  itemLabel?: string;
}): string {
  if (options.itemLabel?.trim()) return `Зараз: ${options.itemLabel.trim()}`;
  if (options.sectionLabel?.trim()) return `Розділ: ${options.sectionLabel.trim()}`;

  const prefixHint = resolveWorkspaceBusinessHint(options.pathname);
  if (prefixHint) return prefixHint.title;

  return 'Як користуватися платформою';
}
