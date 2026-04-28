/**
 *   OSINT VISUAL COMPONENTS
 *  адар, Хітмап, Стрічка подій.
 * Усі тексти — українською (HR-03/HR-04).
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { FeedItem, SEVERITY_CONFIG } from './OsintTypes';

// ─── Animated Radar Background ──────────────────────
export const RadarBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {[1, 2, 3, 4].map(i => (
                <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-500/10"
                    style={{ width: `${i * 25}%`, height: `${i * 25}%` }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.15, 0.3] }}
                    transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
            <motion.div
                className="absolute left-1/2 top-1/2 w-1/2 h-[1px] origin-left"
                style={{
                    background: 'linear-gradient(90deg, rgba(244,63,94,0.4), transparent)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                    key={`dot-${i}`}
                    className="absolute w-1 h-1 rounded-full bg-rose-400/30"
                    style={{
                        left: `${15 + Math.random() * 70}%`,
                        top: `${10 + Math.random() * 80}%`,
                    }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
                    transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
                />
            ))}
        </div>
    );
};

// ─── Risk Heatmap Bar ───────────────────────────────
export const RiskHeatmapBar: React.FC<{ source: string; risk: number; count: number; index: number }> = ({ source, risk, count, index }) => {
    const color = risk >= 90 ? 'from-red-600 to-red-500' :
                  risk >= 70 ? 'from-amber-600 to-amber-500' :
                  risk >= 50 ? 'from-yellow-600 to-yellow-500' :
                               'from-rose-600 to-rose-500';
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 group"
        >
            <div className="w-32 text-[10px] font-bold text-slate-400 truncate group-hover:text-white transition-colors">
                {source}
            </div>
            <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden relative">
                <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${risk}%` }}
                    transition={{ duration: 1.2, delay: index * 0.1, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,0.2)_3px,rgba(0,0,0,0.2)_4px)]" />
            </div>
            <div className="w-10 text-right text-[11px] font-black font-mono text-white">{risk}%</div>
            <div className="w-14 text-right text-[9px] font-mono text-slate-500">{count.toLocaleString()}</div>
        </motion.div>
    );
};

// ─── Live Feed Item ─────────────────────────────────
export const FeedItemRow: React.FC<{ item: FeedItem; index: number }> = ({ item, index }) => {
    const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.LOW;
    const timeAgo = (() => {
        const diff = Date.now() - new Date(item.timestamp).getTime();
        if (diff < 60000) return `${Math.round(diff / 1000)}с`;
        if (diff < 3600000) return `${Math.round(diff / 60000)}хв`;
        return `${Math.round(diff / 3600000)}г`;
    })();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
                'p-3 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.01] cursor-pointer group',
                sev.bg, sev.border
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border uppercase', sev.bg, sev.border, sev.text)}>
                            {item.severity}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500">{item.source}</span>
                        <span className="text-[9px] text-slate-600 ml-auto font-mono">{timeAgo} тому</span>
                    </div>
                    <p className="text-[11px] font-bold text-white truncate">{item.target}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.finding}</p>
                </div>
                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-white transition-colors shrink-0 mt-1" />
            </div>
        </motion.div>
    );
};
