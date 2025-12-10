
import React, { useState, useEffect, useRef } from 'react';
import { ViewHeader } from '../components/ViewHeader';
import Modal from '../components/Modal';
import {
    BarChart2, Search, Bell, Activity, ShieldCheck,
    Bot, Settings, Eye, EyeOff, Globe, ArrowUpRight, Mic,
    RefreshCw, Sliders, ChevronDown, Maximize2, MoreHorizontal, Newspaper,
    Server, CheckCircle2, AlertTriangle, Clock, Calendar, Zap, Wifi,
    Cloud, Coffee
} from 'lucide-react';
import { TacticalCard } from '../components/TacticalCard';
import {
    BarChart, Bar, Cell, PieChart, Pie, Tooltip, Legend, ResponsiveContainer, CartesianGrid, XAxis, YAxis, AreaChart, Area
} from 'recharts';

import { UserDashboard } from '../components/user/UserDashboard';
import { DailyGazette } from '../components/user/DailyGazette';
import { api } from '../services/api';

const SYSTEM_INCIDENTS = [
    { id: 1, date: 'Сьогодні, 10:45', status: 'RESOLVED', title: 'Затримка синхронізації митниці', desc: 'Спостерігалась затримка отримання даних від ДМСУ через навантаження на шлюз. Дані актуалізовано.' },
    { id: 2, date: '27.10.2023', status: 'RESOLVED', title: 'Планове оновлення AI Моделі', desc: 'Успішно оновлено модель ризиків до версії v4.2. Можливі короткочасні зміни у скорингу.' },
];

