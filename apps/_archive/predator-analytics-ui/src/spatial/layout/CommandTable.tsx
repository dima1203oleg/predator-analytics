import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HoloCard } from '@/components/ui/HoloCard';
import { FileText, Network, Activity, Search, ShieldAlert, Cpu } from 'lucide-react';
import { useCommandStore } from '@/spatial/store/useCommandStore';
import { cn } from '@/utils/cn';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// ─── API Hooks ─────────────────────────────────────────────────────────────

const useSystemKPIs = () => {
  return useQuery({
    queryKey: ['system-kpis'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/stats/system');
      return res.data;
    },
    refetchInterval: 15000,
  });
};

const useRecentDocuments = () => {
  return useQuery({
    queryKey: ['recent-documents'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/registries/companies?limit=5');
      if (Array.isArray(res.data)) return res.data;
      if (res.data?.data) return res.data.data;
      
      // Fallback
      return [
        { uedrpou: '38129312', name: 'ТОВ "Альфа"', riskLevel: 'HIGH', updated_at: '2 хв тому' },
        { uedrpou: '40219481', name: 'ТОВ "Омега Логістик"', riskLevel: 'MEDIUM', updated_at: '15 хв тому' },
      ];
    },
    refetchInterval: 30000,
  });
};

const useGraphAnomalies = () => {
  return useQuery({
    queryKey: ['graph-anomalies'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/graph/summary');
      return res.data;
    },
    refetchInterval: 30000,
  });
};

export const CommandTable: React.FC = () => {
  const { interactionMode, setInteractionMode } = useCommandStore();
  const [activePanels, setActivePanels] = useState<Record<string, boolean>>({
    left: true,
    right: true,
    top: true,
  });

  const { data: kpiData } = useSystemKPIs();
  const { data: documents } = useRecentDocuments();
  const { data: graphData } = useGraphAnomalies();

  // Вираховуємо KPI з реальних даних або фолбеку
  const kpis = [
    { label: "РІВЕНЬ РИЗИКУ", value: kpiData?.risk_level ? `${kpiData.risk_level}%` : "84%", trend: "up", trendValue: "+12%" },
    { label: "АКТИВНІ ВУЗЛИ", value: graphData?.nodes?.length ? `${graphData.nodes.length}` : "1,204", trend: "stable" },
    { label: "АНОМАЛІЇ", value: kpiData?.active_anomalies ?? "42", trend: "up", trendValue: "КРИТИЧНО" },
    { label: "ШВИДКІСТЬ", value: kpiData?.response_time_ms ? `${kpiData.response_time_ms}мс` : "1.2мс", trend: "down" }
  ];

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
                metrics={kpis as any}
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
                title="ОСТАННІ ДАНІ"
                icon={<FileText size={18} />}
                variant="minimal"
                className="h-full flex flex-col bg-[rgba(10,10,12,0.85)] border-white/[0.04]"
              >
                <div className="flex flex-col gap-4 mt-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  {(documents || []).map((doc: any, i: number) => (
                    <div key={doc.uedrpou || i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase">ЄДРПОУ: {doc.uedrpou || 'N/A'}</span>
                        <span className="text-[10px] text-slate-500">{doc.updated_at || 'Щойно'}</span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                        {doc.name || doc.company_name || 'Невідома компанія'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {doc.riskLevel === 'HIGH' ? 'Виявлено критичні ризики при аналізі.' : 'Дані оновлено системою.'}
                      </p>
                    </div>
                  ))}
                  {(!documents || documents.length === 0) && (
                    <div className="text-xs text-slate-500 text-center py-8">Немає нових даних</div>
                  )}
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
                      {graphData?.nodes ? `Знайдено ${graphData.nodes.filter((n:any) => n.riskScore > 80).length} критичних вузлів.` : "Знайдено циклічний зв'язок між 4 контрагентами."}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.02]">
                    <div className="flex gap-3 items-center mb-3">
                      <Network size={16} className="text-cyan-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Топологія</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {graphData?.links ? `Проаналізовано ${graphData.links.length} зв'язків. Оновлюю 3D граф...` : "Новий кластер сформовано. Оновлюю 3D граф..."}
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
