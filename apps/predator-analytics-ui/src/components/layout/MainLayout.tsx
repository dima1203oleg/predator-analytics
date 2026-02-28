import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

import { GlobalIngestionController } from '../ingestion/GlobalIngestionController';
import { ProcessRadar } from '../ingestion/ProcessRadar';
import OrbitMenu from '../navigation/OrbitMenu';
import { CommandPalette } from '../ui/CommandPalette';
import { CyberTerminal } from '../ui/CyberTerminal';
import { MatrixBackground } from '../ui/MatrixBackground';
import DynamicSystemAura from './DynamicSystemAura';


interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isSidebarOpen, deviceMode } = useAppStore();
  const [liveStats, setLiveStats] = useState({
    cpu: 0, memory: 0, records: 0, stage: 'СУВЕРЕННИЙ', ooda: 1042
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [metrics, dbStats] = await Promise.allSettled([
          fetch('/api/v1/system/metrics').then(r => r.json()),
          fetch('/api/v1/database/stats').then(r => r.json()),
        ]);
        setLiveStats(prev => ({
          cpu: metrics.status === 'fulfilled' ? Math.round(metrics.value.cpu ?? prev.cpu) : prev.cpu,
          memory: metrics.status === 'fulfilled' ? Math.round(metrics.value.memory ?? prev.memory) : prev.memory,
          records: dbStats.status === 'fulfilled' ? (dbStats.value.postgresql?.records ?? prev.records) : prev.records,
          stage: 'СУВЕРЕННИЙ',
          ooda: prev.ooda + 1,
        }));
      } catch { }
    };
    fetchStats();
    const iv = setInterval(fetchStats, 8000);
    return () => clearInterval(iv);
  }, []);

  // --- PREMIUM DEVICE SIMULATOR FRAMES ---
  const renderContent = () => {
    if (deviceMode === 'desktop') {
      return (
        <div className="relative z-10 w-full">
          {children}
        </div>
      );
    }

    const isMobile = deviceMode === 'mobile';

    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] py-10 perspective-1000">
        <motion.div
          key={deviceMode}
          initial={{ opacity: 0, scale: 0.8, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateY: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={cn(
            "relative bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-[12px] border-slate-800 rounded-[48px] overflow-hidden",
            isMobile ? "w-[375px] h-[812px] rounded-[56px] border-[14px]" : "w-[1024px] h-[768px] rounded-[32px] border-[16px]"
          )}
        >
          {/* Bezel Accents */}
          <div className="absolute top-0 left-0 right-0 h-full pointer-events-none ring-1 ring-white/10 inset-0 z-50 rounded-[inherit]" />

          {/* Camera Notch for Mobile */}
          {isMobile && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-800 rounded-b-3xl z-[60] flex items-center justify-center gap-4">
              <div className="w-10 h-1 bg-slate-700 rounded-full" />
              <div className="w-2 h-2 bg-slate-700 rounded-full" />
            </div>
          )}

          {/* Volume Buttons (Aesthetic) */}
          <div className="absolute -left-[16px] top-32 w-1 h-12 bg-slate-700 rounded-l-md" />
          <div className="absolute -left-[16px] top-48 w-1 h-12 bg-slate-700 rounded-l-md" />
          <div className="absolute -right-[16px] top-32 w-1 h-16 bg-slate-700 rounded-r-md" />

          {/* Simulator Info Header */}
          <div className="absolute top-2 left-0 right-0 px-8 flex justify-between items-center text-[10px] font-mono text-slate-500 z-50 pointer-events-none">
            <span>PREDATOR_MOBILE_LINK</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SECURE_FEED</span>
            </div>
          </div>

          {/* Content Wrapper */}
          <div className="h-full w-full overflow-y-auto bg-[#020617] relative custom-scrollbar">
            {/* Digital Scanline Effect */}
            <motion.div
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-px bg-emerald-500/20 shadow-[0_0_10px_#10b981] z-[55] pointer-events-none"
            />

            <div className="p-4 relative z-10">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      <MatrixBackground />
      <DynamicSystemAura />
      <OrbitMenu />
      <CommandPalette />
      <TopBar />
      <Sidebar />

      <main
        className={cn(
          "pt-16 transition-all duration-300 min-h-screen flex flex-col relative",
          isSidebarOpen ? "md:ml-[240px]" : "md:ml-[80px]"
        )}
      >
        {/* Transitional Noise Overlay */}
        <AnimatePresence mode="wait">
          {deviceMode !== 'desktop' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.05 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 pointer-events-none bg-cyber-noise"
            />
          )}
        </AnimatePresence>

        <div className="flex-1 p-4 md:p-6 lg:p-8 relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-dot-grid" />

          <AnimatePresence mode="wait">
            <motion.div
              key={deviceMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="relative z-10 w-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <GlobalIngestionController />
      <ProcessRadar />
      <CyberTerminal />

      {/* CyberDeck Status Footer — LIVE DATA */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-black/85 backdrop-blur-md border-t border-indigo-500/20 z-[100] flex items-center px-4 gap-6 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Core_Live</span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-[9px] font-mono">
          <span className="text-cyan-500">ЦП: <span className="text-cyan-300">{liveStats.cpu}%</span></span>
          <span className="text-purple-500">ОЗП: <span className="text-purple-300">{liveStats.memory}%</span></span>
          <span className="text-blue-500">БД: <span className="text-blue-300">{liveStats.records.toLocaleString()} зап.</span></span>
        </div>

        <div className="flex-1 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, -1200] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="whitespace-nowrap text-[9px] font-mono text-slate-600 tracking-tight"
          >
            {` >> СИСТЕМА_V45_СУВЕРЕН >> ЦИКЛ_OODA: ${liveStats.ooda} >> ЕТАП: ${liveStats.stage} >> ЦП: ${liveStats.cpu}% >> ОЗП: ${liveStats.memory}% >> ЗАПИСІВ_БД: ${liveStats.records.toLocaleString()} >> КОЕФІЦІЄНТ_ДОВІРИ: 0.9982 >> ІНДЕКС_АНОМАЛІЙ: 0.002 >> СИСТЕМА_ГОТОВА >> СИСТЕМА_V45_СУВЕРЕН >> ЦИКЛ_OODA: ${liveStats.ooda} >> ЕТАП: ${liveStats.stage} `}
          </motion.div>
        </div>

        <div className="flex items-center gap-4 shrink-0 border-l border-white/10 pl-4 h-full">
          <span className="text-[9px] font-mono text-indigo-400">ЗАТРИМКА: 12ms</span>
          <span className="text-[9px] font-mono text-slate-500">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
