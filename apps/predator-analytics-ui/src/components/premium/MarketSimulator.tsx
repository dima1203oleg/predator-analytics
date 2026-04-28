import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Percent, DollarSign, Play, RefreshCw, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

const MarketSimulator: React.FC = () => {
    const { t } = useTranslation();
    const [currency, setCurrency] = useState(41.5);
    const [logistics, setLogistics] = useState(12);
    const [isSimulating, setIsSimulating] = useState(false);
    const [result, setResult] = useState<{ margin: number; risk: string } | null>(null);

    const runSimulation = async () => {
        setIsSimulating(true);
        // Імітація виклику до v61.0-ELITE-SM ML backend
        setTimeout(() => {
            const simulatedMargin = 25.4 - (currency - 40) * 0.5 - (logistics - 10) * 0.8;
            setResult({
                margin: parseFloat(simulatedMargin.toFixed(2)),
                risk: simulatedMargin < 15 ? 'critical' : simulatedMargin < 22 ? 'elevated' : 'stable'
            });
            setIsSimulating(false);
        }, 1200);
    };

    return (
        <Card className="bg-slate-925/60 border-slate-800/50 backdrop-blur-xl border-t-cyan-500/30 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-black tracking-tighter flex items-center gap-2">
                            <TrendingUp className="text-cyan-400 w-5 h-5" />
                            {t('market.simulator_title')}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium">
                            Предиктивне моделювання маржинальності (ML Engine v61.0-ELITE)
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/5">v61.0-ELITE-SM</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <DollarSign size={12} /> {t('market.sim_param_currency')}
                            </label>
                            <span className="text-cyan-400 font-mono font-bold">{currency}</span>
                        </div>
                        <input
                            type="range" min="38" max="48" step="0.1" value={currency}
                            onChange={(e) => setCurrency(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                <Percent size={12} /> {t('market.sim_param_logistics')}
                            </label>
                            <span className="text-cyan-400 font-mono font-bold">{logistics}%</span>
                        </div>
                        <input
                            type="range" min="5" max="30" step="1" value={logistics}
                            onChange={(e) => setLogistics(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                </div>

                <Button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-400 font-black h-12"
                >
                    {isSimulating ? <RefreshCw className="animate-spin mr-2" /> : <Play className="mr-2 fill-current" />}
                    {isSimulating ? 'ОБЧИСЛЕННЯ...' : t('market.sim_run_ai')}
                </Button>

                <AnimatePresence>
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-2 gap-4"
                        >
                            <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('market.sim_result_margin')}</span>
                                <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                    {result.margin}% <BarChart3 size={16} className="text-emerald-400" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('market.sim_result_risk')}</span>
                                <Badge className="mt-1 uppercase text-[10px]">{t(`cers.${result.risk}`)}</Badge>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};
export default MarketSimulator;