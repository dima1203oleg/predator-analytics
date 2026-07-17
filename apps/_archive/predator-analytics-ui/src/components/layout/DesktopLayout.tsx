/**
 * 🛡️ MAIN LAYOUT // ГОЛОВНИЙ ШЕЛЛ | v63.0-ELITE (WAR-GAMING)
 * Підтримка гібридного вузла та суверенного дизайну.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import Header from './Header';
import ChatBot from '../ai/ChatBot';
import ContextRail from './ContextRail';
import ShellCommandPalette from './ShellCommandPalette';
import BottomNav from './BottomNav';
import { SystemMetricsHUD } from './SystemMetricsHUD';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useViewport } from '@/hooks/useViewport';
import { AdaptiveNavigation } from './AdaptiveNavigation';
import { isSidebarOpenAtom, shellContextRailOpenAtom } from '../../store/atoms';
import { isShellV2Enabled } from '../../services/shell/userWorkspace';
import { ConstitutionalShield } from '../shared/ConstitutionalShield';
import { useTheme } from '../../context/ThemeContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { InfrastructureFailoverBanner } from '../InfrastructureFailoverBanner';
import { WorkspaceBusinessStrip } from './WorkspaceBusinessStrip';
import { NeuralBackground } from '../ui/NeuralBackground';
import { SovereignEye } from '../ui/SovereignEye';
import { ThreatLevel } from '../ui/ThreatLevel';
import { OrbitalRail } from '../ui/OrbitalRail';
import { Search, LayoutDashboard, Activity, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AnimatedPage } from '../polish/AnimatedPage';
import { API_BASE_URL } from '@/services/api/config';
import { useKeyboardShortcuts, defaultShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppStore } from '@/store/useAppStore';
import { colabPanelOpenAtom, colabNodeDataAtom } from '../../store/atoms';
import { ColabDetailedPanel } from '@/features/infrastructure/components/ColabDetailedPanel';
import { useSystemNodes } from '@/hooks/useAdminApi';
import { DisplayMode, useDisplayMode } from '@/context/DisplayModeContext';
import { CommandPaletteAI } from '../ai-studio/CommandPaletteAI';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

/**
 * Головний Layout PREDATOR Analytics з адаптивним режимом.
 * v63.0: преміальний ambient-фон, анімовані переходи між сторінками,
 * покращений мобільний drawer з backdrop-blur.
 */
