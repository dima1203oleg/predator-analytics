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
  neutral: 'border-red-900/20 bg-red-950/10 text-slate-300',
  info:    'border-amber-500/25 bg-amber-950/15 text-amber-200',
  success: 'border-emerald-500/25 bg-emerald-950/15 text-emerald-200',
  warning: 'border-red-500/35 bg-red-900/20 text-red-300',
  danger:  'border-red-600/50 bg-red-900/25 text-red-400',
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
      className="surface-panel-strong sticky top-[5.5rem] z-[60] hidden h-[calc(100vh-7rem)] overflow-hidden border border-red-900/30 shadow-[0_0_60px_rgba(220,38,38,0.06),0_20px_50px_rgba(2,6,23,0.6)] xl:flex xl:flex-col"
      style={{ background: 'linear-gradient(180deg,rgba(5,2,2,0.97) 0%,rgba(8,3,3,0.95) 100%)' }}
    >
      {/* Ред top accent лінія */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-red-700/50 to-transparent" />

      <div className="border-b border-red-900/25 px-5 py-4">
        {/* заголовок панелі */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse" />
              <div className="text-[7px] font-black uppercase tracking-[0.55em] text-red-700/80">
                INTEL · CLASSIFIED CONTEXT
              </div>
            </div>
            <div className="text-[13px] font-black tracking-tight text-white leading-snug">{effectivePayload.title}</div>
            <div className="mt-1.5 text-[11px] leading-5 text-slate-500">{effectivePayload.subtitle}</div>
          </div>
          <button
            type="button"
            aria-label="Згорнути контекстну панель"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-red-900/40 bg-red-950/20 text-red-800 transition hover:border-red-700/60 hover:bg-red-900/30 hover:text-red-500"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className={cn(
          'mt-3 inline-flex items-center gap-1.5 border px-2.5 py-1 text-[8px] font-black tracking-[0.3em] uppercase',
          toneClasses[effectivePayload.status.tone]
        )}>
          <div className="w-1 h-1 rounded-full bg-current opacity-70" />
          {effectivePayload.status.label}
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 custom-scrollbar">
        <section className="space-y-2">
          <div className="text-[7px] font-black uppercase tracking-[0.5em] text-red-800/70 flex items-center gap-2">
            <div className="h-px flex-1 bg-red-900/30" />
            ДІЇ
            <div className="h-px flex-1 bg-red-900/30" />
          </div>
          <div className="space-y-2">
            {effectivePayload.actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleAction(action)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 border px-4 py-3 text-left transition hover:border-red-700/40 hover:bg-red-950/20',
                  toneClasses[action.tone ?? 'neutral'],
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-red-900/40 bg-red-950/20 text-red-700">
                    <action.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-black text-white tracking-wide">{action.label}</div>
                    <div className="mt-0.5 text-[9px] leading-4 text-slate-600">{action.description}</div>
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

      {/* Sovereign Footer */}
      <div className="border-t border-red-900/20 px-5 py-4">
        <div className="text-[6px] font-black uppercase tracking-[0.55em] text-red-900/50 text-center">
          PREDATOR · INTEL CONTEXT RAIL · CLASSIFIED
        </div>
      </div>
      </div>
    </aside>
  );
};

export default ContextRail;
