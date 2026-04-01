import React, { useMemo } from 'react';
import { useAtom } from 'jotai';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  FileText,
  FolderOpen,
  Network,
  PanelRightClose,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNavigationContext, getRecommendedNavigation } from '@/config/navigation';
import { useUser } from '@/context/UserContext';
import { useShellWorkspace } from '@/hooks/useShellWorkspace';
import { cn } from '@/lib/utils';
import {
  shellCommandPaletteOpenAtom,
  shellContextRailOpenAtom,
  shellContextRailPayloadAtom,
} from '@/store/atoms';
import type {
  ContextRailAction,
  ContextRailMetric,
  ContextRailPayload,
  ContextRailRisk,
} from '@/types/shell';

const toneClasses = {
  neutral: 'border-white/[0.08] bg-white/[0.03] text-slate-300',
  info: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200',
  success: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
  danger: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
} as const;

const SectionList = ({
  title,
  items,
}: {
  title: string;
  items: Array<ContextRailMetric | ContextRailRisk>;
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{title}</div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-[20px] border px-4 py-3',
              toneClasses[item.tone ?? 'neutral'],
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold text-white">{item.label}</div>
              {'value' in item && <div className="text-sm font-black">{item.value}</div>}
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const buildFallbackPayload = (
  pathname: string,
  role: string,
  favorites: Set<string>,
  recommendedPaths: string[],
): ContextRailPayload => {
  const { item, section } = getNavigationContext(pathname, role);
  const recommended = getRecommendedNavigation(role, 3);

  return {
    entityId: item?.id ?? section?.id ?? 'fallback',
    entityType: item ? 'маршрут' : 'секція',
    title: item?.label ?? section?.label ?? 'Операційний контекст',
    subtitle:
      item?.description ??
      section?.outcome ??
      'Контекст для поточного маршруту поки не визначено, але shell залишається доступним.',
    status: {
      label: item ? 'Активний модуль' : 'Готовий контур',
      tone: item ? 'info' : 'neutral',
    },
    actions: [
      {
        id: 'fallback-ai',
        label: 'Запитати ШІ',
        description: 'Перейти до агентів і поставити питання по поточному маршруту',
        icon: Bot,
        tone: 'info',
        path: '/agents',
      },
      {
        id: 'fallback-favorite',
        label: favorites.has(item?.id ?? '') ? 'Закріплено в обраному' : 'Додати в обране',
        description: favorites.has(item?.id ?? '')
          ? 'Поточний маршрут уже закріплений у швидкому доступі'
          : 'Закріпити поточний маршрут у верхньому шарі shell',
        icon: Star,
        tone: favorites.has(item?.id ?? '') ? 'success' : 'neutral',
        action: item ? 'favorite-current' : undefined,
      },
      {
        id: 'fallback-documents',
        label: 'Відкрити документи',
        description: 'Швидкий перехід до документального контуру для поточного сценарію',
        icon: FolderOpen,
        tone: 'neutral',
        path: '/documents',
      },
      {
        id: 'fallback-agent',
        label: 'Запустити агента',
        description: 'Відкрити агентський контур і перейти до автоматизації',
        icon: Zap,
        tone: 'warning',
        path: '/agents',
      },
    ],
    insights: recommended.map((entry, index) => ({
      id: `recommended-${entry.id}`,
      label: index === 0 ? 'Найкращий наступний крок' : entry.label,
      value: entry.sectionLabel,
      detail: entry.description,
      tone: recommendedPaths.includes(entry.path) ? 'info' : 'neutral',
    })),
    relations: section
      ? [
          {
            id: `section-${section.id}`,
            label: 'Бізнес-блок',
            value: section.label,
            detail: section.outcome,
            tone: 'neutral',
          },
        ]
      : [],
    documents: item
      ? [
          {
            id: `document-${item.id}`,
            label: item.label,
            detail: `${item.path} • ${section?.label ?? 'Системи'}`,
            path: item.path,
          },
        ]
      : [],
    risks: [
      {
        id: 'fallback-risk',
        label: 'Контекст не передано зі сторінки',
        detail: 'Для цього маршруту працює fallback-rail з рекомендаціями та швидкими діями shell.',
        tone: 'warning',
      },
    ],
    sourcePath: pathname,
  };
};

export const ContextRail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const role = user?.role ?? 'viewer';
  const [isOpen, setIsOpen] = useAtom(shellContextRailOpenAtom);
  const [payload] = useAtom(shellContextRailPayloadAtom);
  const [, setCommandPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
  const { favoriteIdSet, recommendedItems, toggleFavorite } = useShellWorkspace(role);
  const fallback = useMemo(
    () =>
      buildFallbackPayload(
        location.pathname,
        role,
        favoriteIdSet,
        recommendedItems.map((item) => item.path),
      ),
    [favoriteIdSet, location.pathname, recommendedItems, role],
  );
  const effectivePayload = payload?.sourcePath === location.pathname ? payload : fallback;

  if (!isOpen) {
    return null;
  }

  const handleAction = (action: ContextRailAction) => {
    if (action.action === 'favorite-current') {
      const currentRoute = getNavigationContext(location.pathname, role);
      const currentId =
        effectivePayload.entityType === 'маршрут'
          ? effectivePayload.entityId
          : currentRoute.item?.id ?? null;
      if (currentId) {
        toggleFavorite(currentId);
      }
      return;
    }

    if (action.action === 'open-palette') {
      setCommandPaletteOpen(true);
      return;
    }

    if (action.action === 'ask-ai') {
      setCommandPaletteOpen(true);
      return;
    }

    if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <aside
      data-testid="context-rail"
      className="surface-panel-strong sticky top-[5.5rem] z-[60] hidden h-[calc(100vh-7rem)] overflow-hidden rounded-[30px] border border-white/[0.06] shadow-[0_20px_50px_rgba(2,6,23,0.5)] xl:flex xl:flex-col"
    >
      <div className="border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              Контекстна панель
            </div>
            <div className="mt-2 text-xl font-black tracking-tight text-white">{effectivePayload.title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">{effectivePayload.subtitle}</div>
          </div>
          <button
            type="button"
            aria-label="Згорнути контекстну панель"
            onClick={() => setIsOpen(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <div className={cn('mt-4 inline-flex rounded-full border px-3 py-1 text-[11px] font-bold', toneClasses[effectivePayload.status.tone])}>
          {effectivePayload.status.label}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 custom-scrollbar">
        <section className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Дії</div>
          <div className="space-y-2">
            {effectivePayload.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-[20px] border px-4 py-3 text-left transition hover:border-white/[0.14] hover:bg-white/[0.05]',
                  toneClasses[action.tone ?? 'neutral'],
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/[0.08] bg-black/20">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{action.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{action.description}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
              </button>
            ))}
          </div>
        </section>

        <SectionList title="ШІ-інсайти" items={effectivePayload.insights} />
        <SectionList title="Звʼязки" items={effectivePayload.relations} />

        {effectivePayload.documents.length > 0 && (
          <section className="space-y-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Документи</div>
            <div className="space-y-2">
              {effectivePayload.documents.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => document.path && navigate(document.path)}
                  className="flex w-full items-center justify-between gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left text-slate-300 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/[0.08] bg-black/20 text-slate-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{document.label}</div>
                      <div className="mt-1 text-xs text-slate-400">{document.detail}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
                </button>
              ))}
            </div>
          </section>
        )}

        <SectionList title="Ризики" items={effectivePayload.risks} />

        <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-4 text-sm leading-6 text-slate-300">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
            <Network className="h-3.5 w-3.5" />
            Shell v2
          </div>
          Права панель тримає контекст поруч із дією, щоб користувач не перемикався між розділами під час рішення.
        </div>
      </div>
    </aside>
  );
};

export default ContextRail;
