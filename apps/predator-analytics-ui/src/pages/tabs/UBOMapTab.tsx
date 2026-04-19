import React from 'react';
import { Map, MapPin, Globe, Layers, Navigation } from 'lucide-react';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ui/ViewHeader';

export const UBOMapTab: React.FC = () => {
  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <ViewHeader 
        title="КАРТА БЕНЕФІЦІАРІВ"
        subtitle="Геопросторовий аналіз кінцевих власників (UBO) та офшорних юрисдикцій"
        stats={[
          { label: 'ЮРИСДИКЦІЇ', value: '184' },
          { label: 'ОФШОРНІ ТОЧКИ', value: '4,212' },
          { label: 'АКТИВНІСТЬ', value: 'LIVE' }
        ]}
      />

      <div className="flex-1 relative rounded-2xl border border-white/5 bg-slate-900/40 overflow-hidden shadow-2xl">
        {/* Імітація мапи */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526770146552-5150d0adfe5d?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-20" />
        
        {/* HUD Elements */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <TacticalCard className="!p-2 bg-slate-950/80 backdrop-blur-md">
            <div className="flex flex-col gap-1">
              {[Globe, Layers, Navigation].map((Icon, i) => (
                <button key={i} className="p-2 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded-lg transition-all">
                  <Icon size={18} />
                </button>
              ))}
            </div>
          </TacticalCard>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4">
            <div className="inline-flex p-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 animate-pulse">
                <Map size={48} className="text-cyan-500" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">MAP_ENGINE_INITIALIZING</h3>
            <p className="text-xs text-slate-500 font-mono">GEO_SYNC: 98% [CONNECTED TO QDRANT_VECTOR_DB]</p>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-10 w-64">
           <TacticalCard className="bg-slate-950/90 backdrop-blur-xl border-cyan-500/20">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Легенда ризиків</h4>
              <div className="space-y-2">
                {[
                  { label: 'ОФШОРНА ЗОНА', color: 'bg-red-500' },
                  { label: 'САНКЦІЙНА ЛОКАЦІЯ', color: 'bg-orange-500' },
                  { label: 'ПЕРЕВІРЕНИЙ UBO', color: 'bg-emerald-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`} />
                    <span className="text-[10px] font-bold text-slate-300 uppercase">{item.label}</span>
                  </div>
                ))}
              </div>
           </TacticalCard>
        </div>
      </div>
    </div>
  );
};

export default UBOMapTab;
