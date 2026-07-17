import { Button } from '@/components/ui/button';
import { HoloCard } from '@/components/ui/HoloCard';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, TrendingDown, Target, Activity, Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { wargamingApi, WarScenario } from '@/services/api/wargaming';
import { cn } from '@/lib/utils';

export const WarGamingWidget: React.FC = () => {
    const [scenarios, setScenarios] = useState<WarScenario[]>([]);
    const [loading, setLoading] = useState(true);
    const [simulating, setSimulating] = useState<string | null>(null);
    const [forecast, setForecast] = useState({ current_budget: 0, projected_loss: 0 });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [scenData, forecastData] = await Promise.all([
                wargamingApi.getActiveScenarios(),
                wargamingApi.getBudgetForecast()
            ]);
            setScenarios(scenData);
            setForecast(forecastData);
        } catch (error) {
            console.error('Failed to fetch wargaming data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRunSimulation = async (id: string) => {
        setSimulating(id);
        try {
            await wargamingApi.runSimulation(id);
            await fetchData();
        } catch (error) {
            console.error('Simulation failed', error);
        } finally {
            setSimulating(null);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            await wargamingApi.generateScenarios();
            await fetchData();
        } catch (error) {
            console.error('Generation failed', error);
        } finally {
            setLoading(false);
        }
    };

    const severityColors = {
        low: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
        medium: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
        high: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
        critical: 'text-red-400 border-red-500/20 bg-red-500/5 '
    };

    return (
        <HoloCard 
            variant="holographic" 
            title="⚔️ WAR-GAMING HORIZON" 
            className="border-indigo-500/30 bg-indigo-950/10 min-h-[400px]"
        >
            <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">БЮДЖЕТ ПІД РИЗИКОМ:</div>
                        <div className="text-xl font-black text-red-500 font-mono italic">
                            -${(forecast.projected_loss / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">АКТИВНИХ ЗАГРОЗ:</div>
                        <div className="text-xl font-black text-indigo-400 font-mono italic">
                            {scenarios.length}
                        </div>
                    </div>
                </div>

                {/* Scenarios List */}
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {scenarios.map((s) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "p-4 rounded-xl border transition-all relative group",
                                    severityColors[s.severity] || severityColors.low
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={14} />
                                        <span className="text-[11px] font-black uppercase tracking-tight italic">{s.title}</span>
                                    </div>
                                    <Button variant="cyber" 
                                        onClick={() => handleRunSimulation(s.id)}
                                        disabled={simulating === s.id}
                                        className="p-1.5 rounded-lg bg-black/40 border border-white/10 hover:border-white/30 transition-all"
                                    >
                                        {simulating === s.id ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                                    </Button>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-tight italic line-clamp-2">
                                    {s.description}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[8px] font-mono text-slate-500 uppercase">{s.status}</span>
                                    <span className="text-[8px] font-mono text-slate-500">{new Date(s.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    
                    {scenarios.length === 0 && !loading && (
                        <div className="py-10 text-center">
                            <ShieldAlert size={32} className="mx-auto text-slate-700 mb-2 opacity-20" />
                            <p className="text-[10px] text-slate-600 font-black uppercase italic tracking-widest">ЗАГРОЗ НЕ ВИЯВЛЕНО</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/5 flex gap-3">
                    <Button variant="cyber" 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest italic hover:bg-indigo-600/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap size={14} className={loading ? '' : ''} />
                        ГЕНЕРУВАТИ СЦЕНАРІЇ
                    </Button>
                    <Button variant="cyber" 
                        onClick={fetchData}
                        className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </div>
            </div>
        </HoloCard>
    );
};
