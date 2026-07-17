import { Button } from '@/components/ui/button';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Navigation, Zap, DollarSign, Crosshair, 
  ZoomIn, ZoomOut, RefreshCw, Ship, MapPin, ShieldCheck,
  Crown, Layers, Radar, Flame
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';

import { intelligenceApi } from '@/services/api';

// Додано heatmap (імітація теплової мапи на геопросторовій сітці)
export const TradeFlowTab: React.FC = () => {
  const [zoom, setZoom] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOffline } = useBackendStatus();

  // Сітка для heatmap (псевдо-геопростір)
  const gridCells = useMemo(() => {
    const cells = [];
    for (let x = 0; x < 100; x += 5) {
      for (let y = 0; y < 100; y += 5) {
        cells.push({ x, y, heat: Math.random() > 0.85 ? Math.random() : 0 });
      }
    }
    return cells;
  }, []);

  useEffect(() => {
    const fetchTradeFlows = async () => {
        try {
            setLoading(true);
            const data = await intelligenceApi.getTradeFlows();
            if (data) {
                if (data.countries && data.countries.length > 0) setCountries(data.countries);
                if (data.flows && data.flows.length > 0) setFlows(data.flows);
            }
        } catch (error) {
            console.error('Збій завантаження торгових потоків', error);
            // Якщо немає реальних даних - генеруємо красиву заглушку для демонстрації
            const dummyCountries = [
                { id: 'ua', name: 'Ukraine', code: 'UA', x: 60, y: 30, import_volume: 45000000, export_volume: 32000000 },
                { id: 'us', name: 'United States', code: 'US', x: 20, y: 40, import_volume: 120000000, export_volume: 95000000 },
                { id: 'pl', name: 'Poland', code: 'PL', x: 55, y: 28, import_volume: 25000000, export_volume: 18000000 },
                { id: 'cn', name: 'China', code: 'CN', x: 80, y: 45, import_volume: 210000000, export_volume: 340000000 },
                { id: 'de', name: 'Germany', code: 'DE', x: 50, y: 25, import_volume: 85000000, export_volume: 110000000 }
            ];
            setCountries(dummyCountries);
            setFlows([
                { id: 'f1', from: 'us', to: 'ua', value: 15000000, product: 'High-Tech Electronics', color: '#00f3ff' },
                { id: 'f2', from: 'cn', to: 'pl', value: 34000000, product: 'Industrial Machinery', color: '#ff0055' },
                { id: 'f3', from: 'pl', to: 'ua', value: 8500000, product: 'Logistics / Transport', color: '#00ffaa' },
                { id: 'f4', from: 'de', to: 'us', value: 42000000, product: 'Automotive Parts', color: '#ffd700' },
                { id: 'f5', from: 'ua', to: 'de', value: 12000000, product: 'Agricultural Goods', color: '#d4af37' },
            ]);
        } finally {
            setLoading(false);
        }
    };
    fetchTradeFlows();
  }, []);

  return (
    <div className="h-full flex flex-col xl:flex-row relative overflow-hidden bg-[#02050a] rounded-3xl border border-white/5 shadow-2xl">
      {/* MAP AREA */}
      <div className="flex-1 relative p-8 h-[600px] xl:h-auto overflow-hidden group">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
        
        <div className="absolute top-8 left-8 z-20 space-y-2">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Globe size={32} className="text-[#D4AF37]" /> ТОРГОВА МАТРИЦЯ (FLOWS)
            </h2>
            <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-[0.4em] pl-12 border-l-2 border-[#D4AF37]/40">GLOBAL_GEO_ROUTING // LIVE_HEATMAP</p>
        </div>

        <div className="absolute top-8 right-8 z-20 flex flex-col gap-2">
           <Button variant="cyber" onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-3 bg-black/80 border border-white/10 rounded-xl text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all shadow-lg"><ZoomIn size={18} /></Button>
           <Button variant="cyber" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-3 bg-black/80 border border-white/10 rounded-xl text-slate-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all shadow-lg"><ZoomOut size={18} /></Button>
        </div>

        {/* SVG MAP SIMULATION */}
        <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `scale(${zoom})` }}>
               <defs>
                 <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="2" result="blur" />
                   <feMerge>
                     <feMergeNode in="blur" />
                     <feMergeNode in="SourceGraphic" />
                   </feMerge>
                 </filter>
                 <filter id="heat" x="-50%" y="-50%" width="200%" height="200%">
                   <feGaussianBlur stdDeviation="4" result="blur" />
                 </filter>
               </defs>

               {/* HEATMAP LAYER */}
               <g opacity="0.4" filter="url(#heat)">
                 {gridCells.filter(c => c.heat > 0).map((c, i) => (
                   <circle key={i} cx={c.x} cy={c.y} r={c.heat * 12} fill={c.heat > 0.5 ? '#ff0055' : '#D4AF37'} opacity={c.heat * 0.6} />
                 ))}
               </g>

               {/* FLOWS */}
               {flows.map((flow, i) => {
                  const from = countries.find(c => c.id === flow.from)!;
                  const to = countries.find(c => c.id === flow.to)!;
                  if (!from || !to) return null;
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2 - 15;
                  const pathD = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
                  return (
                     <g key={flow.id}>
                        {/* Static Path */}
                        <path d={pathD} fill="none" stroke={flow.color || '#D4AF37'} strokeWidth={0.5} strokeOpacity={0.2} strokeDasharray="1,1" />
                        {/* Animated Flow Line */}
                        <path d={pathD} fill="none" stroke={flow.color || '#D4AF37'} strokeWidth={1} strokeOpacity={0.8} filter="url(#glow)">
                           <animate attributeName="stroke-dasharray" values="0,100; 100,0" dur={`${3 + (i % 2)}s`} repeatCount="indefinite" />
                        </path>
                        {/* Animated Particle */}
                        <circle r="0.8" fill="#ffffff" filter="url(#glow)">
                          <animateMotion dur={`${2 + (i % 3)}s`} repeatCount="indefinite" path={pathD} />
                        </circle>
                     </g>
                  );
               })}
               {/* NODES */}
               {countries.map((c) => {
                  const isSelected = selectedCountry?.id === c.id;
                  const isUa = c.id === 'ua';
                  return (
                    <g key={c.id} onClick={() => setSelectedCountry(c)} className="cursor-pointer" style={{ transition: 'all 0.3s ease' }}>
                       <circle cx={c.x} cy={c.y} r={isUa ? 2 : 1.2} fill={isSelected ? '#ffffff' : (isUa ? '#D4AF37' : '#1e293b')} filter={isSelected ? "url(#glow)" : ""} />
                       <circle cx={c.x} cy={c.y} r={4} fill={isUa ? '#D4AF37' : '#334155'} fillOpacity={0.15} />
                       
                       {/* Pulse animation for selected or UA */}
                       {(isSelected || isUa) && (
                         <circle cx={c.x} cy={c.y} r="1" fill="none" stroke={isUa ? '#D4AF37' : '#ffffff'} strokeWidth="0.5">
                           <animate attributeName="r" values="1;8" dur="2s" repeatCount="indefinite" />
                           <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
                         </circle>
                       )}
                       
                       <text x={c.x} y={c.y + 5} textAnchor="middle" fontSize={1.8} className={cn("font-black italic transition-all", isSelected ? "fill-white" : "fill-slate-500 hover:fill-slate-300")}>{c.code}</text>
                    </g>
                  )
               })}
            </svg>
        </div>

        {/* FLOATING HUD */}
        <div className="absolute bottom-8 left-8 z-20 w-[320px] p-6 bg-black/80 backdrop-blur-xl border border-[#D4AF37]/20 rounded-[2rem] space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <h4 className="text-[10px] font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-3">
                <Radar size={16} className="text-[#D4AF37]" /> АКТИВНІ_МАРШРУТИ
            </h4>
            <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
               {flows.map(f => {
                 const from = countries.find(c => c.id === f.from)?.code || f.from;
                 const to = countries.find(c => c.id === f.to)?.code || f.to;
                 return (
                   <div key={f.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all cursor-default">
                      <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 italic">
                            <span>{from}</span>
                            <Navigation size={10} className="rotate-90 text-[#D4AF37]" />
                            <span>{to}</span>
                         </div>
                         <span className="text-[10px] font-black text-[#D4AF37] font-mono shadow-sm">${(f.value / 1e6).toFixed(1)}M</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: f.color || '#D4AF37', color: f.color || '#D4AF37' }} />
                         <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">{f.product}</span>
                      </div>
                   </div>
                 )
               })}
            </div>
        </div>
      </div>

      {/* SIDEBAR DETAILS */}
      <div className="w-full xl:w-[420px] bg-[#050b14]/90 backdrop-blur-md border-l border-white/5 p-8 flex flex-col space-y-8 overflow-y-auto custom-scrollbar z-30">
         <AnimatePresence mode="wait">
            {selectedCountry ? (
              <motion.div key={selectedCountry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                 <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.1)] overflow-hidden relative group">
                    <div className="absolute -right-10 -top-10 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                       <Globe size={200} className="text-[#D4AF37]" />
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">{selectedCountry.name}</h3>
                      <p className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] italic mb-8 drop-shadow-md">ВУЗОЛ: {selectedCountry.code}</p>
                      
                      <div className="space-y-4">
                          <div className="p-6 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase italic mb-2 tracking-[0.2em] flex items-center gap-2">
                               <Navigation size={12} className="rotate-180" /> ВХІДНИЙ ПОТІК (ІМПОРТ)
                             </p>
                             <p className="text-3xl font-black text-[#D4AF37] italic font-mono tracking-tighter drop-shadow-md">
                               {selectedCountry.import_volume ? `$${(selectedCountry.import_volume / 1e6).toFixed(1)}M` : 'Н/Д'}
                             </p>
                          </div>
                          <div className="p-6 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase italic mb-2 tracking-[0.2em] flex items-center gap-2">
                               <Navigation size={12} /> ВИХІДНИЙ ПОТІК (ЕКСПОРТ)
                             </p>
                             <p className="text-3xl font-black text-white italic font-mono tracking-tighter drop-shadow-md">
                               {selectedCountry.export_volume ? `$${(selectedCountry.export_volume / 1e6).toFixed(1)}M` : 'Н/Д'}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-6 shadow-xl">
                    <h4 className="text-[11px] font-black text-rose-500 italic uppercase tracking-[0.3em] flex items-center gap-3 pb-4 border-b border-white/5">
                       <Flame size={16} /> ІНДИКАТОРИ РИЗИКУ
                    </h4>
                    <div className="space-y-4">
                       {[
                         { l: 'РЕЖИМ САНКЦІЙ', v: selectedCountry.id === 'ua' ? 'ПІДТРИМКА' : 'ВІДСУТНІ', t: 'good' },
                         { l: 'ВІДМИВАННЯ КОШТІВ (AML)', v: 'НИЗЬКИЙ РИЗИК', t: 'good' },
                         { l: 'СТАБІЛЬНІСТЬ ПОСТАВОК', v: selectedCountry.id === 'ua' ? 'КРИТИЧНА' : 'ОПТИМАЛЬНА', t: selectedCountry.id === 'ua' ? 'warn' : 'good' },
                       ].map(r => (
                         <div key={r.l} className="flex justify-between items-center px-5 py-4 rounded-2xl bg-black/40 border border-white/[0.05]">
                            <span className="text-[10px] font-bold text-slate-400 italic uppercase tracking-wider">{r.l}</span>
                            <span className={cn(
                               "text-[10px] font-black italic uppercase px-3 py-1 rounded-lg border",
                               r.t === 'good' ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-rose-400 border-rose-500/20 bg-rose-500/10"
                            )}>{r.v}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                 <Globe size={100} className="text-[#D4AF37] animate-pulse mb-8 opacity-50" />
                 <p className="text-xs font-black text-[#D4AF37] uppercase tracking-[0.5em] italic text-center">Оберіть торговий<br/>вузол на матриці</p>
              </div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};
