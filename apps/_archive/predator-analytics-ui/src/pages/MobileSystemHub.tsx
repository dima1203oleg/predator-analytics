import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Settings, Activity, Lock, Upload, Box, Shield, Factory, ChevronRight } from 'lucide-react';

const MENU_ITEMS = [
  { id: 'monitoring', label: 'МОНІТОРИНГ', description: 'Аналіз метрик системи', icon: <Activity size={24} />, color: 'text-sky-400' },
  { id: 'ingestion', label: 'КУЗНЯ ДАНИХ', description: 'Пайплайни даних', icon: <Upload size={24} />, color: 'text-rose-400' },
  { id: 'security', label: 'БЕЗПЕКА', description: 'Кіберзахист системи', icon: <Lock size={24} />, color: 'text-amber-400' },
  { id: 'deployment', label: 'РОЗГОРТАННЯ', description: 'Управління кластером', icon: <Box size={24} />, color: 'text-indigo-400' },
  { id: 'governance', label: 'УПРАВЛІННЯ', description: 'Контроль доступу', icon: <Shield size={24} />, color: 'text-emerald-400' },
  { id: 'factory', label: 'ФАБРИКА СИСТЕМ', description: 'Генерація агентів', icon: <Factory size={24} />, color: 'text-purple-400' },
  { id: 'settings', label: 'НАЛАШТУВАННЯ', description: 'Глобальні параметри', icon: <Settings size={24} />, color: 'text-slate-400' },
];

export const MobileSystemHub: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (tabId: string) => {
    navigate(`?tab=${tabId}`);
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-b from-rose-950/20 to-black relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Settings size={80} />
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2 relative z-10">
          СИСТЕМНЕ <span className="text-rose-500">ЯДРО</span>
        </h1>
        <p className="text-slate-400 text-sm font-medium relative z-10">
          Управління інфраструктурою
        </p>
      </div>

      {/* Grid of large touch targets */}
      <div className="p-4 grid grid-cols-1 gap-4 pb-24">
        {MENU_ITEMS.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleNavigate(item.id)}
            className="flex items-center w-full p-5 bg-white/5 border border-white/10 rounded-2xl active:bg-white/10 transition-colors group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-active:animate-shimmer" />
            
            <div className={`p-4 rounded-xl bg-black/50 border border-white/5 mr-5 shadow-lg ${item.color}`}>
              {item.icon}
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="text-xl font-black text-white tracking-widest uppercase italic mb-1">
                {item.label}
              </h3>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                {item.description}
              </p>
            </div>
            
            <ChevronRight className="text-slate-600" size={24} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};
