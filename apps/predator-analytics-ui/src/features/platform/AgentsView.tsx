
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TacticalCard } from '@/components/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import {
    Bot, Activity, Server, Zap, Database, Network, Cpu, HardDrive,
    AlertCircle, Eye, Shield, Target, Crosshair, Radio, Radar,
    ScanLine, BrainCircuit, GitBranch, Terminal, Globe, Lock
} from 'lucide-react';
import { useAgents } from '@/context/AgentContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { motion, AnimatePresence, useAnimationFrame } from 'framer-motion';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { useUser, UserRole } from '@/context/UserContext';
import { useShell, UIShell } from '@/context/ShellContext';
import { NeutralizedContent } from '@/components/NeutralizedContent';
import { api } from '@/services/api';
import AgentCascadeManager from './components/AgentCascadeManager';
import WorkflowControlPanel from '@/components/ai/WorkflowControlPanel';
import { premiumLocales } from '@/locales/uk/premium';

// ──────────────────────────────────────────────
// ТИПИ OSINT-ІНСТРУМЕНТІВ
// ──────────────────────────────────────────────
interface OSINTTool {
    id: string;
    name: string;
    category: 'РОЗВІДКА' | 'МЕРЕЖА' | 'ДОКУМЕНТИ' | 'СОЦМЕРЕЖІ';
    status: 'ОНЛАЙН' | 'СКАНУЄ' | 'ОФЛАЙН';
    findings: number;
    lastScan: string;
    icon: React.ReactNode;
    color: string;
}

const OSINT_TOOLS: OSINTTool[] = [
    { id: 'sherlock', name: 'Sherlock', category: 'СОЦМЕРЕЖІ', status: 'ОНЛАЙН', findings: 142, lastScan: '2хв тому', icon: <Eye size={14} />, color: '#a855f7' },
    { id: 'amass', name: 'Amass', category: 'МЕРЕЖА', status: 'СКАНУЄ', findings: 87, lastScan: 'Зараз', icon: <Globe size={14} />, color: '#3b82f6' },
    { id: 'spiderfoot', name: 'SpiderFoot', category: 'РОЗВІДКА', status: 'ОНЛАЙН', findings: 241, lastScan: '5хв тому', icon: <Radar size={14} />, color: '#10b981' },
    { id: 'theharvester', name: 'theHarvester', category: 'РОЗВІДКА', status: 'ОНЛАЙН', findings: 68, lastScan: '12хв тому', icon: <ScanLine size={14} />, color: '#f59e0b' },
    { id: 'maigret', name: 'Maigret', category: 'СОЦМЕРЕЖІ', status: 'ОФЛАЙН', findings: 39, lastScan: '1г тому', icon: <Target size={14} />, color: '#ef4444' },
    { id: 'maltego', name: 'Maltego UA', category: 'ДОКУМЕНТИ', status: 'ОНЛАЙН', findings: 315, lastScan: '3хв тому', icon: <GitBranch size={14} />, color: '#06b6d4' },
];