export const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  const { isCompact, isMedium, isExpanded, safeArea } = useViewport();
  const isMobile = isCompact;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useAtom(isSidebarOpenAtom);
  const [isContextRailOpen, setIsContextRailOpen] = useAtom(shellContextRailOpenAtom);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { isOffline, nodes: backendNodes } = useBackendStatus();
  const shellV2Enabled = isShellV2Enabled();
  const location = useLocation();
  const navigate = useNavigate();
  const { setCopilotOpen } = useAppStore();

  useKeyboardShortcuts(
    defaultShortcuts(
      (path) => navigate(path),
      () => setCopilotOpen(true),
      () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
    )
  );
  const { mode } = useTheme();
  const { mode: displayMode } = useDisplayMode();
  const displayFrameClass =
    isCompact
      ? 'w-full'
      : isMedium
        ? 'max-w-[940px]'
        : 'max-w-[1920px]';

  const [isColabOpen, setIsColabOpen] = useAtom(colabPanelOpenAtom);
  const [colabNodeData, setColabNodeData] = useAtom(colabNodeDataAtom);
  const { data: systemNodes } = useSystemNodes();

  useEffect(() => {
    if (isColabOpen && !colabNodeData && systemNodes) {
      const node = systemNodes.find((n: any) => n.id === 'colab');
      if (node) setColabNodeData(node);
    }
  }, [isColabOpen, colabNodeData, systemNodes, setColabNodeData]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handlePointerMove = (event: PointerEvent) => {
      const depthX = (event.clientX / window.innerWidth - 0.5) * 18;
      const depthY = (event.clientY / window.innerHeight - 0.5) * 18;
      root.style.setProperty('--predator-depth-x', `${depthX}px`);
      root.style.setProperty('--predator-depth-y', `${depthY}px`);
      root.style.setProperty('--predator-radar-x', `${event.clientX}px`);
      root.style.setProperty('--predator-radar-y', `${event.clientY}px`);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsMobileDrawerOpen(false);
      setIsSidebarExpanded(true);
      setIsContextRailOpen(false);
    }
  }, [isMobile, setIsContextRailOpen, setIsSidebarExpanded]);

  useEffect(() => {
    if (!isMobile && shellV2Enabled) {
      setIsContextRailOpen(true);
    }
  }, [isMobile, setIsContextRailOpen, shellV2Enabled]);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileDrawerOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobileDrawerOpen]);

  return (
    <div
      ref={rootRef}
      data-testid="main-layout"
      data-op-mode={mode}
      data-display-mode={displayMode}
      className="relative flex min-h-screen overflow-hidden bg-[#010101] text-foreground op-mode-transition scan-lines noise-overlay vignette"
    >
      <NeuralBackground />
      {/* Tactical Grid — AURUM OBSIDIAN */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          transform: 'translate3d(calc(var(--predator-depth-x, 0px) * -0.25), calc(var(--predator-depth-y, 0px) * -0.25), 0)',
        }}
      />
      {/* Sovereign Eye — ambient glow реагує на system health */}
      <SovereignEye health="healthy" />

      {/* ── ADAPTIVE NAVIGATION ── */}
      <AdaptiveNavigation />

      {/* Desktop sidebar для expanded/wide */}
      {isExpanded && <Sidebar />}

      {/* Tablet rail замість повного sidebar — керується AdaptiveNavigation */}
      {isMedium && null}

      <InfrastructureFailoverBanner />

      <div
        className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden"
        style={{
          transform: 'translate3d(calc(var(--predator-depth-x, 0px) * 0.08), calc(var(--predator-depth-y, 0px) * 0.08), 0)',
        }}
      >
        <Header />
        <WorkspaceBusinessStrip />
        <div className="classification-banner hidden sm:flex">
          <span className="classification-dot" />
          <span>ЦІЛКОМ ТАЄМНО // СІ // ОСОБЛИВОЇ ВАЖЛИВОСТІ</span>
          <span className="classification-dot" />
          <span className="mx-2 opacity-40">|</span>
          <span>PREDATOR ELITE v64.0-WRAITH</span>
          <span className="mx-2 opacity-40">|</span>
          <span>РІВЕНЬ ДОПУСКУ 6</span>
          <span className="classification-dot" />
          <div className="ml-auto">
            <ThreatLevel level="low" />
          </div>
        </div>
        <main
          className="relative flex-1 overflow-y-auto custom-scrollbar"
          style={{
            paddingBottom: isCompact
              ? `calc(${safeArea.bottom}px + 5.5rem)`
              : '0px',
          }}
        >

          <div className={cn("relative mx-auto px-3 sm:px-5 lg:px-7 py-5 xl:px-10 pb-6 md:pb-16 transition-[max-width] duration-500", displayFrameClass)}>
            <div className={`grid grid-cols-12 gap-6`}>
              <div className={shellV2Enabled && isExpanded && isContextRailOpen ? 'col-span-12 xl:col-span-9' : 'col-span-12'}>
                <AnimatedPage pageKey={location.pathname} variant="tactical">
                  {children}
                </AnimatedPage>
              </div>
              {shellV2Enabled && isExpanded && isContextRailOpen && (
                <div className="col-span-12 xl:col-span-3">
                  <ContextRail />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── FLOATING ORBITAL DOCK — AURUM OBSIDIAN (desktop only) ── */}
        {isExpanded && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
            <OrbitalRail
              items={[
                { id: 'search', label: 'ПОШУК', icon: Search, path: '/search' },
                { id: 'dashboard', label: 'ЦЕНТР', icon: LayoutDashboard, path: '/command' },
                { id: 'monitoring', label: 'МОНІТОР', icon: Activity, path: '/admin/command?tab=infra' },
                { id: 'aurum', label: 'AURUM', icon: Sparkles, path: '/aurum' },
              ]}
              orientation="horizontal"
              collapsed={false}
            />
          </div>
        )}
      </div>

      {/* BottomNav тепер у AdaptiveNavigation для compact */}
      <ChatBot />
      {shellV2Enabled && <ShellCommandPalette />}
      <ConstitutionalShield />
      <CommandPaletteAI onRunAICommand={(cmd) => {
        // AI Studio will pick up the command if it's the active route, 
        // or we could pass it via global state. For now, navigate handles routing.
      }} />

      <ColabDetailedPanel 
        isOpen={isColabOpen} 
        onClose={() => setIsColabOpen(false)} 
        node={colabNodeData}
      />

      {/* ── STATUS BAR (desktop only) ── */}
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-[60] h-9 hidden md:flex items-center px-4 justify-between overflow-hidden"
        style={{ 
          background: 'rgba(2,6,18,0.85)', 
          backdropFilter: 'blur(30px) saturate(150%)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

        <div className="flex items-center gap-5 min-w-0 overflow-hidden relative z-10">
          <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded bg-black/40 border border-white/5 shadow-inner">
            <div className={cn("h-1.5 w-1.5 rounded-full", isOffline ? "bg-amber-600" : "bg-yellow-500")} />
            <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", isOffline ? "text-amber-600/80" : "text-yellow-500/80")}>
              {isOffline ? 'СИСТЕМА_В_РЕЖИМІ_ВІДНОВЛЕННЯ' : 'СИСТЕМА_ОПТИМАЛЬНА'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-white/10 shrink-0" />
          <SystemMetricsHUD />
          <div className="h-3.5 w-px bg-white/10 shrink-0" />
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 relative">
            <div className="absolute left-0 w-8 h-full bg-gradient-to-r from-[rgba(2,6,18,1)] to-transparent z-10" />
            <span className="text-[8px] font-bold text-sky-400/80 uppercase tracking-widest shrink-0 z-20">OSINT:</span>
            <div className="flex gap-6 animate-[marquee_40s_linear_infinite] whitespace-nowrap pl-4">
              {["Аналіз митних декларацій (UA-EU)", "Індексризику ТОВ 'ЕНЕ ДЖИ'", "Синхронізація з YouControl", "Виявлено нові зв'язки в секторі ВПК", "Моніторинг транзакцій завершено"].map((text, i) => (
                <span key={i} className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-sky-500/45" /> {text}
                </span>
              ))}
            </div>
            <div className="absolute right-0 w-12 h-full bg-gradient-to-l from-[rgba(2,6,18,1)] to-transparent z-10" />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 pl-4 relative z-10">
          <div className="flex items-center gap-3 pr-2">
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">КЛАСТЕ :</span>
             <div className="flex items-center gap-2">
                {backendNodes.map(node => (
                   <div key={node.id} className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-sm border transition-all duration-300", node.active ? "bg-amber-500/10 border-amber-500/30" : "opacity-30 border-white/5")}>
                      <div className={cn("w-1 h-1 rounded-full", node.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                      <span className={cn("text-[7px] font-black uppercase tracking-wider", node.active && "text-amber-500")}>{node.name}</span>
                   </div>
                ))}
             </div>
          </div>
          
          <div className="h-3.5 w-px bg-white/10" />
          
          {/* 🧬 НОВІ ІНДИКАТО И ВУЗЛІВ */}
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5" title="Active Core API Node">
                <span className="text-[7px] font-black text-slate-600 uppercase">API:</span>
                <span className="text-[9px] font-mono font-bold text-indigo-400 truncate max-w-[80px]">
                  {API_BASE_URL.startsWith('http') ? new URL(API_BASE_URL).hostname : 'LOCAL'}
                </span>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/40 border border-white/5" title="Current Web Interface Host">
                <span className="text-[7px] font-black text-slate-600 uppercase">WEB:</span>
                <span className="text-[9px] font-mono font-bold text-cyan-400">{typeof window !== 'undefined' ? window.location.hostname : '...'}</span>
             </div>
          </div>

          <div className="h-3.5 w-px bg-white/10" />
          <div className="flex items-center gap-2 rounded border border-white/[0.08] bg-black/60 px-2 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-rose-600" />
            <div className="text-[8px] font-black uppercase tracking-[0.28em] text-slate-500">
              PREDATOR <span className="font-bold text-slate-100">ELITE</span>{' '}
              <span className="ml-1 text-slate-600">v63.0</span>
            </div>
          </div>
        </div>
      </motion.div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}} />
    </div>
  );
};

export default DesktopLayout;
