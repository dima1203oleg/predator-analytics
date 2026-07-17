/**
 * Специфікація екрану для workflow figma-generate-design (головний шелл PREDATOR).
 * Джерело структури: MainLayout, Header, WorkspaceBusinessStrip, Sidebar, ContextRail, статус-бар.
 *
 * Після авторизації MCP Figma задайте FIGMA_TARGET_FILE_KEY або передайте fileKey у use_figma.
 */

export const FIGMA_TARGET_ENV = 'FIGMA_TARGET_FILE_KEY' as const;

/** Ідентифікатор макета у Figma (ім’я wrapper frame). */
export const SHELL_FRAME_NAME = 'PREDATOR_MainShell_Desktop' as const;

export interface ShellSectionSpec {
  /** Унікальний id для імен у Figma */
  id: string;
  /** Людочитна назва секції */
  nameUk: string;
  /** Файли-код для зіставлення з компонентами */
  sourcePaths: string[];
  /** Типові примітиви для пошуку в дизайн-системі */
  designSystemHints: string[];
}

/**
 * Секції для збірки зверху вниз (desktop; Sidebar окремо зліва від основної колонки).
 */
export const mainShellSections: ShellSectionSpec[] = [
  {
    id: 'sidebar',
    nameUk: 'Бічна навігація',
    sourcePaths: ['src/components/layout/Sidebar.tsx'],
    designSystemHints: ['navigation', 'sidebar', 'list', 'icon'],
  },
  {
    id: 'infraBanner',
    nameUk: 'Банер інфраструктури',
    sourcePaths: ['src/components/InfrastructureFailoverBanner.tsx'],
    designSystemHints: ['banner', 'alert'],
  },
  {
    id: 'header',
    nameUk: 'Верхня панель (breadcrumb, заголовок, пошук, профіль)',
    sourcePaths: ['src/components/layout/Header.tsx'],
    designSystemHints: ['header', 'input', 'button', 'avatar', 'badge'],
  },
  {
    id: 'workspaceStrip',
    nameUk: 'Смуга бізнес-підказки робочого простору',
    sourcePaths: ['src/components/layout/WorkspaceBusinessStrip.tsx'],
    designSystemHints: ['inline', 'button', 'kbd'],
  },
  {
    id: 'mainGrid',
    nameUk: 'Основна сітка контенту (9/12) та контекстна колонка (3/12)',
    sourcePaths: ['src/components/layout/MainLayout.tsx'],
    designSystemHints: ['grid', 'panel', 'card'],
  },
  {
    id: 'statusBar',
    nameUk: 'Нижній статус-бар (метрики, OSINT, кластер, API/WEB, ELITE)',
    sourcePaths: ['src/components/layout/MainLayout.tsx'],
    designSystemHints: ['footer', 'mono', 'pill'],
  },
];

/** Layout: ширина контенту як у max-w-[1920px]. */
export const SHELL_LAYOUT = {
  contentMaxWidthPx: 1920,
  /** Пропорція головної колонки при увімкненому ContextRail (desktop xl). */
  mainColsWithRail: { main: 9, rail: 3 },
} as const;

/** У репозиторії немає Code Connect (*.figma.ts / *.figma.tsx) — ключі компонентів лише з файлу бібліотеки або search_design_system. */
export const CODE_CONNECT_STATUS = 'none_in_repo' as const;
