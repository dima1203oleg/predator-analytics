import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Ship, CheckCircle2, Clock, MapPin, Search, Package } from 'lucide-react';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

import { intelligenceApi } from '../../services/api/intelligence';

interface TrackingStep {
  id: string;
  label: string;
  date?: string;
  status: 'completed' | 'current' | 'pending';
  location: string;
  icon: any;
}

export const LogisticsTrackerWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [trackingId, setTrackingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<TrackingStep[] | null>(null);

  if (persona !== 'TITAN') return null;

  const handleSearch = async () => {
    if (!trackingId) return;
    setIsSearching(true);
    setResult(null);

    try {
      const data = await intelligenceApi.getWidgetData('logistics', trackingId);
      // Map icons back if labels match or use generic mapping
      const steps = (Array.isArray(data) ? data : (data?.steps || [])).map((s: any) => ({
        ...s,
        icon: s.type === 'ship' ? Ship : s.type === 'truck' ? Truck : s.type === 'map' ? MapPin : Package
      }));
      setResult(steps.length > 0 ? steps : null);
    } catch (err) {
      console.error("Logistics tracking failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-slate-950/80 border border-indigo-500/20 rounded-[24px] backdrop-blur-xl overflow-hidden h-full min-h-[400px] flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20">
            <Truck className="text-indigo-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              {premiumLocales.logisticsTracker.title}
            </h3>
            <p className="text-[9px] text-slate-500 font-mono">{premiumLocales.logisticsTracker.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col gap-6 relative z-10">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-3.5 text-slate-500" size={16} />
             <input
               type="text"
               value={trackingId}
               onChange={(e) => setTrackingId(e.target.value)}
               placeholder={premiumLocales.logisticsTracker.placeholder}
               className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder-slate-600"
             />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !trackingId}
            className="px-6 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? <Clock className="animate-spin" size={18} /> : premiumLocales.logisticsTracker.search}
          </button>
        </div>

        {/* Results Timeline */}
        {result ? (
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-0 relative">
               {/* Vertical Line */}
               <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-800" />

               {result.map((step, index) => (
                 <motion.div
                   key={step.id}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: index * 0.1 }}
                   className="relative flex gap-4 pb-8 last:pb-0 group"
                 >
                   {/* Icon Bubble */}
                   <div className={cn(
                     "relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all",
                     step.status === 'completed' ? "bg-indigo-500 text-white border-slate-950" :
                     step.status === 'current' ? "bg-amber-500 text-white border-slate-950 animate-pulse" :
                     "bg-slate-900 text-slate-600 border-slate-800"
                   )}>
                     <step.icon size={18} />
                   </div>

                   {/* Content */}
                   <div className={cn(
                     "flex-1 p-4 rounded-xl border transition-all",
                     step.status === 'current' ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/5"
                   )}>
                     <div className="flex justify-between items-start mb-1">
                       <span className={cn(
                         "text-xs font-black uppercase tracking-wider",
                         step.status === 'completed' ? "text-indigo-400" :
                         step.status === 'current' ? "text-amber-400" : "text-slate-500"
                       )}>
                         {step.label}
                       </span>
                       <span className="text-[10px] font-mono text-slate-400">{step.date}</span>
                     </div>
                     <div className="text-sm text-white font-medium flex items-center gap-2">
                        <MapPin size={12} className="text-slate-500" />
                        {step.location}
                     </div>
                   </div>
                 </motion.div>
               ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
             <Ship size={64} strokeWidth={1} />
             <p className="text-xs uppercase tracking-widest">{premiumLocales.logisticsTracker.awaitingQuery}</p>
          </div>
        )}
      </div>
    </div>
  );
};
