
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { ViewHeader } from '../../components/ViewHeader';
import { TacticalCard } from '../TacticalCard';
import { ModelCandidate } from '../../types';

interface NasLeaderboardViewProps {
    models: ModelCandidate[];
}

export const NasLeaderboardView: React.FC<NasLeaderboardViewProps> = ({ models }) => {
    return (
        <div className="space-y-6">
            <ViewHeader
                title="Реєстр Чемпіонів SOTA"
                icon={<Trophy size={20} className="icon-3d-amber" />}
                breadcrumbs={['ІНТЕЛЕКТ', 'NAS', 'РЕЄСТР SOTA']}
                stats={[
                    { label: 'Підтверджено SOTA', value: '12', color: 'primary' },
                    { label: 'Середня Точність', value: '94.2%', color: 'success' }
                ]}
            />
            <TacticalCard variant="holographic" title="Архитектурна Еліта (Зала Слави)" className="bg-slate-900/40 border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
                                <th className="px-6 py-2">Ранг</th>
                                <th className="px-6 py-2">Архітектура</th>
                                <th className="px-6 py-2">Точність</th>
                                <th className="px-6 py-2">Затримка</th>
                                <th className="px-6 py-2">Сектор</th>
                                <th className="px-6 py-2">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {models
                                .sort((a, b) => b.metrics.accuracy - a.metrics.accuracy)
                                .slice(0, 10)
                                .map((m, idx) => (
                                    <tr key={m.id} className="bg-black/40 hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 rounded-l-2xl border-l border-t border-b border-white/5">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500 text-white shadow-[0_0_10px_#f59e0b]' : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-t border-b border-white/5">
                                            <div className="text-xs font-black text-white uppercase tracking-wider">{m.architecture}</div>
                                            <div className="text-[9px] text-slate-600 mt-1 uppercase font-bold tracking-tighter">Перевірено на {m.provider}</div>
                                        </td>
                                        <td className="px-6 py-4 border-t border-b border-white/5">
                                            <span className="text-sm font-black text-emerald-400 font-mono">{(m.metrics.accuracy * 100).toFixed(1)}%</span>
                                        </td>
                                        <td className="px-6 py-4 border-t border-b border-white/5 text-slate-400 font-mono text-xs">
                                            {m.metrics.latency.toFixed(0)}ms
                                        </td>
                                        <td className="px-6 py-4 border-t border-b border-white/5">
                                            <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-black border border-blue-500/20">NAS</span>
                                        </td>
                                        <td className="px-6 py-4 rounded-r-2xl border-r border-t border-b border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'DEPLOYED' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{m.status}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            {models.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs font-mono">
                                        Реєстр порожній. Розпочніть турнір для генерації SOTA кандидатів.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </TacticalCard>
        </div>
    );
};
