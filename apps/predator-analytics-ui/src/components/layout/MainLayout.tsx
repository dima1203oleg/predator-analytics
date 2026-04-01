import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import Header from './Header';
import ChatBot from '../ai/ChatBot';
import ContextRail from './ContextRail';
import ShellCommandPalette from './ShellCommandPalette';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { isSidebarOpenAtom, shellContextRailOpenAtom } from '../../store/atoms';
import { isShellV2Enabled } from '../../services/shell/userWorkspace';

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
  const shellV2Enabled = isShellV2Enabled();
  const location = useLocation();

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
      className="relative flex min-h-screen overflow-hidden bg-[var(--shell-bg)] text-foreground"
    >
      {/* ── Багатошаровий ambient-фон ── */}
      {/* Шар 1: основні радіальні градієнти */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(245,158,11,0.14),transparent_24%),radial-gradient(circle_at_90%_14%,rgba(34,211,238,0.12),transparent_26%),linear-gradient(180deg,rgba(4,8,16,0.98),rgba(5,10,19,0.96))]" />
      {/* Шар 2: тактична сітка */}
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] [background-size:64px_64px]" />
      {/* Шар 3: бічна тінь для глибини sidebar */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[28rem] bg-[radial-gradient(circle_at_left,rgba(15,23,42,0.35),transparent_70%)]" />
      {/* Шар 4: верхній vignette */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(2,6,23,0.60),transparent)]" />
      {/* Шар 5: нижній vignette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(0deg,rgba(2,6,23,0.40),transparent)]" />

      {/* ── Адаптивний сайдбар ── */}
      {isMobile ? (
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Backdrop */}
              <motion.button
                type="button"
                aria-label="Закрити навігацію"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              {/* Drawer */}
              <motion.div
                className="absolute left-0 top-0 h-full"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
              >
                <Sidebar />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <Sidebar />
      )}

      {/* ── Основна зона контенту ── */}
      <div
        data-testid="main-layout-shell"
        className="relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden"
      >
        <Header />
        <main className="relative flex-1 overflow-y-auto custom-scrollbar">
          {/* Внутрішній ambient для контенту */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(15,23,42,0.28),transparent_24%),radial-gradient(circle_at_100%_0%,rgba(8,47,73,0.18),transparent_30%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.4))]" />
          <div className="relative mx-auto max-w-[1920px] px-2 sm:px-4 lg:px-6 py-4 xl:px-10">
            <div
              className={`grid gap-6 ${
                shellV2Enabled && !isMobile && isContextRailOpen
                  ? 'grid-cols-1 xl:grid-cols-[1fr_340px]'
                  : 'grid-cols-1'
              }`}
            >
              <div className={shellV2Enabled && !isMobile && isContextRailOpen ? 'col-span-12 xl:col-span-1' : 'col-span-12'}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
              {shellV2Enabled && !isMobile && isContextRailOpen && <ContextRail />}
            </div>
          </div>
        </main>
      </div>

      {/* ── FAB — мобільна кнопка навігації ── */}
      {isMobile && (
        <motion.button
          type="button"
          aria-label={isMobileDrawerOpen ? 'Закрити меню' : 'Відкрити меню'}
          onClick={() => {
            setIsSidebarExpanded(true);
            setIsMobileDrawerOpen((current) => !current);
          }}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 text-white shadow-[0_18px_42px_rgba(2,6,23,0.45)]"
          style={{
            background: 'rgba(8, 15, 28, 0.90)',
            backdropFilter: 'blur(16px)',
          }}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={isMobileDrawerOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isMobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      )}

      <ChatBot />
      {shellV2Enabled && <ShellCommandPalette />}
    </div>
  );
};

export default MainLayout;
