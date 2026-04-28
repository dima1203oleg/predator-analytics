import {
  BarChart3,
  Bot,
  Compass,
  FileText,
  type LucideIcon,
  Sparkles,
} from 'lucide-react';
import type { VisibleNavItem } from '@/config/navigation';
import type { CommandPaletteEntry } from '@/types/shell';

export interface CommandPaletteProviderContext {
  visibleItems: VisibleNavItem[];
  recommendedItems: VisibleNavItem[];
  favoriteIds: string[];
  recentIds: string[];
}

type ProviderResult = CommandPaletteEntry[] | Promise<CommandPaletteEntry[]>;

export interface CommandPaletteProvider {
  id: string;
  getEntries: (context: CommandPaletteProviderContext) => ProviderResult;
}

const SOURCE_PRIORITY: Record<string, number> = {
  favorite: 4,
  recent: 3,
  recommended: 2,
  route: 1,
};

const resolveRouteKind = (item: VisibleNavItem, context: CommandPaletteProviderContext): CommandPaletteEntry['kind'] => {
  if (context.favoriteIds.includes(item.id)) {
    return 'favorite';
  }

  if (context.recentIds.includes(item.id)) {
    return 'recent';
  }

  if (context.recommendedItems.some((recommended) => recommended.id === item.id)) {
    return 'recommended';
  }

  return 'route';
};

const resolveRouteSource = (item: VisibleNavItem, context: CommandPaletteProviderContext): string => {
  const sources: Array<{ id: string; label: string }> = [
    context.favoriteIds.includes(item.id) ? { id: 'favorite', label: 'Обране' } : null,
    context.recentIds.includes(item.id) ? { id: 'recent', label: 'Нещодавнє' } : null,
    context.recommendedItems.some((recommended) => recommended.id === item.id)
      ? { id: 'recommended', label: 'ШІ-рекомендації' }
      : null,
    { id: 'route', label: item.sectionLabel },
  ].filter((source): source is { id: string; label: string } => Boolean(source));

  return sources
    .sort((left, right) => (SOURCE_PRIORITY[right.id] ?? 0) - (SOURCE_PRIORITY[left.id] ?? 0))
    .map((source) => source.label)
    .slice(0, 2)
    .join(' • ');
};

const buildRouteEntries = (context: CommandPaletteProviderContext): CommandPaletteEntry[] =>
  context.visibleItems.map((item) => ({
    id: item.id,
    label: item.label,
    subtitle: `${item.sectionLabel}${item.group ? ` • ${item.group}` : ''} • ${item.description}`,
    kind: resolveRouteKind(item, context),
    icon: item.icon,
    path: item.path,
    keywords: [
      item.label,
      item.description,
      item.path,
      item.sectionLabel,
      item.sectionDescription,
      item.sectionOutcome,
      item.group ?? '',
    ].filter(Boolean),
    source: resolveRouteSource(item, context),
  }));

const createAssistantEntry = (
  id: string,
  label: string,
  subtitle: string,
  icon: LucideIcon,
  action: CommandPaletteEntry['action'],
  path: string,
  keywords: string[],
): CommandPaletteEntry => ({
  id,
  label,
  subtitle,
  kind: 'assistant',
  icon,
  action,
  path,
  source: 'ШІ-дія',
  keywords,
});

const buildAssistantEntries = (): CommandPaletteEntry[] => [
  createAssistantEntry(
    'assistant-ask',
    'Запитати ШІ',
    'Відкрити агентський контур і поставити питання',
    Bot,
    'ask-ai',
    '/agents',
    ['запитати', 'шi', 'асистент', 'агенти', 'аналiз'],
  ),
  createAssistantEntry(
    'assistant-report',
    'Згенерувати звіт',
    'Перейти в контур звітів і сформувати матеріал',
    FileText,
    'generate-report',
    '/reports',
    ['звiт', 'експорт', 'pdf', 'аналітика'],
  ),
  createAssistantEntry(
    'assistant-analyze',
    'Проаналізувати',
    'Відкрити інсайти або розвідку для наступного кроку',
    Sparkles,
    'analyze',
    '/ai-insights',
    ['аналiз', 'інсайти', 'можливості', 'ризик'],
  ),
  createAssistantEntry(
    'assistant-agents',
    'Перейти до агентів',
    'Швидкий перехід у модуль автономних агентів',
    Compass,
    'open-agents',
    '/agents',
    ['агенти', 'автоматизація', 'copilot', 'шi'],
  ),
  createAssistantEntry(
    'assistant-market',
    'Відкритиринковий аналіз',
    'Перейти до ринку та перевірити наступну можливість',
    BarChart3,
    'analyze',
    '/market',
    ['ринок', 'конкуренти', 'можливість', 'торгівля'],
  ),
];

export const navigationPaletteProvider: CommandPaletteProvider = {
  id: 'navigation',
  getEntries: buildRouteEntries,
};

export const assistantPaletteProvider: CommandPaletteProvider = {
  id: 'assistant',
  getEntries: () => buildAssistantEntries(),
};

export const defaultCommandPaletteProviders: CommandPaletteProvider[] = [
  navigationPaletteProvider,
  assistantPaletteProvider,
];

export const resolveCommandPaletteEntries = async (
  context: CommandPaletteProviderContext,
  providers: CommandPaletteProvider[] = defaultCommandPaletteProviders,
): Promise<CommandPaletteEntry[]> => {
  const parts = await Promise.all(providers.map((provider) => provider.getEntries(context)));
  return parts.flat();
};
