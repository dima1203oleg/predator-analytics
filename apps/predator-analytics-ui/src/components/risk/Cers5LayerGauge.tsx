/**
 * 📊 CERS 5-Layer Gauge | PREDATOR v56.5-ELITE-SM-EXTENDED
 * Візуалізація 5 шарів ризику (Behavioral, Institutional, Influence, Structural, Predictive).
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Shield, Zap, Network, Brain,
    AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface Cers5LayerFactors {
    behavioral: number;
    institutional: number;
    influence: number;
    structural: number;
    predictive: number;
}

interface Cers5LayerGaugeProps {
    factors: Cers5LayerFactors;
    totalScore: number;
    className?: string;
}

const LAYER_CONFIG = [
    { key: 'behavioral', label: 'Поведінковий', icon: Activity, color: '#f43f5e', weight: 0.25 },
    { key: 'institutional', label: 'Інституційний', icon: Shield, color: '#a855f7', weight: 0.20 },
    { key: 'influence', label: 'Вплив', icon: Zap, color: '#06b6d4', weight: 0.20 },
    { key: 'structural', label: 'Структурний', icon: Network, color: '#10b981', weight: 0.15 },
    { key: 'predictive', label: 'Прогностичний', icon: Brain, color: '#f59e0b', weight: 0.20 }
];

export const Cers5LayerGauge: React.FC<Cers5LayerGaugeProps> = ({ factors, totalScore, className }) => {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-5 gap-6 w-full", className)}>
            {LAYER_CONFIG.map((layer, idx) => {
                // @ts-ignore
                const score = factors[layer.key] || 0;
                const Icon = layer.icon;

                return (
                    <motion.div
                        key={layer.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 bg-slate-900/40 border border-white/5 rounded-[32px] panel-3d group relative overflow-hidden"
                    >
                        <div
                            className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.08] transition-opacity"
                            style={{ backgroundColor: layer.color }}
                        />

                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-white/20 transition-all">
                                <Icon size={20} style={{ color: layer.color }} />
                            </div>
                            <span className="text-xs font-black font-mono" style={{ color: layer.color }}>
                                {Math.round(score * 100)}%
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{layer.label}</h4>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: layer.color }}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-600 uppercase">Вага: {layer.weight * 100}%</span>
                            {score > 0.7 ? (
                                <AlertTriangle size={12} className="text-rose-500 animate-pulse" />
                            ) : score < 0.3 ? (
                                <CheckCircle size={12} className="text-emerald-500" />
                            ) : (
                                <Info size={12} className="text-blue-500" />
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {/* Total Indicator (Optional full span or separate) */}
            <div className="md:col-span-5 p-8 bg-black/40 border border-white/10 rounded-[40px] flex items-center justify-between mt-4 backdrop-blur-3xl shadow-3xl">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <svg className="w-24 h-24 -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#1e293b" strokeWidth="10" />
                            <motion.circle
                                cx="50%" cy="50%" r="45%" fill="none"
                                stroke={totalScore > 0.7 ? '#f43f5e' : totalScore > 0.4 ? '#f59e0b' : '#10b981'}
                                strokeWidth="10"
                                strokeDasharray="283"
                                initial={{ strokeDashoffset: 283 }}
                                animate={{ strokeDashoffset: 283 - (totalScore * 283) }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-black text-white font-mono">{Math.round(totalScore * 100)}</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Canonical CERS Score</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">v56.5-ELITE_MOD_INTEGRITY</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">СТАТУС_РИЗИКУ</span>
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            totalScore > 0.7 ? "bg-rose-500/10 border-rose-500/30 text-rose-500" :
                                totalScore > 0.4 ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                                    "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                        )}>
                            {totalScore > 0.7 ? 'КРИТИЧНО' : totalScore > 0.4 ? 'СЕРЕДНІЙ' : 'СТАБІЛЬНО'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
