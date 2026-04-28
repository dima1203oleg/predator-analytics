/**
 * 🛡️ MAIN LAYOUT // ГОЛОВНИЙ ШЕЛЛ | v58.2-WRAITH (AGENTIC)
 * Підтримка гібридного вузла та суверенного дизайну.
 */
import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Menu, X, Activity, Server, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import Header from './Header';
import ChatBot from '../ai/ChatBot';
import ContextRail from './ContextRail';
import ShellCommandPalette from './ShellCommandPalette';
import { SystemMetricsHUD } from './SystemMetricsHUD';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { isSidebarOpenAtom, shellContextRailOpenAtom } from '../../store/atoms';
import { isShellV2Enabled } from '../../services/shell/userWorkspace';
import { ConstitutionalShield } from '../shared/ConstitutionalShield';
import { useTheme } from '../../context/ThemeContext';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { InfrastructureFailoverBanner } from '../InfrastructureFailoverBanner';
import { NeuralBackground } from '../ui/NeuralBackground';
import { cn } from '@/utils/cn';
import { API_BASE_URL } from '@/services/api/config';
import { colabPanelOpenAtom, colabNodeDataAtom } from '../../store/atoms';
import { ColabDetailedPanel } from '@/features/infrastructure/components/ColabDetailedPanel';
import { useSystemNodes } from '@/hooks/useAdminApi';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Головний Layout PREDATOR Analytics з адаптивним режимом.
 * v56: преміальний ambient-фон, анімовані переходи між сторінками,
 * покращений мобільний drawer з backdrop-blur.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarExpanded, setIsSidebarExpanded] = useAtom(isSidebarOpenAtom);
  const [isContextRailOpen, setIsContextRailOpen] = useAtom(shellContextRailOpenAtom);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { isOffline, nodes: backendNodes } = useBackendStatus();
  const shellV2Enabled = isShellV2Enabled();
  const location = useLocation();
  const { mode } = useTheme();

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

  return (
    <div
      data-testid="main-layout"
      data-op-mode={mode}
      className="relative flex min-h-screen overflow-hidden bg-background text-foreground op-mode-transition"
    >
      <NeuralBackground />
      <div className="op-scanline pointer-events-none absolute inset-0 z-[1]" />
      
      <div className="op-data-streams opacity-10">
        {[1,2,3,4].map(i => <div key={i} className="op-stream" />)}
      </div>

      {isMobileDrawerOpen && isMobile && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Закрити навігацію"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg"
          />
          <motion.div
            className="absolute left-0 top-0 h-full"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
          >
            <Sidebar />
          </motion.div>
        </div>
      )}

      {isMobile && !isMobileDrawerOpen && (
        <button
          type="button"
          aria-label="Відкрити меню"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="fixed left-4 top-3 z-[100] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/50 text-white backdrop-blur-md transition hover:bg-slate-900"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {!isMobile && <Sidebar />}

      <InfrastructureFailoverBanner />

      <div className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative flex-1 overflow-y-auto custom-scrollbar">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(15,23,42,0.28),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(8,47,73,0.18),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.4))]" />

          <div className="relative mx-auto max-w-[1920px] px-3 sm:px-5 lg:px-7 py-5 xl:px-10 pb-16">
            <div className={`grid grid-cols-12 gap-6`}>
              <div className={shellV2Enabled && !isMobile && isContextRailOpen ? 'col-span-12 xl:col-span-9' : 'col-span-12'}>
                <AnimatePresence mode="wait">
                  <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
              {shellV2Enabled && !isMobile && isContextRailOpen && (
                <div className="col-span-12 xl:col-span-3">
                  <ContextRail />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ChatBot />
      {shellV2Enabled && <ShellCommandPalette />}
      <ConstitutionalShield />

      <ColabDetailedPanel 
        isOpen={isColabOpen} 
        onClose={() => setIsColabOpen(false)} 
        node={colabNodeData}
      />

      {/* ── STATUS BAR (v58.2-ELITE) ── */}
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-[60] h-9 flex items-center px-4 justify-between overflow-hidden"
        style={{ 
          background: 'rgba(2,6,18,0.85)', 
          backdropFilter: 'blur(30px) saturate(150%)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
          borderTop: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        {/* Neon top edge */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent shadow-[0_0_8px_rgba(225,29,72,0.6)]" />

        <div className="flex items-center gap-5 min-w-0 overflow-hidden relative z-10">
          <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded bg-black/40 border border-white/5 shadow-inner">
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isOffline ? "bg-amber-600 shadow-[0_0_6px_#d97706]" : "bg-yellow-500 shadow-[0_0_6px_#f59e0b]")} />
            <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", isOffline ? "text-amber-600/80" : "text-yellow-500/80")}>
              {isOffline ? 'СИСТЕМА_В_� ЕЖИМІ_ВІДНОВЛЕННЯ' : 'СИСТЕМА_ОПТИМАЛЬНА'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-white/10 shrink-0" />
          <SystemMetricsHUD />
          <div className="h-3.5 w-px bg-white/10 shrink-0" />
          <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 relative">
            <div className="absolute left-0 w-8 h-full bg-gradient-to-r from-[rgba(2,6,18,1)] to-transparent z-10" />
            <span className="text-[8px] font-bold text-rose-500/70 uppercase tracking-widest shrink-0 z-20">OSINT:</span>
            <div className="flex gap-6 animate-[marquee_40s_linear_infinite] whitespace-nowrap pl-4">
              {["Аналіз митних декларацій (UA-EU)", "Індекс ризику ТОВ 'ЕНЕ� ДЖИ'", "Синхронізація з YouControl", "Виявлено нові зв'язки в секторі ВПК", "Моніторинг транзакцій завершено"].map((text, i) => (
                <span key={i} className="text-[9px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-rose-500/50 rounded-full" /> {text}
                </span>
              ))}
            </div>
            <div className="absolute right-0 w-12 h-full bg-gradient-to-l from-[rgba(2,6,18,1)] to-transparent z-10" />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 pl-4 relative z-10">
          <div className="flex items-center gap-3 pr-2">
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">КЛАСТЕ� :</span>
             <div className="flex items-center gap-2">
                {backendNodes.map(node => (
                   <div key={node.id} className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-sm border transition-all duration-300", node.active ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "opacity-30 border-white/5")}>
                      <div className={cn("w-1 h-1 rounded-full", node.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                      <span className={cn("text-[7px] font-black uppercase tracking-wider", node.active && "text-amber-500")}>{node.name}</span>
                   </div>
                ))}
             </div>
          </div>
          
          <div className="h-3.5 w-px bg-white/10" />
          
          {/* 🧬 НОВІ ІНДИКАТО� И ВУЗЛІВ */}
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
          <div className="flex items-center gap-2 px-2 py-0.5 rounded border border-rose-500/20 bg-rose-500/5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
            <div className="text-[8px] font-black uppercase tracking-[0.25em] text-white/50">
              PREDATOR <span className="text-rose-500 font-bold">WRAITH</span> <span className="text-white/30 ml-1">v58.2</span>
            </div>
          </div>
        </div>
      </motion.div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}} />
    </div>
  );
};

export default MainLayout;
