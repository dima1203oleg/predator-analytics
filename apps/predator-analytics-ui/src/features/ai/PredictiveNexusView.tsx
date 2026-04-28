import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Bot,
  Box,
  Brain,
  Cpu,
  RefreshCw,
  Target,
  Clock,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { RiskLevelValue } from '@/types/intelligence';
import { PageTransition } from '@/components/layout/PageTransition';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResourceDynamicsChart } from '../infrastructure/components/ResourceDynamicsChart';
import { ClusterTopology } from '../infrastructure/components/ClusterTopology';
import { DiagnosticsTerminal } from '@/components/intelligence/DiagnosticsTerminal';
import { systemApi } from '@/services/api/system';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useBackendStatus } from '../../hooks/useBackendStatus';

// Сценарії тепер завантажуються через API

const PredictionCard = ({ scenario }: { scenario: Scenario }) => (
  <TacticalCard variant="premium" className="group">
    <div className="flex justify-between items-start mb-4">
      <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.1)]">
        <Brain className="w-5 h-5 text-rose-500" />
      </div>
      <Badge className={cn(
        scenario.impact === 'critical' || scenario.impact === 'high' 
          ? "bg-rose-900/40 text-rose-500 border border-rose-500/30" 
          : "bg-crimson-900/40 text-crimson-500 border border-crimson-500/30"
      )}>
        {scenario.impact === 'critical' || scenario.impact === 'high' ? 'К ИТИЧНО' : 'ПОМІ НО'}
      </Badge>
    </div>
    <h4 className="text-md font-bold text-white mb-2">{scenario.name}</h4>
    <p className="text-xs text-slate-400 line-clamp-2 mb-4">{scenario.description}</p>
    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
        <span>Ймовірність: {scenario.probability}%</span>
        <span>ETA: {scenario.eta}</span>
    </div>
  </TacticalCard>
);

interface Scenario {
  id: string;
  name: string;
  probability: number;
  impact: RiskLevelValue;
  description: string;
  eta: string;
}

