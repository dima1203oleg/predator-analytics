import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Navigation, Zap, DollarSign, Crosshair, 
  ZoomIn, ZoomOut, RefreshCw, Ship, MapPin, ShieldCheck,
  Crown, Layers
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';

import { intelligenceApi } from '@/services/api';

// --- MOCK DATA ---
const MOCK_COUNTRIES = [
  { id: 'ua', name: 'Україна', code: 'UA', x: 55, y: 35 },
  { id: 'cn', name: 'Китай', code: 'CN', x: 80, y: 45 },
  { id: 'us', name: 'США', code: 'US', x: 20, y: 40 },
  { id: 'de', name: 'Німеччина', code: 'DE', x: 50, y: 30 },
];

const MOCK_FLOWS = [
  { id: 'f1', from: 'cn', to: 'ua', value: 45000000, product: 'ЕЛЕКТРОНІКА', color: '#D4AF37' },
  { id: 'f2', from: 'de', to: 'ua', value: 32000000, product: 'МАШИНОБУДУВАННЯ', color: '#E11D48' },
];

export const TradeFlowTab: React.FC = () => {
  const [zoom, setZoom] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>(MOCK_COUNTRIES);
  const [flows, setFlows] = useState<any[]>(MOCK_FLOWS);
  const [loading, setLoading] = useState(true);
  const { isOffline } = useBackendStatus();

  useEffect(() => {
    const fetchTradeFlows = async () => {
        try {
            setLoading(true);
            const data = await intelligenceApi.getTradeFlows();
            if (data) {
                if (data.countries) setCountries(data.countries);
                if (data.flows) setFlows(data.flows);
            }
        } catch (error) {
            console.error('Failed to fetch flows', error);
        } finally {
            setLoading(false);
        }
    };
    fetchTradeFlows();
  }, []);

  return (
    <div className="h-full flex flex-col xl:flex-row relative overflow-hidden bg-black/40">
      {/* MAP AREA */}
      <div className="flex-1 relative p-8 h-[600px] xl:h-auto overflow-hidden group">
        <div className="absolute top-8 left-8 z-20 space-y-2">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4 drop-shadow-[0_0_20px_rgba(0,0,0,1)]">
                <Globe size={32} className="text-[#D4AF37]" /> Потоки товарів
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] pl-12 border-l-2 border-[#D4AF37]/20 drop-shadow-md">GLOBAL_FLOW_GEOSPATIAL // TRADE_MATRIX</p>
        </div>

        <div className="absolute top-8 right-8 z-20 flex gap-2">
           <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-3 bg-black/80 border border-white/10 rounded-xl text-slate-400 hover:text-[#D4AF37] transition-all"><ZoomIn size={18} /></button>
           <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-3 bg-black/80 border border-white/10 rounded-xl text-slate-400 hover:text-[#D4AF37] transition-all"><ZoomOut size={18} /></button>
        </div>

        {/* SVG MAP SIMULATION */}
        <div className="absolute inset-0 flex items-center justify-center p-12 overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="transition-transform duration-700 ease-out" style={{ transform: `scale(${zoom})` }}>
               {/* FLOWS */}
               {flows.map((flow) => {
                  const from = countries.find(c => c.id === flow.from)!;
                  const to = countries.find(c => c.id === flow.to)!;
                  if (!from || !to) return null;
                  const midX = (from.x + to.x) / 2;
                  const midY = (from.y + to.y) / 2 - 10;
                  return (
                     <g key={flow.id}>
                        <path d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`} fill="none" stroke={flow.color || '#D4AF37'} strokeWidth={0.8} strokeOpacity={0.4} />
                     </g>
                  );
               })}
               {/* NODES */}
               {countries.map((c) => (
                  <g key={c.id} onClick={() => setSelectedCountry(c)} className="cursor-pointer">
                     <circle cx={c.x} cy={c.y} r={c.id === 'ua' ? 1.5 : 1} fill={c.id === 'ua' ? '#D4AF37' : '#334155'} />
                     <circle cx={c.x} cy={c.y} r={3} fill={c.id === 'ua' ? '#D4AF37' : '#334155'} fillOpacity={0.1} className="animate-pulse" />
                     <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={1.5} className="fill-slate-600 font-black italic">{c.code}</text>
                  </g>
               ))}
            </svg>
        </div>

        {/* FLOATING HUD */}
        <div className="absolute bottom-8 left-8 z-20 w-[300px] p-6 bg-black/90 backdrop-blur-3xl border border-white/5 rounded-3xl space-y-6 shadow-2xl">
            <h4 className="text-[9px] font-black text-white italic uppercase tracking-[0.4em] flex items-center gap-3">
                <Layers size={14} className="text-[#D4AF37]" /> АКТИВНІ_ПОТОКИ
            </h4>
            <div className="space-y-3">
               {flows.map(f => (
                 <div key={f.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center group hover:border-[#D4AF37]/30 transition-all cursor-default text-xs">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color || '#D4AF37' }} />
                       <span className="text-[10px] font-black text-white italic truncate w-32">{f.product}</span>
                    </div>
                    <span className="text-[9px] font-black text-[#D4AF37] font-mono">${(f.value / 1e6).toFixed(1)}M</span>
                 </div>
               ))}
            </div>
        </div>
      </div>

      {/* SIDEBAR DETAILS */}
      <div className="w-full xl:w-[400px] bg-black/40 border-l border-white/5 p-8 flex flex-col space-y-8 overflow-y-auto custom-scrollbar shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
         <AnimatePresence mode="wait">
            {selectedCountry ? (
              <motion.div key={selectedCountry.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                 <div className="p-8 rounded-[2.5rem] bg-[#D4AF37]/[0.03] border border-[#D4AF37]/20 shadow-2xl overflow-hidden relative">
                    <div className="absolute -right-4 -top-4 opacity-5 rotate-12">
                       <Globe size={150} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">{selectedCountry.name}</h3>
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic mb-8">ISO_CODE: {selectedCountry.code}</p>
                    
                    <div className="space-y-4">
                       <div className="p-5 rounded-2xl bg-black/60 border border-white/5 shadow-inner">
                          <p className="text-[8px] font-black text-slate-600 uppercase italic mb-1 tracking-widest">Обсяг імпорту</p>
                          <p className="text-2xl font-black text-[#D4AF37] italic font-mono tracking-tighter">$450.2M</p>
                       </div>
                       <div className="p-5 rounded-2xl bg-black/60 border border-white/5 shadow-inner">
                          <p className="text-[8px] font-black text-slate-600 uppercase italic mb-1 tracking-widest">Обсяг експорту</p>
                          <p className="text-2xl font-black text-white italic font-mono tracking-tighter">$12.4M</p>
                       </div>
                    </div>
                 </div>

                 <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                    <h4 className="text-[10px] font-black text-[#D4AF37] italic uppercase tracking-[0.4em] flex items-center gap-3 pb-4 border-b border-white/5">
                       <ShieldCheck size={16} /> RISK_COMPLIANCE
                    </h4>
                    <div className="space-y-4">
                       {[
                         { l: 'FATF_STATUS', v: 'WHITE_LIST', t: 'low' },
                         { l: 'SANCTIONS', v: '0 MATCHES', t: 'none' },
                         { l: 'PORT_LOGISTICS', v: 'OPTIMAL', t: 'good' },
                       ].map(r => (
                         <div key={r.l} className="flex justify-between items-center px-4 py-3 rounded-xl bg-black/40 border border-white/[0.04]">
                            <span className="text-[9px] font-bold text-slate-500 italic uppercase">{r.l}</span>
                            <span className="text-[10px] font-black text-emerald-500 italic uppercase">{r.v}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                 <Crosshair size={80} className="text-slate-700 animate-spin-slow mb-8" />
                 <p className="text-sm font-black text-slate-600 uppercase tracking-[0.5em] italic text-center">Оберіть торговий вузол на карті</p>
              </div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};
