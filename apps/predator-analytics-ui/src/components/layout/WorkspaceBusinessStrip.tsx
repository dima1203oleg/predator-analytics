/**
 * Компактна бізнес-підказка під верхньою панеллю: зрозуміло для будь-якої галузі та рівня підготовки.
 */
import { Button } from '@/components/ui/button';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronsDown, ChevronsUp, PanelRight, Search, Sparkles } from 'lucide-react';
import { useAtom } from 'jotai';
import { useUser } from '@/context/UserContext';
import { getNavigationContext } from '@/config/navigation';
import {
  buildWorkspaceGuidanceLine,
  buildWorkspaceGuidanceTitle,
} from '@/config/workspaceBusinessHints';
import { shellCommandPaletteOpenAtom, shellContextRailOpenAtom } from '@/store/atoms';
import { isShellV2Enabled } from '@/services/shell/userWorkspace';
import { cn } from '@/utils/cn';

const STORAGE_KEY = 'predator-workspace-strip-collapsed';

export const WorkspaceBusinessStrip: React.FC = () => {
  const location = useLocation();
  const { user } = useUser();
  const role = user?.role ?? 'viewer';
  const [, setPaletteOpen] = useAtom(shellCommandPaletteOpenAtom);
  const [contextOpen, setContextOpen] = useAtom(shellContextRailOpenAtom);
  const shellV2 = isShellV2Enabled();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const { item, section } = useMemo(
    () => getNavigationContext(location.pathname + location.search, role),
    [location.pathname, location.search, role],
  );

  const title = useMemo(
    () =>
      buildWorkspaceGuidanceTitle({
        pathname: location.pathname,
        sectionLabel: section?.label,
        itemLabel: item?.label,
      }),
    [item?.label, location.pathname, section?.label],
  );

  const detail = useMemo(
    () =>
      buildWorkspaceGuidanceLine({
        pathname: location.pathname,
        sectionOutcome: section?.outcome,
        itemDescription: item?.description,
      }),
    [item?.description, location.pathname, section?.outcome],
  );

  return (
    <div
      className="border-b border-white/[0.06] bg-[rgba(15,15,17,0.97)]"
      data-testid="workspace-business-strip"
    >
      <div className="mx-auto flex max-w-[1920px] flex-col gap-2 px-3 py-2 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-7 xl:px-10">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-300/95">{title}</div>
            {!collapsed && (
              <p className="mt-1 text-[12px] leading-snug text-slate-400">{detail}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <Button variant="cyber"
            type="button"
            onClick={() => setPaletteOpen(true)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-sky-500/35 hover:bg-sky-500/[0.06] hover:text-white',
            )}
          >
            <Search className="h-3.5 w-3.5 text-sky-400" aria-hidden />
            Швидкий пошук
            <kbd className="hidden rounded border border-white/15 bg-black/50 px-1 py-0.5 font-mono text-[9px] text-slate-500 sm:inline">
              ⌘K
            </kbd>
          </Button>

          {shellV2 && (
            <Button variant="cyber"
              type="button"
              onClick={() => setContextOpen((v) => !v)}
              title={contextOpen ? 'Сховати контекстну панель' : 'Показати контекстну панель'}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition',
                contextOpen
                  ? 'border-indigo-500/35 bg-indigo-500/10 text-indigo-200'
                  : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white',
              )}
            >
              <PanelRight className="h-3.5 w-3.5" aria-hidden />
              Контекст
            </Button>
          )}

          <Button variant="cyber"
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition hover:border-white/20 hover:text-slate-300"
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <>
                Детальніше
                <ChevronsDown className="h-3.5 w-3.5" aria-hidden />
              </>
            ) : (
              <>
                Згорнути
                <ChevronsUp className="h-3.5 w-3.5" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceBusinessStrip;