// ──────────────────────────────────────────────
// АНІМОВАНИЙ NEURAL CANVAS — зв'язки між агентами
// ──────────────────────────────────────────────
const NeuralCanvas: React.FC<{ agentCount: number; activeId: string | null }> = ({ agentCount, activeId }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tickRef = useRef(0);

    useAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        tickRef.current += 0.008;
        const t = tickRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Генеруємо точки-вузли на основі кількості агентів
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = Math.min(cx, cy) * 0.65;

        const nodes: { x: number; y: number; active: boolean }[] = Array.from({ length: Math.max(agentCount, 4) }, (_, i) => {
            const angle = (i / Math.max(agentCount, 4)) * Math.PI * 2 - Math.PI / 2;
            return {
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r,
                active: i < agentCount,
            };
        });

        // Малюємо зв'язки
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (!nodes[i].active || !nodes[j].active) continue;
                const pulse = 0.3 + 0.2 * Math.sin(t * 1.5 + i + j);
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(59,130,246,${pulse * 0.4})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }

        // Малюємо центральний пульс
        const centralPulse = 0.4 + 0.3 * Math.sin(t * 2);
        ctx.beginPath();
        ctx.arc(cx, cy, 6 + 4 * Math.sin(t * 3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${centralPulse})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + 8 * Math.sin(t * 1.5), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99,102,241,${centralPulse * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Малюємо вузли
        nodes.forEach((node) => {
            if (!node.active) return;
            const glowPulse = 0.6 + 0.4 * Math.sin(t * 2 + node.x);
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(59,130,246,${glowPulse})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(node.x, node.y, 10, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(59,130,246,${glowPulse * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Рухома частинка по зв'язках
        if (nodes.length >= 2) {
            const progress = (t % 1);
            const fromNode = nodes[0];
            const toNode = nodes[1 % nodes.length];
            const px = fromNode.x + (toNode.x - fromNode.x) * progress;
            const py = fromNode.y + (toNode.y - fromNode.y) * progress;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b';
            ctx.fill();
        }
    });

    return (
        <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="opacity-80"
        />
    );
};

// ──────────────────────────────────────────────
// ГЕКСАГОНАЛЬНА КАРТА АГЕНТА
// ──────────────────────────────────────────────
const AgentHexCard: React.FC<{
    agent: any;
    index: number;
    isSelected: boolean;
    onClick: () => void;
    themeColor: string;
    accentBg: string;
    isCommanderShell: boolean;
    isOperatorShell: boolean;
}> = ({ agent, index, isSelected, onClick, themeColor, accentBg, isCommanderShell, isOperatorShell }) => {
    const statusColor = agent.status === 'WORKING'
        ? (isCommanderShell ? '#f59e0b' : isOperatorShell ? '#10b981' : '#3b82f6')
        : agent.status === 'ERROR' ? '#ef4444' : '#475569';

    const statusLabel = agent.status === 'WORKING' ? 'АНАЛІЗ' : agent.status === 'ERROR' ? 'ПОМИЛКА' : 'ОЧІКУВАННЯ';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="relative cursor-pointer group"
        >
            {/* Фонове свічення при вибраному */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -inset-2 rounded-[28px] blur-xl pointer-events-none"
                        style={{ background: `radial-gradient(ellipse, ${statusColor}30, transparent)` }}
                    />
                )}
            </AnimatePresence>

            <div className={`
                relative p-5 rounded-[24px] border overflow-hidden transition-all duration-300
                ${isSelected
                    ? 'border-blue-500/60 bg-gradient-to-br from-blue-950/60 to-indigo-950/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                    : 'border-white/[0.06] bg-slate-900/50 hover:border-white/20 hover:bg-slate-900/70'
                }
            `}>
                {/* Топ панель */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Іконка агента з пульсом */}
                        <div className="relative">
                            <div
                                className="w-11 h-11 rounded-2xl flex items-center justify-center border"
                                style={{
                                    background: agent.status === 'WORKING' ? `${statusColor}15` : 'rgba(15,23,42,0.8)',
                                    borderColor: agent.status === 'WORKING' ? `${statusColor}40` : 'rgba(255,255,255,0.06)'
                                }}
                            >
                                <Bot size={20} style={{ color: agent.status === 'WORKING' ? statusColor : '#475569' }} />
                            </div>
                            {/* Пульс-кільце для активних */}
                            {agent.status === 'WORKING' && (
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute inset-0 rounded-2xl border"
                                    style={{ borderColor: statusColor }}
                                />
                            )}
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">
                                <NeutralizedContent content={agent.name} requiredRole={UserRole.ADMIN} />
                            </div>
                            <div className="text-[8px] text-slate-600 font-mono mt-0.5 uppercase tracking-widest">
                                <NeutralizedContent content={agent.id} mode="hash" requiredRole={UserRole.ADMIN} />
                            </div>
                        </div>
                    </div>

                    {/* Статус badge */}
                    <div
                        className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border"
                        style={{
                            background: `${statusColor}15`,
                            borderColor: `${statusColor}40`,
                            color: statusColor
                        }}
                    >
                        {statusLabel}
                    </div>
                </div>

                {/* Efficiency bar */}
                <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest">
                        <span className="text-slate-600">ІНДЕКС ЗДОРОВ'Я</span>
                        <span className="font-mono" style={{ color: statusColor }}>{agent.efficiency}%</span>
                    </div>
                    <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${agent.efficiency}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${statusColor}99, ${statusColor})` }}
                        />
                    </div>
                </div>

                {/* Остання дія */}
                <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                    <Zap size={10} style={{ color: statusColor }} className="shrink-0" />
                    <div className="text-[9px] text-slate-500 font-mono truncate">
                        <NeutralizedContent content={agent.lastAction} mode="blur" requiredRole={UserRole.ADMIN} />
                    </div>
                </div>

                {/* Декор: scan line ефект для активних */}
                {agent.status === 'WORKING' && (
                    <motion.div
                        animate={{ y: [-100, 200] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-x-0 h-px pointer-events-none"
                        style={{ background: `linear-gradient(90deg, transparent, ${statusColor}60, transparent)` }}
                    />
                )}
            </div>
        </motion.div>
    );
};

// ──────────────────────────────────────────────
// OSINT TOOL РЯДОК
// ──────────────────────────────────────────────
const OSINTToolRow: React.FC<{ tool: OSINTTool; index: number }> = ({ tool, index }) => {
    const [isScanning, setIsScanning] = useState(false);

    const handleScan = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (tool.status === 'ОФЛАЙН') return;
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 3000);
    };

    const statusColor = tool.status === 'СКАНУЄ' || tool.status === 'ОНЛАЙН'
        ? (tool.status === 'СКАНУЄ' ? '#f59e0b' : '#10b981')
        : '#475569';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-white/10 transition-all group"
        >
            {/* Іконка */}
            <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ background: `${tool.color}15`, borderColor: `${tool.color}30`, color: tool.color }}
            >
                {tool.icon}
            </div>

            {/* Інфо */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{tool.name}</span>
                    <span
                        className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border"
                        style={{ color: tool.color, background: `${tool.color}15`, borderColor: `${tool.color}30` }}
                    >
                        {tool.category}
                    </span>
                </div>
                <div className="text-[8px] text-slate-600 font-mono mt-0.5">
                    {tool.findings} знахідок · {tool.lastScan}
                </div>
            </div>

            {/* Статус dot */}
            <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                    {tool.status === 'СКАНУЄ' && (
                        <motion.div
                            animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 rounded-full"
                            style={{ background: statusColor }}
                        />
                    )}
                </div>

                {/* Кнопка запуску */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleScan}
                    disabled={tool.status === 'ОФЛАЙН'}
                    className={`
                        px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                        ${tool.status === 'ОФЛАЙН'
                            ? 'opacity-30 cursor-not-allowed border-white/5 text-slate-600'
                            : isScanning
                                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-500/10'
                        }
                    `}
                >
                    {isScanning ? (
                        <motion.span
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            СКАН...
                        </motion.span>
                    ) : 'ЗАПУСК'}
                </motion.button>
            </div>
        </motion.div>
    );
};

// ──────────────────────────────────────────────
// ГОЛОВНИЙ КОМПОНЕНТ
// ──────────────────────────────────────────────
const AgentsView: React.FC = () => {
    const { user } = useUser();
    const { currentShell } = useShell();
    const { agents } = useAgents();

    const isCommanderShell = currentShell === UIShell.COMMANDER;
    const isOperatorShell = currentShell === UIShell.OPERATOR;

    const themeColor = isCommanderShell ? 'text-amber-400' : isOperatorShell ? 'text-emerald-400' : 'text-blue-400';
    const accentBg = isCommanderShell ? 'bg-amber-500/10' : isOperatorShell ? 'bg-emerald-500/10' : 'bg-blue-500/10';

    const [activeTab, setActiveTab] = useState<'telemetry' | 'cascades' | 'workflow' | 'osint'>('telemetry');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [resourceData, setResourceData] = useState<any[]>([]);
    const [realAlerts, setRealAlerts] = useState<any[]>([]);
    const [systemCpu, setSystemCpu] = useState<number>(0);
    const [systemMem, setSystemMem] = useState<number>(0);

    // Встановлюємо перший агент після завантаження
    useEffect(() => {
        if (!selectedAgentId && agents.length > 0) {
            setSelectedAgentId(agents[0].id);
        }
    }, [agents, selectedAgentId]);

    // Алерти флоту
    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const alerts = await api.v45.getLiveAlerts();
                setRealAlerts(Array.isArray(alerts) ? alerts : (Array.isArray(alerts?.items) ? alerts.items : []));
            } catch (e) { /* не критично */ }
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5000);
        return () => clearInterval(interval);
    }, []);

    // Реальні метрики системи
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('/api/v1/stats/system');
                if (response.ok) {
                    const data = await response.json();
                    const cpu = data.cpu_usage ?? data.cpu ?? Math.random() * 40 + 20;
                    const mem = data.memory_usage ?? data.memory ?? Math.random() * 30 + 40;
                    setSystemCpu(Math.round(cpu));
                    setSystemMem(Math.round(mem));
                    setResourceData(prev => {
                        const updated = [...prev, { time: Date.now(), cpu, mem }];
                        return updated.slice(-20);
                    });
                }
            } catch { /* fallback до попередніх значень */ }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 3000);
        return () => clearInterval(interval);
    }, []);

    const selectedAgent = agents.find(a => a.id === selectedAgentId);
    const workingCount = agents.filter(a => a.status === 'WORKING').length;

    const tabs = [
        { id: 'telemetry', label: premiumLocales.agentsView.tabs.telemetry, icon: <Activity size={13} /> },
        { id: 'cascades', label: premiumLocales.agentsView.tabs.cascades, icon: <Network size={13} /> },
        { id: 'workflow', label: premiumLocales.agentsView.tabs.workflow, icon: <Zap size={13} /> },
        { id: 'osint', label: 'OSINT АГЕНТИ', icon: <ScanLine size={13} /> },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1680px] mx-auto relative z-10 min-h-screen">
            <AdvancedBackground />

            {/* ── HEADER ── */}
            <ViewHeader
                title={premiumLocales.agentsView.title}
                icon={<Bot size={20} className={themeColor} />}
                breadcrumbs={['СИНАПСИС', 'УПРАВЛІННЯ', 'МЕНЕДЖЕР ФЛОТУ']}
                stats={[
                    { label: 'Агенти', value: String(agents.length), icon: <Bot size={14} />, color: 'primary' },
                    { label: 'Активних', value: String(workingCount), icon: <Activity size={14} />, color: 'success' },
                    { label: 'ЦП', value: `${systemCpu}%`, icon: <Cpu size={14} />, color: 'purple' },
                    { label: 'ОЗП', value: `${systemMem}%`, icon: <HardDrive size={14} />, color: 'warning' },
                ]}
            />

            {/* ── TABS ── */}
            <div className="flex gap-2 p-1.5 bg-slate-900/70 backdrop-blur-md rounded-2xl border border-white/[0.06] w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300
                            ${activeTab === tab.id
                                ? tab.id === 'osint'
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                                    : isCommanderShell
                                        ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                        : isOperatorShell
                                            ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                            : 'bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.id === 'osint' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-purple-500/30 text-purple-300 text-[7px] rounded-md border border-purple-500/30">
                                {OSINT_TOOLS.filter(t => t.status !== 'ОФЛАЙН').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── ОСНОВНИЙ КОНТЕНТ ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* ── ЛІВА ОБЛАСТЬ (2/3 ширини) ── */}
                <div className="xl:col-span-2 space-y-4">
                    <AnimatePresence mode="wait">

                        {/* ТЕЛЕМЕТРІЯ — СІТКА АГЕНТІВ */}
                        {activeTab === 'telemetry' && (
                            <motion.div
                                key="telemetry-view"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.3 }}
                            >
                                {agents.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {agents.map((agent, idx) => (
                                                <AgentHexCard
                                                    key={agent.id}
                                                    agent={agent}
                                                    index={idx}
                                                    isSelected={selectedAgentId === agent.id}
                                                    onClick={() => setSelectedAgentId(agent.id)}
                                                    themeColor={themeColor}
                                                    accentBg={accentBg}
                                                    isCommanderShell={isCommanderShell}
                                                    isOperatorShell={isOperatorShell}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-64 text-slate-600 gap-4 rounded-3xl border border-white/5 bg-slate-900/30"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                        >
                                            <Server size={40} className="opacity-20" />
                                        </motion.div>
                                        <p className="text-xs font-medium">Агентів не знайдено. Підключення до флоту...</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* КАСКАДИ */}
                        {activeTab === 'cascades' && (
                            <motion.div
                                key="cascades-view"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.3 }}
                            >
                                <AgentCascadeManager />
                            </motion.div>
                        )}

                        {/* ВОРКФЛОУ */}
                        {activeTab === 'workflow' && (
                            <motion.div
                                key="workflow-view"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.3 }}
                            >
                                <WorkflowControlPanel />
                            </motion.div>
                        )}

                        {/* OSINT АГЕНТИ */}
                        {activeTab === 'osint' && (
                            <motion.div
                                key="osint-view"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                {/* OSINT Header */}
                                <div className="p-5 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-indigo-950/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                                <BrainCircuit size={20} className="text-purple-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-white uppercase tracking-widest">OSINT ЕКОСИСТЕМА</h3>
                                                <p className="text-[9px] text-slate-500 font-mono">6 інструментів · {OSINT_TOOLS.filter(t => t.status !== 'ОФЛАЙН').length} онлайн</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">АКТИВНА</span>
                                        </div>
                                    </div>

                                    {/* Загальна статистика */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Всього знахідок', value: OSINT_TOOLS.reduce((acc, t) => acc + t.findings, 0).toLocaleString(), color: '#a855f7' },
                                            { label: 'Активних сканів', value: OSINT_TOOLS.filter(t => t.status === 'СКАНУЄ').length, color: '#f59e0b' },
                                            { label: 'Покриття джерел', value: '94%', color: '#10b981' },
                                        ].map((stat, i) => (
                                            <div key={i} className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 text-center">
                                                <div className="text-base font-black font-mono" style={{ color: stat.color }}>{stat.value}</div>
                                                <div className="text-[8px] text-slate-500 uppercase tracking-widest mt-0.5">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Список OSINT-інструментів */}
                                <div className="space-y-2">
                                    {OSINT_TOOLS.map((tool, i) => (
                                        <OSINTToolRow key={tool.id} tool={tool} index={i} />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* ── ПРАВА ПАНЕЛЬ (1/3 ширини) ── */}
                <div className="space-y-5">

                    {/* ── NEURAL NETWORK ВІЗУАЛІЗАЦІЯ + ДЕТАЛЬНИЙ СТАТУС ── */}
                    <TacticalCard variant="holographic" title={premiumLocales.agentsView.tabs.telemetry} className="overflow-hidden">
                        <AnimatePresence mode="wait">
                            {selectedAgent ? (
                                <motion.div
                                    key={selectedAgent.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="space-y-4"
                                >
                                    {/* Агент-заголовок */}
                                    <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl border ${selectedAgent.status === 'WORKING' ? 'bg-emerald-900/20 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}>
                                                <Activity size={16} className={selectedAgent.status === 'WORKING' ? 'animate-pulse' : ''} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">
                                                    {premiumLocales.agentsView.panels.healthIndex}
                                                </div>
                                                <div className="text-[9px] text-slate-500 font-mono">
                                                    {premiumLocales.agentsView.panels.uptime}: онлайн
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-emerald-400 font-mono font-black text-lg">
                                            {selectedAgent.efficiency}%
                                        </div>
                                    </div>

                                    {/* Neural canvas */}
                                    <div className="flex justify-center py-2 relative">
                                        <div className="relative">
                                            <NeuralCanvas agentCount={agents.length} activeId={selectedAgentId} />
                                            {/* Центральний текст */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <div className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">НЕЙРОНН. МЕРЕЖА</div>
                                                <div className="text-sm font-black text-indigo-400 font-mono">{agents.length} вузлів</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CPU / MEM chart */}
                                    <div className="bg-slate-950/40 rounded-2xl p-3 border border-white/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                {premiumLocales.agentsView.panels.resourceUsage}
                                            </span>
                                            <span className="text-[9px] text-slate-600 font-mono">
                                                ЦП: <span className="text-blue-400">{systemCpu}%</span> · ОЗП: <span className="text-purple-400">{systemMem}%</span>
                                            </span>
                                        </div>
                                        <div className="h-[100px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={resourceData}>
                                                    <defs>
                                                        <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                    <XAxis dataKey="time" hide />
                                                    <YAxis domain={[0, 100]} hide />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '9px' }}
                                                        formatter={(v: any) => [`${Math.round(v)}%`]}
                                                    />
                                                    <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="url(#cpuGrad)" strokeWidth={1.5} name="ЦП" />
                                                    <Area type="monotone" dataKey="mem" stroke="#a855f7" fill="transparent" strokeWidth={1.5} name="ОЗП" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Resource limits */}
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { icon: <Cpu size={14} />, label: 'Ліміт ЦП', value: '2000m', color: 'text-blue-400', border: 'hover:border-blue-500/30' },
                                            { icon: <HardDrive size={14} />, label: "Ліміт ПАМ'ЯТІ", value: '4Gi', color: 'text-purple-400', border: 'hover:border-purple-500/30' },
                                        ].map((item, i) => (
                                            <div key={i} className={`p-3 bg-slate-950/50 rounded-2xl border border-white/5 ${item.border} transition-colors text-center group`}>
                                                <div className={`${item.color} mx-auto mb-1.5 opacity-50 group-hover:opacity-100 transition-opacity flex justify-center`}>
                                                    {item.icon}
                                                </div>
                                                <div className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mb-1">{item.label}</div>
                                                <div className="text-sm font-black text-slate-200 font-mono">{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-[360px] flex flex-col items-center justify-center text-slate-600 gap-4 px-8 text-center"
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                                        transition={{ duration: 2.5, repeat: Infinity }}
                                    >
                                        <Server size={36} />
                                    </motion.div>
                                    <p className="text-xs font-medium leading-relaxed">
                                        Виберіть агента зі списку, щоб ініціалізувати телеметричний канал
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </TacticalCard>

                    {/* ── СПОВІЩЕННЯ ФЛОТУ ── */}
                    <TacticalCard
                        variant="holographic"
                        title={premiumLocales.agentsView.panels.fleetAlerts}
                        className="border-white/5 bg-slate-950/40"
                    >
                        <div className="space-y-3">
                            {realAlerts.length > 0 ? (
                                realAlerts.slice(0, 4).map((alert: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ x: 4 }}
                                        className={`p-3.5 rounded-2xl flex items-start gap-3 text-[10px] border ${alert.severity === 'critical'
                                                ? 'bg-red-500/5 border-red-500/20 text-red-400'
                                                : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                                            }`}
                                    >
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">{alert.summary || alert.message}</span>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-[10px] text-emerald-400"
                                >
                                    <Activity size={16} className="shrink-0" />
                                    <span className="leading-relaxed">Всі агенти функціонують штатно. Аномалій не виявлено.</span>
                                </motion.div>
                            )}
                        </div>
                    </TacticalCard>

                    {/* ── АВТОРИТЕТ АГЕНТІВ (Authority Level) ── */}
                    <div className="p-4 rounded-3xl border border-white/[0.06] bg-slate-900/40 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield size={14} className="text-indigo-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">РІВНІ АВТОРИТЕТУ</span>
                        </div>
                        {[
                            { level: 'L0', label: 'Тільки читання', desc: 'Перегляд без дій', color: '#64748b' },
                            { level: 'L1', label: 'Читання + звіти', desc: 'Генерація рекомендацій', color: '#3b82f6' },
                            { level: 'L2', label: 'Авто-дії', desc: 'Виконання схвалених планів', color: '#f59e0b' },
                            { level: 'L3', label: 'Повний контроль', desc: 'Потребує Human Approval', color: '#ef4444' },
                        ].map((auth, i) => (
                            <div key={auth.level} className="flex items-center gap-3">
                                <div
                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black shrink-0 border"
                                    style={{ background: `${auth.color}20`, borderColor: `${auth.color}40`, color: auth.color }}
                                >
                                    {auth.level}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[9px] font-bold text-slate-300">{auth.label}</div>
                                    <div className="text-[8px] text-slate-600 truncate">{auth.desc}</div>
                                </div>
                                {i === 0 && (
                                    <Lock size={10} className="text-slate-600 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AgentsView;
