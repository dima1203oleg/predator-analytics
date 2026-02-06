
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, ShieldCheck, CreditCard, Cpu, Sparkles } from 'lucide-react';
import { TacticalCard } from '../TacticalCard';

export interface FeatureToggle {
  key: string;
  label: string;
  description: string;
}

interface FeatureTogglesGridProps {
    currentEnv: any;
    onToggleChange: (key: any) => void;
    featureToggles: FeatureToggle[];
}

export const FeatureTogglesGrid: React.FC<FeatureTogglesGridProps> = ({
    currentEnv,
    onToggleChange,
    featureToggles
}) => {
    return (
        <TacticalCard variant="holographic" title={`Функції (${currentEnv.name})`} className="mb-6 border-slate-700/30">
            <div className="mb-4 p-4 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-3">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p>{currentEnv.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featureToggles.map((feature, idx) => {
                    const enabled = currentEnv.toggles[feature.key];
                    return (
                        <motion.div
                            key={feature.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => onToggleChange(feature.key)}
                            className={`
                                cursor-pointer group flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 relative 
                                ${enabled
                                    ? "bg-slate-900/60 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                    : "bg-slate-950/30 border-slate-800 hover:border-slate-700"}
                            `}
                        >
                            {enabled && (
                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            )}

                            <div className={`p-2.5 rounded-lg mt-0.5 transition-colors ${enabled ? "bg-emerald-500/20 text-emerald-400 scale-110" : "bg-slate-900 text-slate-600"}`}>
                                {feature.key === 'metrics' ? <Activity size={18} /> :
                                 feature.key === 'telemetry' ? <Globe size={18} /> :
                                 feature.key === 'rateLimit' ? <ShieldCheck size={18} /> :
                                 feature.key === 'billing' ? <CreditCard size={18} /> : <Cpu size={18} />}
                            </div>

                            <div className="flex-1">
                                <div className={`text-sm font-bold transition-colors ${enabled ? "text-emerald-100" : "text-slate-400 group-hover:text-slate-200"}`}>
                                    {feature.label}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                    {feature.description}
                                </div>
                            </div>

                            <div className={`w-10 h-5 rounded-full relative transition-colors mt-1 ${enabled ? "bg-emerald-500" : "bg-slate-700"}`}>
                                <motion.div
                                    animate={{ x: enabled ? 20 : 0 }}
                                    className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </TacticalCard>
    );
};
