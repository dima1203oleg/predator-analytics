
import React, { useState, useEffect } from 'react';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { Bot, Activity, Server, Zap, Database, Network, Cpu, HardDrive, AlertCircle, Search, Filter } from 'lucide-react';
import { useAgents } from '@/context/AgentContext';
import { StatusIndicator } from '@/components/StatusIndicator';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useUser, UserRole } from '@/context/UserContext';
import { useShell, UIShell } from '@/context/ShellContext';
import { NeutralizedContent } from '@/components/NeutralizedContent';
import { api } from '@/services/api';
import AgentCascadeManager from './components/AgentCascadeManager';
import WorkflowControlPanel from '@/components/ai/WorkflowControlPanel';
import { premiumLocales } from '@/locales/uk/premium';

const AgentsView: React.FC = () => {
    const { user } = useUser();
    const { currentShell } = useShell();
    const { agents } = useAgents();

    const isCommanderShell = currentShell === UIShell.COMMANDER;
    const isOperatorShell = currentShell === UIShell.OPERATOR;
    const isExplorerShell = currentShell === UIShell.EXPLORER;

    const themeColor = isCommanderShell ? 'text-amber-400' : isOperatorShell ? 'text-emerald-400' : 'text-blue-400';
    const accentBg = isCommanderShell ? 'bg-amber-500/10' : isOperatorShell ? 'bg-emerald-500/10' : 'bg-blue-500/10';
    
    const [activeTab, setActiveTab] = useState<'telemetry' | 'cascades' | 'workflow'>('telemetry');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agents[0]?.id || null);
    const [resourceData, setResourceData] = useState<any[]>([]);
    const [realAlerts, setRealAlerts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const alerts = await api.v45.getLiveAlerts();
                setRealAlerts(Array.isArray(alerts) ? alerts : (Array.isArray(alerts?.items) ? alerts.items : []));
            } catch (e) {
                console.warn("Failed to fetch fleet alerts");
            }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, []);

    // REAL DATA: Fetch actual resource metrics from backend
    useEffect(() => {
        if (!selectedAgentId) return;

        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/v1/stats/system');
                if (response.ok) {
                    const data = await response.json();
                    const newPoint = {
                        time: Date.now(),
                        cpu: data.cpu_usage || data.cpu || 0,
                        mem: data.memory_usage || data.memory || 0
                    };

                    setResourceData(prev => {
                        const updated = [...prev, newPoint];
                        // Keep last 20 data points
                        return updated.slice(-20);
                    });
                }
            } catch (err) {
                console.warn('Failed to fetch system metrics:', err);
            }
        };

        // Initial fetch
        fetchMetrics();

        // Poll every 3 seconds for smooth chart updates
        const interval = setInterval(fetchMetrics, 3000);

        return () => clearInterval(interval);
    }, [selectedAgentId]);

    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1600px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground />
            <ViewHeader
                title={premiumLocales.agentsView.title}
                icon={<Bot size={20} className={isCommanderShell ? 'text-amber-400' : isOperatorShell ? 'text-emerald-400' : 'text-blue-400'} />}
                breadcrumbs={['СИНАПСИС', 'УПРАВЛІННЯ', 'МЕНЕДЖЕР ФЛОТУ']}
                stats={[
                    { label: 'Агенти', value: String(agents.length), icon: <Bot size={14} />, color: 'primary' },
                    { label: 'Навантаження', value: '34%', icon: <Cpu size={14} />, color: 'success' },
                    { label: 'Шина Даних', value: 'СТАБІЛЬНО', icon: <Network size={14} />, color: 'success' },
                ]}
            />

            {/* Sub-navigation Tabs */}
            <div className="flex gap-4 p-1 bg-slate-900/60 rounded-2xl border border-white/5 w-fit">
                {[
                    { id: 'telemetry', label: premiumLocales.agentsView.tabs.telemetry, icon: <Activity size={14} /> },
                    { id: 'cascades', label: premiumLocales.agentsView.tabs.cascades, icon: <Network size={14} /> },
                    { id: 'workflow', label: premiumLocales.agentsView.tabs.workflow, icon: <Zap size={14} /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${activeTab === tab.id 
                                ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Content Area (Changes based on activeTab) */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'telemetry' && (
                            <motion.div
                                key="telemetry-view"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {agents.map((agent, idx) => (
                                        <motion.div
                                            key={agent.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ y: -4 }}
                                            onClick={() => setSelectedAgentId(agent.id)}
                                            className={`
                                            p-6 rounded-[32px] border cursor-pointer transition-all relative overflow-hidden glass-morphism panel-3d
                                            ${selectedAgentId === agent.id
                                                    ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
                                                    : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                                                }
                                        `}
                                        >
                                            <div className="flex justify-between items-start mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3.5 rounded-2xl transition-all duration-500 ${agent.status === 'WORKING' ? (isCommanderShell ? 'bg-amber-500/10 text-amber-500' : isOperatorShell ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500') :
                                                            'bg-slate-950 text-slate-700'
                                                        }`}>
                                                        <Bot size={24} className={agent.status === 'WORKING' ? 'animate-pulse' : ''} />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-[11px] text-white uppercase tracking-widest">
                                                            <NeutralizedContent content={agent.name} requiredRole={UserRole.ADMIN} />
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-widest">
                                                            <NeutralizedContent content={agent.id} mode="hash" requiredRole={UserRole.ADMIN} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${agent.status === 'WORKING' ? 'bg-amber-500/10 text-amber-400' :
                                                        agent.status === 'IDLE' ? 'bg-slate-800 text-slate-500' : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                    {agent.status === 'WORKING' ? 'АНАЛІЗ' : (agent.status === 'IDLE' ? 'ОЧІКУВАННЯ' : 'ПОМИЛКА')}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                                    <span className="text-slate-500">{premiumLocales.agentsView.panels.healthIndex}</span>
                                                    <span className="text-blue-400 font-mono">{agent.efficiency}%</span>
                                                </div>
                                                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${agent.efficiency}%` }}
                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                    />
                                                </div>
                                                <div className="text-[10px] text-slate-400 truncate font-mono border-t border-white/5 pt-4 mt-2 flex items-center gap-3">
                                                    <Zap size={12} className={isCommanderShell ? 'text-amber-500' : isOperatorShell ? 'text-emerald-500' : 'text-blue-500'} />
                                                    <NeutralizedContent content={agent.lastAction} mode="blur" requiredRole={UserRole.ADMIN} />
                                                </div>
                                            </div>

                                            {selectedAgentId === agent.id && (
                                                <motion.div
                                                    layoutId="agentSelectionGlow"
                                                    className="absolute -inset-1 bg-blue-500/5 blur-2xl pointer-events-none"
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {activeTab === 'cascades' && (
                            <motion.div
                                key="cascades-view"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <AgentCascadeManager />
                            </motion.div>
                        )}

                        {activeTab === 'workflow' && (
                            <motion.div
                                key="workflow-view"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <WorkflowControlPanel />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Details & Metrics */}
                <div className="space-y-6">
                    <TacticalCard variant="holographic" title={premiumLocales.agentsView.tabs.telemetry} className="panel-3d glass-morphism">
                        <AnimatePresence mode="wait">
                            {selectedAgent ? (
                                <motion.div
                                    key={selectedAgent.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-emerald-900/20 text-emerald-500 rounded-xl border border-emerald-500/20">
                                                <Activity size={20} className="animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-200 uppercase tracking-widest">{premiumLocales.agentsView.panels.healthIndex}</div>
                                                <div className="text-[10px] text-slate-500 font-mono">{premiumLocales.agentsView.panels.uptime}: 14д 02г 45хв</div>
                                            </div>
                                        </div>
                                        <div className="text-emerald-500 font-mono font-bold text-lg">100%</div>
                                    </div>

                                    <div className="h-[220px] w-full bg-slate-950/30 rounded-2xl p-4 border border-white/5">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex justify-between">
                                            {premiumLocales.agentsView.panels.resourceUsage} <span>ЦП & ПАМ'ЯТЬ</span>
                                        </h4>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={resourceData}>
                                                <defs>
                                                    <linearGradient id="colorCpuAgent" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.5} />
                                                <XAxis dataKey="time" hide />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '10px' }}
                                                />
                                                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#colorCpuAgent)" strokeWidth={2} name="CPU %" />
                                                <Area type="monotone" dataKey="mem" stroke="#a855f7" fill="transparent" strokeWidth={2} name="MEM %" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center group hover:border-blue-500/30 transition-colors">
                                            <Cpu size={18} className="text-blue-500 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Ліміт ЦП</div>
                                            <div className="text-sm font-bold text-slate-200 font-mono">2000m</div>
                                        </div>
                                        <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 text-center group hover:border-purple-500/30 transition-colors">
                                            <HardDrive size={18} className="text-purple-500 mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Ліміт ПАМ'ЯТІ</div>
                                            <div className="text-sm font-bold text-slate-200 font-mono">4Gi</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[350px] flex flex-col items-center justify-center text-slate-600 text-xs gap-4 text-center px-8"
                                >
                                    <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center border border-white/5 relative">
                                        <Server size={32} className="opacity-20" />
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 rounded-3xl bg-blue-500/10"
                                        />
                                    </div>
                                    <p className="font-medium leading-relaxed">Виберіть активного агента зі списку флоту, щоб ініціалізувати низхідний канал телеметрії.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </TacticalCard>

                    <TacticalCard variant="holographic" title={premiumLocales.agentsView.panels.fleetAlerts} className="border-white/5 bg-slate-950/40">
                        <div className="space-y-4">
                            {realAlerts.length > 0 ? (
                                realAlerts.map((alert: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ x: 4 }}
                                        className={`p-4 rounded-2xl flex items-start gap-4 text-[11px] border ${alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20 text-red-500' :
                                                'bg-amber-500/5 border-amber-500/20 text-amber-500'
                                            }`}
                                    >
                                        <AlertCircle size={18} className="shrink-0" />
                                        <span className="leading-relaxed">{alert.summary || alert.message}</span>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-4 text-[11px] text-emerald-400"
                                >
                                    <Activity size={18} className="shrink-0" />
                                    <span className="leading-relaxed">Всі агенти та вузли функціонують в штатному режимі. Аномалій не виявлено.</span>
                                </motion.div>
                            )}
                        </div>
                    </TacticalCard>
                </div>

            </div>
        </div>
    );
};

export default AgentsView;
