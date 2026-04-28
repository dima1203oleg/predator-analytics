
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Shield, Activity, Database, Cpu,
  Layers, Settings, Search, LogOut, Lock,
  ChevronRight, ChevronLeft, Zap, HardDrive, Thermometer, Sparkles
} from 'lucide-react';
import { TabView } from '../../types';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';

interface ShellProps {
  children: React.ReactNode;
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  onLogout: () => void;
}

const OperatorShell: React.FC<ShellProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  const { user } = useUser();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [metrics, setMetrics] = useState({ cpu: 22, ram: 45, temp: 38 });

  // Real metrics polling
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await api.v45.getRealtimeMetrics();
        if (data) {
          setMetrics({
            cpu: data.cpu_usage || 0,
            ram: data.memory_usage || 0,
            temp: (data as any).temperature || 0
          });
        }
      } catch (e) {
        console.warn("Operator Shell metrics failed");
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    { title: 'ОПЕРАЦІЙНА', items: [
      { id: TabView.OVERVIEW, label: 'Моніторинг', icon: <Activity size={18} /> },
      { id: TabView.SEARCH, label: 'Пошук/OSINT', icon: <Search size={18} /> },
      { id: TabView.DATASET_STUDIO, label: 'ШІ Студія', icon: <Sparkles size={18} /> },
    ]},
    { title: 'СИСТЕМА', items: [
      { id: TabView.DATABASES, label: 'Індекси/БД', icon: <Database size={18} /> },
      { id: TabView.SYSTEM_HEALTH, label: 'Інфраструктура', icon: <Cpu size={18} /> },
      { id: TabView.NAS, label: 'Arena/ML', icon: <Zap size={18} /> },
    ]}
  ];

  return (
    <div className="flex h-screen bg-[#05080a] text-emerald-500 font-mono selection:bg-emerald-500/30">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

      {/* Tactical Sidebar */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="relative z-20 flex flex-col bg-black/80 border-r border-emerald-900/50 backdrop-blur-md flex-shrink-0"
      >
        <div className="p-4 border-b border-emerald-900/30 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 ">
              <div className="w-8 h-8 flex items-center justify-center border border-emerald-500/50 text-emerald-400 font-black">
                OP
              </div>
              <div className="truncate">
                <div className="text-xs font-black tracking-tighter">PREDATOR_CMD</div>
                <div className="text-[10px] opacity-50 uppercase">v45.operator_shell</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-emerald-500/10 rounded transition-colors ml-auto"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em] mb-1">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-all
                    ${activeTab === item.id
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                      : 'text-emerald-900 hover:text-emerald-500 hover:bg-emerald-500/5'
                    }
                    ${isSidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <span className={activeTab === item.id ? 'text-emerald-400' : ''}>{item.icon}</span>
                  {!isSidebarCollapsed && <span className="text-xs font-bold uppercase">{item.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Live Metrics Hub (Only visible if expanded) */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-emerald-900/30 space-y-3 bg-emerald-950/10">
            <div className="flex items-center justify-between text-[10px] font-black">
              <span className="opacity-50 tracking-widest">UNIT_STATUS:</span>
              <span className="text-emerald-400">НО МА</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'CPU', val: metrics.cpu, icon: <Cpu size={10} />, color: 'bg-emerald-500' },
                { label: 'RAM', val: metrics.ram, icon: <HardDrive size={10} />, color: 'bg-blue-500' },
                { label: 'TMP', val: metrics.temp, icon: <Thermometer size={10} />, color: 'bg-amber-500' },
              ].map(stat => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase font-bold">
                    <span>{stat.label}</span>
                    <span>{stat.val}%</span>
                  </div>
                  <div className="h-1 bg-emerald-900/30 ">
                    <motion.div
                      animate={{ width: `${stat.val}%` }}
                      className={`h-full ${stat.color} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-2 border-t border-emerald-900/30">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-emerald-900 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && <span className="text-[10px] font-black uppercase">Термінувати сеанс</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Top HUD Frame */}
        <header className="h-12 border-b border-emerald-900/30 flex items-center justify-between px-4 bg-emerald-950/5 flex-shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-black tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
               <span>ЗВ'ЯЗОК_ВСТАНОВЛЕНО</span>
            </div>
            <div className="text-emerald-900">|</div>
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-emerald-400" />
              <span>TRACE: {activeTab.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-[10px] font-mono text-emerald-900">
              COORD: 50.4501° N, 30.5234° E
            </div>
            <div className="text-[10px] font-mono text-emerald-400">
              {new Date().toISOString().split('T')[1].split('.')[0]}
            </div>
          </div>
        </header>

        {/* Content Area with Scanlines Effect */}
        <main className="flex-1 overflow-y-auto p-4 relative">
          {/* CRT/Scanline Overlay */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-50" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-full border border-emerald-900/20 bg-emerald-950/5 p-4 rounded-sm"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom HUD Metadata */}
        <footer className="h-6 bg-emerald-950/20 border-t border-emerald-900/30 px-4 flex items-center justify-between text-[8px] font-mono tracking-widest text-emerald-900">
          <div>TENANT_ID: {user?.tenant_id} // SECTOR_ACCESS: {user?.data_sectors.join(',')}</div>
          <div>ENCRYPTION: AES-256-GCM // TRACE_VERIFIED: TRUE</div>
        </footer>
      </div>
    </div>
  );
};

export default OperatorShell;
