import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoloCard } from '@/components/ui/HoloCard';
import { FileText, Network, Activity, Search, ShieldAlert, Cpu } from 'lucide-react';
import { useCommandStore } from '@/spatial/store/useCommandStore';
import { cn } from '@/utils/cn';

export const CommandTable: React.FC = () => {
  const { interactionMode, setInteractionMode } = useCommandStore();
  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({
    left: true,
    right: true,
    top: true,
  });

  const togglePanel = (panel: string) => {
    setActivePanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between overflow-hidden">
      
      {/* Top Section - KPI & Status */}
      <div className="w-full flex justify-center mt-4">
        <AnimatePresence>
          {activePanels.top && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="pointer-events-auto w-full max-w-4xl"
            >
              <HoloCard
                title="СТРАТЕГІЧНІ KPI"
                icon={<Activity size={18} />}
                variant="minimal"
                tilt={false}
                metrics={[
                  { label: "РІВЕНЬ РИЗИКУ", value: "84%", trend: "up", trendValue: "+12%" },
                  { label: "АКТИВНІ ВУЗЛИ", value: "1,204", trend: "stable" },
                  { label: "АНОМАЛІЇ", value: "42", trend: "up", trendValue: "КРИТИЧНО" },
                  { label: "ШВИДКІСТЬ АНАЛІЗУ", value: "1.2мс", trend: "down" }
                ]}
                className="bg-[rgba(10,10,12,0.85)] border-white/[0.04]"
              >
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-4">
                    <Button variant="cyber" 
                      className={cn(
                        "text-[10px] uppercase font-black tracking-widest px-4 py-1 rounded-full transition-colors",
                        interactionMode === 'OSINT' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                      onClick={() => setInteractionMode('OSINT')}
                    >
                      Глобальний Аналіз
                    </Button>
                    <Button variant="cyber" 
                      className={cn(
                        "text-[10px] uppercase font-black tracking-widest px-4 py-1 rounded-full transition-colors",
                        interactionMode === 'DOCUMENTS' ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                      )}
                      onClick={() => setInteractionMode('DOCUMENTS')}
                    >
                      Документарний Контроль
                    </Button>
                  </div>
                </div>
              </HoloCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center h-full mt-8 mb-8">
        
        {/* Left Section - Documents / Intel */}
        <AnimatePresence>
          {activePanels.left && (
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="pointer-events-auto w-[400px] h-full"
            >
              <HoloCard
                title="ДОКУМЕНТИ"
                icon={<FileText size={18} />}
                variant="minimal"
                className="h-full flex flex-col bg-[rgba(10,10,12,0.85)] border-white/[0.04]"
              >
                <div className="flex flex-col gap-4 mt-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase">МД-{1042 + i}</span>
                        <span className="text-[10px] text-slate-500">2 хв тому</span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        Аналіз транзакцій компанії ТОВ "Альфа"
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        Виявлено розбіжності у митній вартості по імпорту за останні 3 місяці. Підозра на маніпуляцію кодами УКТЗЕД.
                      </p>
                    </div>
                  ))}
                </div>
              </HoloCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Space for the 3D Avatar and core scene in the middle */}
        <div className="flex-1 pointer-events-none" />

        {/* Right Section - Graph / AI Insights */}
        <AnimatePresence>
          {activePanels.right && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="pointer-events-auto w-[400px] h-full"
            >
              <HoloCard
                title="ІНСАЙТИ AI"
                icon={<Cpu size={18} />}
                status="warning"
                variant="minimal"
                className="h-full flex flex-col bg-[rgba(10,10,12,0.85)] border-white/[0.04]"
              >
                <div className="flex flex-col gap-4 mt-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex gap-3 items-center mb-3">
                      <ShieldAlert size={16} className="text-rose-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Аномалія Графа</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      Знайдено циклічний зв'язок між 4 контрагентами. Імовірність фіктивного експорту: 89%.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.02]">
                    <div className="flex gap-3 items-center mb-3">
                      <Network size={16} className="text-cyan-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Топологія</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      Новий кластер сформовано навколо офшорної юрисдикції. Оновлюю 3D граф...
                    </p>
                  </div>
                </div>
              </HoloCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
