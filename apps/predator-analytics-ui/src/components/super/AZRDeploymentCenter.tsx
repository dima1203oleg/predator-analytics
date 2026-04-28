import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Server, GitBranch, ShieldCheck, Activity,
    Globe, Database, ArrowUpRight, CheckCircle2,
    Clock, Terminal, Settings, RefreshCw, AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';

interface DeploymentStep {
    id: string;
    name: string;
    description: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    timestamp?: string;
}

export const AZRDeploymentCenter: React.FC = () => {
    const [currentVersion, setCurrentVersion] = useState('v45.0.0');
    const [targetVersion, setTargetVersion] = useState('v45.1.0-ALPHA-1');
    const [isDeploying, setIsDeploying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeStep, setActiveStep] = useState(0);

    const steps: DeploymentStep[] = [
        { id: '1', name: 'SOVEREIGN_AUDIT', description: 'Перевірка цілісності коду AZR_CORE', status: activeStep > 0 ? 'COMPLETED' : activeStep === 0 && isDeploying ? 'IN_PROGRESS' : 'PENDING' },
        { id: '2', name: 'NEURAL_WEIGHTS_SYNC', description: 'Синхронізація нейронних ваг з AI-вузлом', status: activeStep > 1 ? 'COMPLETED' : activeStep === 1 && isDeploying ? 'IN_PROGRESS' : 'PENDING' },
        { id: '3', name: 'CANARY_RESERVATION', description: 'Бронювання ресурсів у K8S кластері', status: activeStep > 2 ? 'COMPLETED' : activeStep === 2 && isDeploying ? 'IN_PROGRESS' : 'PENDING' },
        { id: '4', name: 'TRAFFIC_SHIFT', description: 'Перенаправлення 5% потоку на нову версію', status: activeStep > 3 ? 'COMPLETED' : activeStep === 3 && isDeploying ? 'IN_PROGRESS' : 'PENDING' },
        { id: '5', name: 'HEALTH_VERIFICATION', description: 'Фінальна перевірка системних метрик', status: activeStep > 4 ? 'COMPLETED' : activeStep === 4 && isDeploying ? 'IN_PROGRESS' : 'PENDING' }
    ];

    useEffect(() => {
        if (isDeploying) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        setIsDeploying(false);
                        clearInterval(interval);
                        return 100;
                    }
                    const next = prev + (100 / steps.length / 5);
                    const currentStepIndex = Math.floor(next / (100 / steps.length));
                    setActiveStep(currentStepIndex);
                    return next;
                });
            }, 200);
            return () => clearInterval(interval);
        }
    }, [isDeploying]);

    const handleStartDeployment = () => {
        setIsDeploying(true);
        setProgress(0);
        setActiveStep(0);
    };

    return (
        <div className="space-y-10">
            {/* Version Header */}
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-5 p-8 bg-slate-900/60 border border-white/5 rounded-[40px] shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] group-hover:bg-blue-500/20 transition-all rounded-full" />
                    <div className="relative flex items-center gap-6">
                        <div className="p-5 bg-blue-500/20 rounded-3xl border border-blue-500/30">
                            <Server size={32} className="text-blue-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">ПОТОЧНА ВЕ� СІЯ</div>
                            <div className="text-4xl font-black text-white font-mono tracking-tighter">
                                {currentVersion}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Стабільна � обота</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-2 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <ArrowUpRight size={24} className="text-slate-500" />
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-5 p-8 bg-slate-900/40 border border-white/5 rounded-[40px] shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 blur-[60px] group-hover:bg-purple-500/20 transition-all rounded-full" />
                    <div className="relative flex items-center gap-6">
                        <div className="p-5 bg-purple-500/20 rounded-3xl border border-purple-500/30">
                            <Rocket size={32} className="text-purple-400" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">ТА� ГЕТ-ВЕ� СІЯ (AZR_AUTO)</div>
                            <div className="text-4xl font-black text-white font-mono tracking-tighter">
                                {targetVersion}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Очікує Деплою</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deployment Flow */}
            <div className="p-10 bg-black/40 border border-white/5 rounded-[48px] shadow-2xl backdrop-blur-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-dot-grid opacity-5 pointer-events-none" />

                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">ЦЕНТ� АЛЬНИЙ МОНІТО�  � ОЗГО� ТАННЯ</h3>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mt-1">Автономний Контролер Інфраструктури v8.2</p>
                    </div>
                    {!isDeploying ? (
                        <button
                            onClick={handleStartDeployment}
                            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-500/20 flex items-center gap-3 active:scale-95"
                        >
                            <PlayIcon size={18} /> ІНІЦІЮВАТИ ROLL-OUT
                        </button>
                    ) : (
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">П� ОГ� ЕС</div>
                                <div className="text-2xl font-black text-blue-400 font-mono leading-none">{Math.round(progress)}%</div>
                            </div>
                            <RefreshCw size={24} className="text-blue-500 animate-spin" />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={step.id}
                            className={`flex items-center gap-8 p-6 rounded-[32px] border transition-all duration-700 ${
                                step.status === 'IN_PROGRESS' ? 'bg-blue-500/10 border-blue-500/30 shadow-xl' :
                                step.status === 'COMPLETED' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' :
                                'bg-slate-900/40 border-white/5 opacity-30'
                            }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                                step.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white animate-pulse' :
                                step.status === 'COMPLETED' ? 'bg-emerald-500 text-white' :
                                'bg-slate-800 border-white/5 text-slate-600'
                            }`}>
                                {step.status === 'COMPLETED' ? <CheckCircle2 size={24} /> : <span className="font-black text-lg">{idx + 1}</span>}
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-lg font-black uppercase tracking-widest ${
                                    step.status === 'IN_PROGRESS' ? 'text-white' :
                                    step.status === 'COMPLETED' ? 'text-emerald-400' : 'text-slate-500'
                                }`}>
                                    {step.name}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">{step.description}</p>
                            </div>
                            {step.status === 'IN_PROGRESS' && (
                                <div className="flex gap-4 items-center">
                                    <div className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-widest">Аналіз...</div>
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0, 1, 0] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                className="w-1.5 h-1.5 rounded-full bg-blue-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Live Console Output during deployment */}
                {isDeploying && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-10 p-6 bg-black rounded-3xl border border-blue-500/30 font-mono text-[10px] text-blue-400/80 space-y-1"
                    >
                        <div>[SYSTEM] ІНІЦІАЛІЗАЦІЯ GITOPS � УКОСТИСКАННЯ...</div>
                        <div>[K8S] � ЕЗЕ� ВУВАННЯ CANARY П� ОСТО� У ІМЕН: predator-canary-v45...</div>
                        <div>[SCAN] ПЕ� ЕВІ� КА ПОЛІТИКИ БЕЗПЕКИ: П� ОЙДЕНО (VULN: 0)</div>
                        {progress > 40 && <div>[NEURAL] СИНХ� ОНІЗАЦІЯ ЕМБЕДИНГІВ (1024-D) З QDRANT...</div>}
                        {progress > 70 && <div>[DEPLOY] ПОЧАТО ROLL-OUT: 1 З 12 ПОДІВ ЗАПУЩЕНО...</div>}
                        <div className="animate-pulse">_</div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const PlayIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);
