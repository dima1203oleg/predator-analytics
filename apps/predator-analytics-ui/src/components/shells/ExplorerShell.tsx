
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, User, Menu, X, Home, FileText,
  Activity, Zap, Compass, ShieldCheck, Sparkles
} from 'lucide-react';
import { TabView } from '../../types';
import { useUser } from '../../context/UserContext';

interface ShellProps {
  children: React.ReactNode;
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  onLogout: () => void;
}

const ExplorerShell: React.FC<ShellProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Основне меню - розділене на логічні групи
  const navItemsMain = [
    { id: TabView.OVERVIEW, label: 'Огляд', icon: <Home size={20} />, group: 'main' },
    { id: TabView.CASES, label: 'Кейси', icon: <FileText size={20} />, group: 'main' },
  ];

  const navItemsData = [
    { id: TabView.DATA, label: 'Дані та Реєстри', icon: <Zap size={20} />, group: 'data' },
    { id: TabView.SEARCH, label: 'Пошук/OSINT', icon: <Compass size={20} />, group: 'data' },
  ];

  const navItemsAI = [
    { id: TabView.DATASET_STUDIO, label: 'ШІ Студія', icon: <Sparkles size={20} />, group: 'ai' },
    { id: TabView.ACTIVITY, label: 'Журнал', icon: <Activity size={20} />, group: 'ai' },
  ];

  // Об'єднуємо для зворотної сумісності
  const navItems = [...navItemsMain, ...navItemsData, ...navItemsAI];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 font-sans">
      {/* Soft Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar (Explorer Style: Soft & Rounded) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-slate-900/20 backdrop-blur-xl z-20 flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white">PREDATOR</h1>
              <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest leading-none">КЛІЄНТСЬКИЙ РЕЖИМ</p>
            </div>
          </div>

          <nav className="space-y-1">
            {/* Група: Головне */}
            {navItemsMain.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeTab === item.id
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-semibold text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                )}
              </button>
            ))}

            {/* Роздільник: Дані */}
            <div className="pt-4 pb-2">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">📊 Дані</div>
            </div>
            {navItemsData.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeTab === item.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-semibold text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="active-pill-data" className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                )}
              </button>
            ))}

            {/* Роздільник: ШІ */}
            <div className="pt-4 pb-2">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4">🤖 Інтелект</div>
            </div>
            {navItemsAI.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  activeTab === item.id
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-semibold text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div layoutId="active-pill-ai" className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-500/30">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Аналітик</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              Вийти
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-950/20 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-slate-400" onClick={() => setIsMenuOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span className="text-white">Головна</span>
              <span className="opacity-30">/</span>
              <span className="text-blue-400 font-bold">{navItems.find(i => i.id === activeTab)?.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <input
                type="text"
                placeholder="Швидкий пошук..."
                className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs w-48 focus:w-64 focus:bg-white/10 focus:border-blue-500/50 outline-none transition-all"
              />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 bg-[#020617] border-r border-white/10 p-6 md:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <ShieldCheck className="text-white" size={18} />
                  </div>
                  <span className="font-black text-white">PREDATOR</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onTabChange(item.id); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl ${
                      activeTab === item.id ? 'bg-blue-500/10 text-blue-400' : 'text-slate-400'
                    }`}
                  >
                    {item.icon}
                    <span className="font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExplorerShell;