const UserView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'GAZETTE' | 'EXPLORER' | 'ASSISTANT' | 'SYSTEM'>('DASHBOARD');
    const [privacyMode, setPrivacyMode] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Data State (Truth-Only)
    const [systemLogs, setSystemLogs] = useState<any[]>([]);
    const [logHistogram, setLogHistogram] = useState<any[]>([]);

    // Assistant State
    const [isThinking, setIsThinking] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: 'Вітаю, Дмитро! Я ваш персональний аналітик Predator. За останні 24 години я проаналізував 12 400 нових записів. Ризики стабільні. Чим можу допомогти?' }
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Entity Modal State
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;

        const fetchData = async () => {
            if (activeTab === 'EXPLORER') {
                try {
                    // Fetch real logs instead of mocks
                    const logs = await api.getSecurityLogs(); // Using security logs as proxy for system logs for now
                    if (isMounted.current) {
                        setSystemLogs(logs.map(l => ({
                            id: l.id,
                            time: l.timestamp.split(' ')[1],
                            level: l.status === 'FAILURE' ? 'ERROR' : 'INFO',
                            source: 'predator-core',
                            message: `${l.action} by ${l.user}`
                        })));

                        // Generate histogram from real data length (simulated distribution for viz)
                        setLogHistogram([
                            { time: '14:00', count: logs.length * 2 },
                            { time: '14:05', count: logs.length * 5 },
                            { time: '14:10', count: logs.length * 3 }
                        ]);
                    }
                } catch (e) {
                    console.error("Failed to fetch logs", e);
                }
            }
        };

        fetchData();
        return () => { isMounted.current = false; };
    }, [activeTab]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, activeTab]);

    const handleSendMessage = (text?: string) => {
        const msg = text || chatInput;
        if (!msg.trim()) return;

        if (activeTab !== 'ASSISTANT') setActiveTab('ASSISTANT');

        setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
        setChatInput('');
        setIsThinking(true);

        // In a real scenario, this would call api.askOpponent or similar
        setTimeout(() => {
            setIsThinking(false);
            setChatHistory(prev => [...prev, { role: 'ai', text: `Я просканував ваші запити. Знайдено кореляцію між контрагентом 'ТОВ БудМаш' та новим судовим рішенням (№771/22). Рекомендую призупинити платежі до з'ясування обставин.` }]);
        }, 2000);
    };

    const getBgGradient = () => {
        switch (activeTab) {
            case 'GAZETTE': return 'from-amber-900/20 via-slate-950 to-slate-950';
            case 'ASSISTANT': return 'from-purple-900/20 via-slate-950 to-slate-950';
            case 'SYSTEM': return 'from-green-900/20 via-slate-950 to-slate-950';
            default: return 'from-blue-900/20 via-slate-950 to-slate-950';
        }
    }

    const renderAssistant = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[750px] animate-in fade-in duration-300">
            <TacticalCard className="lg:col-span-3 flex flex-col relative bg-slate-900/80 panel-3d" title="Інтелектуальний Діалог">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/30 rounded-md border border-slate-800/50 mb-4 backdrop-blur-sm">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                            <div className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-br-none border border-blue-500/30'
                                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'
                                }`}>
                                {msg.role === 'ai' && <div className="flex items-center gap-2 text-[10px] font-bold text-purple-500 mb-2 font-display tracking-wider"><Bot size={12} /> KUBERFACE</div>}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-slate-800 p-3 rounded-xl rounded-bl-none border border-slate-700 flex items-center gap-2 text-xs text-slate-400">
                                <RefreshCw size={12} className="animate-spin text-purple-500" /> Генерація відповіді...
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner">
                    <button className="p-3 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors btn-3d">
                        <Mic size={20} />
                    </button>
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Запитайте про ризики, графіки, події або контрагентів..."
                        className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 placeholder-slate-600"
                    />
                    <button onClick={() => handleSendMessage()} disabled={!chatInput.trim()} className="p-3 rounded-lg text-white transition-all shadow-lg btn-3d btn-3d-purple disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowUpRight size={20} />
                    </button>
                </div>
            </TacticalCard>
        </div>
    );

    const renderSimulatedKibana = () => (
        <div className="h-[800px] bg-[#141b2d] border border-slate-800 rounded-lg flex flex-col overflow-hidden animate-in fade-in duration-300 relative group shadow-2xl panel-3d">
            <div className="bg-[#1d2639] border-b border-slate-700 p-2 flex items-center justify-between text-slate-300 text-xs">
                <div className="flex items-center gap-4">
                    <div className="font-bold text-lg text-pink-500 flex items-center gap-2 px-2">
                        <span className="bg-pink-500 text-[#1d2639] p-0.5 rounded text-[10px]">OS</span> OpenSearch
                    </div>
                    <div className="h-6 w-[1px] bg-slate-600"></div>
                    <div className="flex items-center gap-2 bg-[#141b2d] px-3 py-1.5 rounded border border-slate-600 cursor-pointer hover:border-blue-400 w-96">
                        <Search size={12} className="text-slate-500" />
                        <span className="text-slate-400 font-mono">kubernetes.labels.app: "ua-sources" AND level: "ERROR"</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-[#141b2d]">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 bg-[#1d2639] border border-slate-700 rounded p-4 flex justify-between items-center panel-3d">
                        <h2 className="text-xl font-bold text-white">Журнал Продакшн Середовища (Predator)</h2>
                        <div className="flex gap-2">
                            <button className="text-slate-400 hover:text-white"><Maximize2 size={16} /></button>
                            <button className="text-slate-400 hover:text-white"><MoreHorizontal size={16} /></button>
                        </div>
                    </div>
                    <div className="col-span-8 bg-[#1d2639] border border-slate-700 rounded p-4 panel-3d">
                        <div className="flex justify-between mb-2">
                            <h3 className="font-bold text-slate-300 text-xs">Обсяг Логів (Кількість)</h3>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={logHistogram}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1d2639', borderColor: '#475569', fontSize: '12px' }} itemStyle={{ color: '#60a5fa' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="col-span-4 bg-[#1d2639] border border-slate-700 rounded p-4 panel-3d">
                        <div className="flex justify-between mb-2">
                            <h3 className="font-bold text-slate-300 text-xs">HTTP Статус-коди</h3>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: '200 OK', value: 850 },
                                            { name: '404 Not Found', value: 40 },
                                            { name: '500 Error', value: 15 },
                                            { name: '429 Rate Limit', value: 95 },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#eab308" />
                                        <Cell fill="#ef4444" />
                                        <Cell fill="#a855f7" />
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1d2639', borderColor: '#475569', fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="col-span-12 bg-[#1d2639] border border-slate-700 rounded flex flex-col panel-3d">
                        <div className="p-3 border-b border-slate-700 font-bold text-xs text-slate-300">
                            Дослідження (Discover)
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] font-mono text-slate-400">
                                <thead className="bg-[#263147] text-slate-300">
                                    <tr>
                                        <th className="p-2 w-8"></th>
                                        <th className="p-2">Час</th>
                                        <th className="p-2">Рівень</th>
                                        <th className="p-2">Джерело</th>
                                        <th className="p-2">Повідомлення</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {systemLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-[#263147] transition-colors cursor-pointer">
                                            <td className="p-2 text-center text-blue-400"><ChevronDown size={12} /></td>
                                            <td className="p-2 whitespace-nowrap">{log.time}</td>
                                            <td className="p-2"><span className={`px-1.5 py-0.5 rounded font-bold ${log.level === 'ERROR' ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'}`}>{log.level}</span></td>
                                            <td className="p-2 text-blue-300">{log.source}</td>
                                            <td className="p-2 text-slate-300">{log.message}</td>
                                        </tr>
                                    ))}
                                    {systemLogs.length === 0 && (
                                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">Завантаження логів з API...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSystemStatus = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-6">
                {/* Cluster Health Cards */}
                <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between group hover:border-green-500/30 transition-colors panel-3d">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-900/20 rounded-full border border-green-500/30 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                <Server size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-200">Основний Сервер (NVIDIA)</h3>
                                <p className="text-xs text-slate-500">Production Environment</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end text-success-500 font-bold text-sm mb-1">
                                <CheckCircle2 size={16} /> OPERATIONAL
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">Uptime: 99.99%</div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between group hover:border-blue-500/30 transition-colors panel-3d">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-900/20 rounded-full border border-blue-500/30 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                <Cloud size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-200">Хмарний Кластер (Oracle)</h3>
                                <p className="text-xs text-slate-500">Backup & Canary</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 justify-end text-blue-400 font-bold text-sm mb-1">
                                <RefreshCw size={16} className="animate-spin" /> SYNCING
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">Latency: 45ms</div>
                        </div>
                    </div>
                </div>

                <TacticalCard title="Доступність Сервісів (SLA)" className="panel-3d">
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={Array.from({ length: 30 }, (_, i) => ({ day: i, uptime: 99 + Math.random() }))}>
                                <defs>
                                    <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis hide />
                                <YAxis domain={[98, 100]} hide />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                                <Area type="step" dataKey="uptime" stroke="#22c55e" fill="url(#uptimeGrad)" strokeWidth={2} name="Uptime %" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </TacticalCard>
            </div>

            <div className="space-y-6">
                <TacticalCard title="Журнал Інцидентів" className="panel-3d">
                    <div className="space-y-4">
                        {SYSTEM_INCIDENTS.map(inc => (
                            <div key={inc.id} className="p-4 bg-slate-950 border border-slate-800 rounded relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${inc.status === 'RESOLVED' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                <div className="flex justify-between items-start mb-2 pl-2">
                                    <span className="text-xs font-bold text-slate-200">{inc.title}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{inc.date}</span>
                                </div>
                                <p className="text-xs text-slate-400 pl-2 leading-relaxed">{inc.desc}</p>
                                <div className="mt-2 pl-2 flex gap-2">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${inc.status === 'RESOLVED' ? 'bg-green-900/20 text-green-500 border border-green-900/50' : 'bg-yellow-900/20 text-yellow-500'
                                        }`}>
                                        {inc.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </TacticalCard>

                <div className="p-4 bg-blue-900/10 border border-blue-500/30 rounded flex items-center gap-4 panel-3d">
                    <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 shadow-[0_0_15px_blue]">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">Система Працює Стабільно</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            Всі критичні модулі (ETL, AI, DB) функціонують у штатному режимі. Затримок не виявлено.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`space-y-6 animate-in fade-in duration-500 pb-20 w-full max-w-[1400px] mx-auto min-h-screen bg-gradient-to-br ${getBgGradient()} transition-all duration-700`}>

            {/* Entity Modal is shared */}
            <Modal
                isOpen={!!selectedEntity}
                onClose={() => setSelectedEntity(null)}
                title={`Аудит Контрагента: ${selectedEntity?.name}`}
                icon={<ShieldCheck size={20} className="text-amber-500 icon-3d-amber" />}
                size="lg"
            >
                {selectedEntity && (
                    <div className="p-4 space-y-4">
                        <div className="text-white">ЄДРПОУ: {selectedEntity.code}</div>
                        <div className="text-white">Ризик: {selectedEntity.risk}%</div>
                        <button onClick={() => setSelectedEntity(null)} className="px-4 py-2 bg-slate-800 rounded text-xs font-bold">Закрити</button>
                    </div>
                )}
            </Modal>

            {/* Settings Modal */}
            <Modal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                title="Налаштування Клієнтського Порталу"
                icon={<Sliders size={20} className="text-slate-400 icon-3d" />}
            >
                <div className="space-y-6 p-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Вподобання Контенту</h4>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 rounded text-xs font-bold btn-3d">Скасувати</button>
                        <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 rounded text-xs font-bold btn-3d btn-3d-blue">Зберегти</button>
                    </div>
                </div>
            </Modal>

            {/* Live Ticker */}
            <div className="w-full bg-slate-900/80 border-y border-slate-800 h-9 overflow-hidden flex items-center relative select-none backdrop-blur-md mb-6 shadow-sm panel-3d">
                <div className="flex items-center gap-2 px-4 shrink-0 bg-slate-950 h-full border-r border-slate-800 z-20 text-amber-500 font-bold text-[10px] uppercase tracking-wider shadow-xl">
                    <Activity size={14} className="animate-pulse icon-3d-amber" /> Live Feed
                </div>
                <div className="flex items-center gap-12 animate-marquee whitespace-nowrap pl-4 hover:pause">
                    <span className="text-slate-300 text-xs">🔥 ДМСУ: Затримки на кордоні 'Ягодин' збільшилися на 2 години.</span>
                    <span className="text-slate-300 text-xs">⚡ НБУ: Оновлено курс валют. USD/UAH: 38.50.</span>
                </div>
            </div>

            <ViewHeader
                title="PREDATOR PRIME | КЛІЄНТСЬКИЙ ПОРТАЛ"
                icon={<ShieldCheck size={24} className="text-amber-500 icon-3d-amber" />}
                breadcrumbs={['ПОРТАЛ', 'ПРЕМІУМ ПАНЕЛЬ']}
                stats={[
                    { label: 'Статус Системи', value: 'ОПТИМАЛЬНО', icon: <Activity size={14} />, color: 'success' },
                    { label: 'Рівень Безпеки', value: 'МАКСИМУМ', icon: <ShieldCheck size={14} />, color: 'primary' },
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all btn-3d ${privacyMode ? 'bg-amber-900/20 border-amber-500 text-amber-400' : 'bg-slate-900/50 border-slate-700 text-slate-400'}`}
                        >
                            {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span className="text-xs font-bold hidden sm:inline">{privacyMode ? 'ПРИХОВАНО' : 'ВИДИМО'}</span>
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-white transition-colors btn-3d">
                            <Settings size={16} />
                        </button>
                        <button onClick={() => setActiveTab('ASSISTANT')} className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all hover:scale-105 btn-3d btn-3d-amber text-white">
                            <Bot size={16} /> AI АСИСТЕНТ
                        </button>
                    </div>
                }
            />

            <div className="flex justify-center border-b border-slate-800/50 mb-6 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'DASHBOARD', label: 'Головна Панель', icon: <BarChart2 size={16} /> },
                    { id: 'GAZETTE', label: 'Ранішня Газета', icon: <Newspaper size={16} /> },
                    { id: 'EXPLORER', label: 'OpenSearch Explorer', icon: <Search size={16} /> },
                    { id: 'ASSISTANT', label: 'KuberFace AI', icon: <Bot size={16} /> },
                    { id: 'SYSTEM', label: 'Стан Системи', icon: <Activity size={16} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all hover:bg-slate-800/30 whitespace-nowrap ${activeTab === tab.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[600px] p-2 md:p-0">
                {activeTab === 'DASHBOARD' && <UserDashboard privacyMode={privacyMode} onSelectEntity={setSelectedEntity} />}
                {activeTab === 'GAZETTE' && <DailyGazette onAskAI={handleSendMessage} />}
                {activeTab === 'EXPLORER' && renderSimulatedKibana()}
                {activeTab === 'ASSISTANT' && renderAssistant()}
                {activeTab === 'SYSTEM' && renderSystemStatus()}
            </div>
        </div>
    );
};

export default UserView;
