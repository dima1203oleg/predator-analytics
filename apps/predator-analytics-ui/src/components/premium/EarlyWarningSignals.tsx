import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Activity, ChevronRight, Fingerprint, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface EWSignal {
    id: string;
    ueid: string;
    title: string;
    category: 'behavioral' | 'institutional' | 'influence' | 'structural' | 'predictive';
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    timestamp: string;
    summary: string;
}

const EarlyWarningSignals: React.FC = () => {
    const { t } = useTranslation();
    const [signals, setSignals] = useState<EWSignal[]>([]);

    // Симуляція потоку EWS сигналів з v56.5-ELITE-SM Signal Bus
    useEffect(() => {
        const initialSignals: EWSignal[] = [
            {
                id: 'ews-1',
                ueid: 'UA-ENT-8562-X',
                title: 'Аномальна поведінкова волатильність (BVI)',
                category: 'behavioral',
                severity: 'high',
                confidence: 0.94,
                timestamp: '14:20:05',
                summary: 'Різка зміна митного брокера та одночасне заниження вартості на 45% за кодом 8507.'
            },
            {
                id: 'ews-2',
                ueid: 'UA-ENT-2210-Y',
                title: 'Інституційний перекіс (AAI)',
                category: 'institutional',
                severity: 'critical',
                confidence: 0.88,
                timestamp: '14:15:30',
                summary: 'Виявлено 100% лояльність до митного посту "A8" при 0% фізичних перевірок.'
            }
        ];
        setSignals(initialSignals);
    }, []);

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
            case 'high': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
            case 'medium': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        }
    };

    return (
        <Card className="bg-slate-950/40 border-slate-800/50 backdrop-blur-3xl relative overflow-hidden border-r-rose-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[80px] pointer-events-none" />

            <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-rose-500/20 blur-md animate-pulse" />
                            <ShieldAlert className="text-rose-500 relative z-10" size={24} />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-black tracking-widest uppercase">
                                {t('predictions.ews_title')}
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                Neural Early Warning Engine v56.5-ELITE.5
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-slate-900/50 border-slate-800 text-[10px] flex items-center gap-1">
                        <Activity size={10} className="animate-pulse text-rose-500" />
                        LIVE SCAN
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
                <AnimatePresence>
                    {signals.map((signal) => (
                        <motion.div
                            key={signal.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={getSeverityStyles(signal.severity)}>
                                            {signal.severity.toUpperCase()}
                                        </Badge>
                                        <span className="text-[10px] font-mono text-slate-500">{signal.timestamp}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-white mt-1 group-hover:text-rose-400 transition-colors">
                                        {signal.title}
                                    </h4>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confidence</div>
                                    <div className="text-xs font-black text-cyan-400">{(signal.confidence * 100).toFixed(0)}%</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 py-2 px-3 rounded-xl bg-black/20 border border-white/5 mb-3">
                                <div className="flex items-center gap-2">
                                    <Fingerprint size={14} className="text-slate-500" />
                                    <span className="text-[10px] font-mono text-slate-400">{signal.ueid}</span>
                                </div>
                                <div className="h-3 w-px bg-slate-800" />
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {t(`layers.${signal.category}`)}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                                {signal.summary}
                            </p>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 h-8 text-[10px] font-black uppercase border-slate-800 hover:bg-white/5">
                                    {t('predictions.ews_investigate')}
                                    <ChevronRight size={14} className="ml-1" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-rose-400">
                                    <AlertTriangle size={14} />
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
};

export default EarlyWarningSignals;