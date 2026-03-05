import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ArrowRight, GitMerge, FileSearch, Zap } from 'lucide-react';
import { analyticsService, SchemeData } from '../../services/unified/analytics.service';
import { cn } from '../../utils/cn';
import { premiumLocales } from '../../locales/uk/premium';

export const SchemesWidget: React.FC<{ persona: string }> = ({ persona }) => {
  const [schemes, setSchemes] = useState<SchemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const isTarget = persona === 'INQUISITOR';

  useEffect(() => {
    const loadSchemes = async () => {
      const data = await analyticsService.getDetectedSchemes();
      setSchemes(data);
      setLoading(false);
    };
    if (isTarget) loadSchemes();
  }, [persona]);

  if (!isTarget) return null;

  return (
    <div className="bg-slate-950/80 border border-red-500/20 rounded-[32px] overflow-hidden backdrop-blur-xl relative">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-500/20 animate-pulse">
            <ShieldAlert className="text-red-400" size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              {premiumLocales.schemes.title}
              <span className="px-2 py-0.5 rounded text-[9px] bg-red-500 text-white">LIVE</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">{premiumLocales.schemes.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-black text-red-500 animate-pulse">{premiumLocales.schemes.scanning}</span>
          </div>
        ) : (
          <AnimatePresence>
            {schemes.map((scheme, i) => (
              <motion.div
                key={scheme.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="group relative bg-black/40 border border-red-500/10 hover:border-red-500/40 rounded-2xl p-5 hover:bg-red-500/5 transition-all cursor-pointer overflow-hidden"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-5" />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-red-400 opacity-60">#{scheme.id}</span>
                    <span className="px-2 py-1 rounded-lg bg-red-900/30 text-red-300 text-[9px] font-bold uppercase border border-red-500/20">
                      {scheme.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-red-500 font-black text-sm">
                    <AlertTriangle size={14} />
                    {scheme.probability}% {premiumLocales.schemes.probabilityLabel}
                  </div>
                </div>

                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-red-200 transition-colors">
                  {scheme.name}
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {scheme.description}
                </p>

                {/* Scheme Flow Visualization */}
                <div className="flex items-center justify-between p-3 bg-black/60 rounded-xl border border-white/5 mb-4 relative">
                  {/* Dotted Line */}
                  <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-800 -translate-y-1/2 z-0 border-t border-dashed border-slate-700" />

                  {scheme.entities.map((entity, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-red-500/50 group-hover:bg-red-900/10 group-hover:text-red-400 transition-all">
                        {idx === 0 ? <GitMerge size={14} /> : idx === scheme.entities.length - 1 ? <FileSearch size={14} /> : <Zap size={14} />}
                      </div>
                      <span className="text-[8px] text-slate-500 max-w-[60px] text-center truncate">{entity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-center">
                    <span className="text-[9px] text-slate-500 uppercase">{premiumLocales.schemes.potentialLoss}</span>
                    <div className="text-sm font-bold text-white">
                      {(scheme.impact / 1000000).toFixed(1)}M UAH
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-red-900/20 transition-all flex items-center gap-2">
                    {premiumLocales.schemes.intercept} <ArrowRight size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
