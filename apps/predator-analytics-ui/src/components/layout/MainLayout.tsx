/**
 * 🛡️ MAIN LAYOUT // ГОЛОВНИЙ ШЕЛЛ | v56.5-ELITE (AGENTIC)
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
import { cn } from '@/utils/cn';
import { API_BASE_URL } from '@/services/api/config';

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
      <div className="aura-bg" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:50px_50px]" />
      <div className="op-scanline pointer-events-none absolute inset-0 z-[1]" />
      
      <div className="op-data-streams opacity-20">
        {[1,2,3,4,5,6].map(i => <div key={i} className="op-stream" />)}
      </div>

      {isMobile ? (
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <motion.div className="fixed inset-0 z-50">
              <motion.button
                type="button"
                aria-label="Закрити навігацію"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg"
              />
              <motion.div className="absolute left-0 top-0 h-full" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}>
                <Sidebar />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <Sidebar />
      )}

      <InfrastructureFailoverBanner />

      <div className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative flex-1 overflow-y-auto custom-scrollbar">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(15,23,42,0.28),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(8,47,73,0.18),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.4))]" />

          <div className="relative mx-auto max-w-[1920px] px-3 sm:px-5 lg:px-7 py-5 xl:px-10 pb-16">
            <div className={`grid gap-6 ${shellV2Enabled && !isMobile && isContextRailOpen ? 'grid-cols-1 xl:grid-cols-[1fr_340px]' : 'grid-cols-1'}`}>
              <div className={shellV2Enabled && !isMobile && isContextRailOpen ? 'col-span-12 xl:col-span-1' : 'col-span-12'}>
                <AnimatePresence mode="wait">
                  <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
              {shellV2Enabled && !isMobile && isContextRailOpen && <ContextRail />}
            </div>
          </div>
        </main>
      </div>

      <ChatBot />
      {shellV2Enabled && <ShellCommandPalette />}
      <ConstitutionalShield />

      {/* ── STATUS BAR (v56.5) ── */}
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[60] h-9 border-t border-white/[0.07] flex items-center px-4 justify-between overflow-hidden"
        style={{ background: 'rgba(2,6,18,0.92)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-5 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isOffline ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]" : "bg-emerald-400 shadow-[0_0_6px_#34d399]")} />
            <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", isOffline ? "text-rose-500/80" : "text-emerald-400/80")}>
              {isOffline ? 'СИСТЕМА_В_РЕЖИМІ_ВІДНОВЛЕННЯ' : 'СИСТЕМА_ОПТИМАЛЬНА'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-white/10 shrink-0" />
          <SystemMetricsHUD />
          <div className="h-3.5 w-px bg-white/10 shrink-0" />
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest shrink-0">OSINT:</span>
            <div className="flex gap-6 animate-[marquee_55s_linear_infinite] whitespace-nowrap">
              {["Аналіз митних декларацій (UA-EU)", "Індекс ризику ТОВ 'ЕНЕРДЖИ'", "Синхронізація з YouControl", "Виявлено нові зв'язки в секторі ВПК"].map((text, i) => (
                <span key={i} className="text-[8px] font-medium text-slate-500 uppercase tracking-widest">◆ {text}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 pl-4">
          <div className="flex items-center gap-3 pr-2">
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">КЛАСТЕР:</span>
             <div className="flex items-center gap-2">
                {backendNodes.map(node => (
                   <div key={node.id} className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-sm border", node.active ? "bg-amber-500/10 border-amber-500/30" : "opacity-30")}>
                      <div className={cn("w-1 h-1 rounded-full", node.status === 'online' ? "bg-emerald-500" : "bg-rose-500")} />
                      <span className={cn("text-[7px] font-black uppercase", node.active && "text-amber-500")}>{node.name}</span>
                   </div>
                ))}
             </div>
          </div>
          
          <div className="h-3.5 w-px bg-white/10" />
          
          {/* 🧬 НОВІ ІНДИКАТОРИ ВУЗЛІВ */}
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5" title="Active Core API Node">
                <span className="text-[7px] font-black text-slate-600 uppercase">API:</span>
                <span className="text-[9px] font-mono font-bold text-indigo-400 truncate max-w-[80px]">{new URL(API_BASE_URL).hostname}</span>
             </div>
             <div className="flex items-center gap-1.5" title="Current Web Interface Host">
                <span className="text-[7px] font-black text-slate-600 uppercase">WEB:</span>
                <span className="text-[9px] font-mono font-bold text-cyan-400">{typeof window !== 'undefined' ? window.location.hostname : '...'}</span>
             </div>
          </div>

          <div className="h-3.5 w-px bg-white/10" />
          <div className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20">
            PREDATOR <span className="text-yellow-500/70">ELITE</span> v56.5
          </div>
        </div>
      </motion.div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}} />
    </div>
  );
};

export default MainLayout;
