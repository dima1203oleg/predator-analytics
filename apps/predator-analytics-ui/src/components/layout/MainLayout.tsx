import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ContextSidebar } from './ContextSidebar';
import Header from './Header';
import ChatBot from '../ai/ChatBot';
import { CommandPalette } from '../premium/CommandPalette';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { isSidebarOpenAtom } from '../../store/atoms';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Головний Layout PREDATOR Analytics з адаптивним режимом.
 * Додано підтримку темної/світлої теми та мобільного режиму.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isSidebarExpanded, setIsSidebarExpanded] = useAtom(isSidebarOpenAtom);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Автоматична детекція системної теми
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsMobileDrawerOpen(false);
      setIsSidebarExpanded(true);
    }
  }, [isMobile, setIsSidebarExpanded]);

  return (
    <div
      data-testid="main-layout"
      className={`relative flex min-h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#040b14] text-foreground' : 'bg-white text-gray-900'}`}
    >
      <div className={`pointer-events-none absolute inset-0 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,10,18,0.98))]' : 'bg-[linear-gradient(180deg,rgba(245,245,245,0.98),rgba(255,255,255,0.98))]'}`} />
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Адаптивний сайдбар */}
      {isMobile ? (
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ${
            isMobileDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <button
            type="button"
            aria-label="Закрити навігацію"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <div
            className={`absolute left-0 top-0 h-full transform transition-transform duration-300 ${
              isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar />
          </div>
        </div>
      ) : (
        <Sidebar />
      )}

      <div
        data-testid="main-layout-shell"
        className={`relative z-10 flex h-screen min-w-0 flex-1 flex-col overflow-hidden ${
          isMobile ? 'ml-0' : isSidebarExpanded ? 'ml-[332px]' : 'ml-[88px]'
        }`}
      >
        <Header />
        <div className="relative flex flex-1 min-h-0 overflow-hidden">
          <main className="relative flex-1 overflow-y-auto custom-scrollbar">
            <div className={`pointer-events-none absolute inset-0 ${theme === 'dark' ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(15,23,42,0.25),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(8,47,73,0.18),transparent_28%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(245,245,245,0.25),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(220,220,220,0.18),transparent_28%)]'}`} />
            <div className="relative mx-auto max-w-[1660px] px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12">{children}</div>
              </div>
            </div>
          </main>
          <ContextSidebar />
        </div>
      </div>

      {/* Кнопка перемикання сайдбару для мобільних */}
      {isMobile && (
        <button
          type="button"
          onClick={() => {
            setIsSidebarExpanded(true);
            setIsMobileDrawerOpen((current) => !current);
          }}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
        >
          {isMobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      <ChatBot />
      <CommandPalette />
    </div>
  );
};

export default MainLayout;