export default function PredictiveNexusView() {
    const { isOffline, nodeSource, activeFailover } = useBackendStatus();
    const [isScanning, setIsScanning] = useState(false);
    
    useEffect(() => {
        if (isOffline) {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'PredictiveNexus',
                    message: `АВТОНОМНИЙ_НЕКСУС [${nodeSource}]: Перехід на дзеркальні прогностичні моделі MIRROR_VAULT.`,
                    severity: 'warning',
                    timestamp: new Date().toISOString(),
                    code: 'NEXUS_OFFLINE'
                }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('predator-error', {
                detail: {
                    service: 'PredictiveNexus',
                    message: `НЕКСУС_АКТИВОВАНО [${nodeSource}]: Повний доступ до квантової аналітики NVIDIA. Операційна стабільність 100%.`,
                    severity: 'info',
                    timestamp: new Date().toISOString(),
                    code: 'NEXUS_SUCCESS'
                }
            }));
        }
    }, [isOffline, nodeSource]);

    const { data: stats } = useQuery({
        queryKey: ['system', 'stats'],
        queryFn: systemApi.getStats,
        refetchInterval: 5000
    });

    const { data: diagnostics } = useQuery({
        queryKey: ['system', 'diagnostics'],
        queryFn: systemApi.runDiagnostics,
        refetchInterval: 15000
    });

    const { data: scenarios = [] } = useQuery({
        queryKey: ['system', 'nexus', 'scenarios'],
        queryFn: systemApi.getNexusScenarios,
        refetchInterval: 30000
    });

    const predictions = diagnostics?.results?.predictions || {};

    const startScan = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 2000);
    };

    return (
        <PageTransition>
            <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
                <AdvancedBackground />
                <CyberGrid opacity={0.05} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 h-full w-full flex flex-col p-6"
                >
                    <ViewHeader 
                        title="PREDICTIVE NEXUS v58.2-WRAITH"
                        subtitle="Квантовий Контур Стратегічного Прогнозування (NVIDIA GLM-5.1 Sovereign)"
                        icon={Brain}
                        badges={[
                            { label: `CORE: GLM-5.1`, color: 'danger', icon: <Cpu size={10} /> },
                            { label: `NODE: ${nodeSource}`, color: activeFailover ? 'danger' : 'success', icon: <Activity size={10} /> },
                            { label: stats?.last_sync ? `SYNC: ${formatDistanceToNow(new Date(stats.last_sync), { locale: uk, addSuffix: true })}` : 'СИНХ ОНІЗАЦІЯ...', color: 'primary', icon: <RefreshCw size={10} /> },
                        ]}
                        actions={
                            <Button onClick={startScan} disabled={isScanning} className="bg-rose-600 hover:bg-rose-500 text-slate-950 font-black gap-2 border border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                                <Zap size={16} className={isScanning ? "animate-pulse" : ""} />
                                {isScanning ? "КВАНТУВАННЯ..." : "СИНТЕЗУВАТИ П ЕКОГНІЦІЮ"}
                            </Button>
                        }
                    />

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 overflow-hidden">
                        {/* Ліву колонку: OODA Loop */}
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <div className="bg-black/40 border border-rose-900/30 rounded-xl p-6 backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.02)]">
                                <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Bot size={16} /> ЦИКЛ OODA
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['OBSERVE', 'ORIENT', 'DECIDE', 'ACT'].map((step, idx) => (
                                        <div key={step} className={cn("p-2 rounded border text-center", idx === 0 ? "border-rose-500/30 text-rose-500" : "border-white/10 text-slate-600")}>
                                            <div className="text-[8px] font-black">{step}</div>
                                            <div className="h-1 w-full bg-white/5 mt-1 rounded-full overflow-hidden">
                                                {idx === 0 && <motion.div className="h-full bg-rose-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, repeat: Infinity }} />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex-1">
                                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <TrendingUp size={16} /> П ОГНОЗ  ЕСУ СІВ
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Сховище</span>
                                            <span className="text-xs font-black text-rose-400">{predictions.disk_exhaustion_days || '--'} днів</span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 mb-2 italic">"{predictions.recommendation || 'Аналіз триває...'}"</p>
                                    </div>
                                    <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                                            <ShieldCheck size={14} />
                                            <span className="text-[10px] font-black uppercase">Цілісність</span>
                                        </div>
                                        <p className="text-[9px] text-slate-400">NVIDIA ↔ ZROK Tunnel: <span className={cn(activeFailover ? "text-rose-300" : "text-emerald-300")}>{activeFailover ? 'ACTIVE_FAILOVER' : 'SYNCHRONIZED'}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Центральна колонка: Topology & Dynamics */}
                        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                            <div className="bg-black/60 border border-white/10 rounded-xl backdrop-blur-lg">
                                <ClusterTopology />
                            </div>
                            <div className="bg-black/60 border border-white/10 rounded-xl p-6 backdrop-blur-lg flex-1 overflow-hidden flex flex-col">
                                <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity size={16} /> ДИНАМІКА КЛАСТЕ А (24г)
                                </h3>
                                <div className="flex-1 min-h-0">
                                    <ResourceDynamicsChart />
                                </div>
                            </div>
                        </div>

                        {/* Права колонка: OSINT Scenarios */}
                        <div className="lg:col-span-1 flex flex-col gap-6 overflow-auto">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">СЦЕНА ІЇ OSINT</h3>
                                <Badge variant="outline" className="text-[9px]">TOP PRIORITY</Badge>
                            </div>
                            <div className="space-y-4">
                                {scenarios.map(s => <PredictionCard key={s.id} scenario={s} />)}
                            </div>
                            <Button variant="ghost" className="w-full border border-dashed border-white/10 text-[10px] font-bold py-6">
                                ВСІ СЦЕНА ІЇ (24)
                            </Button>
                        </div>
                    </div>
                    <div className="mt-auto pt-6">
                        <DiagnosticsTerminal />
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
}
