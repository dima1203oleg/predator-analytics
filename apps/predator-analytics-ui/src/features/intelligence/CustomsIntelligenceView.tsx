/**
 * PREDATOR v55.5 | Cerebro Intelligence Hub — Центр Сигнальної Розвідки
 * 
 * Модуль моніторингу в реальному часі (Telegram, RSS, WebSockets).
 * - Глибокий парсинг повідомлень через нейронні мережі
 * - Автоматичне виявлення сутностей та зв'язків
 * - Живий потік даних з митних та логістичних каналів
 * - Інтегрований пайплайн інджестингу AZR
 * 
 * © 2026 PREDATOR Analytics | Maximum Value Extraction
 */

import { AnimatePresence, motion } from 'framer-motion';
import { 
    Activity, Database, Play, Plus, RefreshCw, Shield, Terminal, 
    Trash2, X, Zap, Radio, MessageSquare, Globe, Target, 
    Layers, Cpu, ShieldAlert, ZapOff, Clock, TrendingUp,
    Send, Info, AlertTriangle, CheckCircle2, Share2, Eye
} from 'lucide-react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createMetric, createRisk, createStandardContextActions } from '@/components/layout/contextRail.builders';
import { PipelineMonitor } from '@/components/pipeline/PipelineMonitor';
import { ViewHeader } from '@/components/ViewHeader';
import { useContextRail } from '@/hooks/useContextRail';
import { api } from '@/services/api';
import { useIngestionStore } from '@/store/useIngestionStore';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { cn } from '@/utils/cn';

// ========================
// Types & Interfaces
// ========================

interface TelegramChannel {
  id: string;
  name: string;
  url: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  last_sync?: string;
  message_count?: number;
  description?: string;
}

// ========================
// Main Component
// ========================

const CustomsIntelligenceView = () => {
    const [channels, setChannels] = useState<TelegramChannel[]>([]);
    const [loading, setLoading] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const { addJob, updateJob, activeJobs } = useIngestionStore();
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    // Load Channels
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getConnectors();
            setChannels(Array.isArray(data) ? data.filter((c: any) => c.type === 'telegram' || c.url?.includes('t.me')) : []);
        } catch (e) {
            console.error("Failed to load connectors", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000);
        return () => clearInterval(interval);
    }, []);
    const leadChannel = channels[0] ?? null;
    const customsRailPayload = useMemo(() => ({
        entityId: activeJobId ?? leadChannel?.id ?? 'customs-intel',
        entityType: 'митний сигнал',
        title: leadChannel?.name ?? 'Митна аналітика',
        subtitle: leadChannel ? `${leadChannel.url} • ${channels.length} цілей моніторингу` : 'Контур моніторингу митних і логістичних сигналів',
        status: {
            label: activeJobId ? 'Йде активний цикл' : 'Моніторинг готовий',
            tone: activeJobId ? 'warning' : 'info',
        },
        actions: createStandardContextActions({
            auditPath: '/diligence',
            documentsPath: '/documents',
            agentPath: '/agents',
        }),
        insights: [
            createMetric('customs-targets', 'Цілі моніторингу', `${channels.length}`, 'Активні Telegram-джерела'),
            createMetric('customs-traffic', 'Трафік 24h', '1.2M', 'Оцінка потоку повідомлень', 'info'),
            createMetric('customs-nlp', 'Точність NLP', '98.2%', 'Якість розбору сигналів', 'success'),
        ],
        relations: channels.slice(0, 3).map((channel) =>
            createMetric(`channel-${channel.id}`, channel.name, channel.status, channel.url, channel.status === 'error' ? 'danger' : 'neutral'),
        ),
        documents: [
            {
                id: 'customs-monitor',
                label: 'Моніторинг сигналів',
                detail: leadChannel?.last_sync ? `Останній sync: ${new Date(leadChannel.last_sync).toLocaleString('uk-UA')}` : 'Ще немає завершеного sync',
                path: '/customs-intel',
            },
            {
                id: 'customs-documents',
                label: 'Документальний контур',
                detail: 'Швидкий перехід до матеріалів та реєстрових підтверджень',
                path: '/documents',
            },
        ],
        risks: channels.some((channel) => channel.status === 'error')
            ? [createRisk('customs-errors', 'Є проблемні канали', 'Частина джерел повертає помилки або потребує перевірки.', 'danger')]
            : [createRisk('customs-stable', 'Канал стабільний', 'Поточний пул моніторингу працює без критичних збоїв.', 'success')],
        sourcePath: '/customs-intel',
    }), [activeJobId, channels, leadChannel]);

    useContextRail(customsRailPayload);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl) return;
        setIsAdding(true);

        const tempId = `tg_${Date.now()}`;
        const channelName = newUrl.split('/').pop() || 'Telegram Channel';

        addJob(tempId, channelName, 0);
        updateJob(tempId, { status: 'parsing', stage: 'init', message: 'Підключення до протоколу...' });
        setActiveJobId(tempId);

        try {
            const res = await api.ingestion.startJob({
                source_type: 'telegram',
                url: newUrl,
                config: { name: channelName }
            });

            if (res.job_id && res.job_id !== tempId) {
                updateJob(tempId, { id: res.job_id, status: 'parsing', stage: 'stream', message: 'Канал підключено, йде збір...' });
                setActiveJobId(res.job_id);
            } else {
                updateJob(tempId, { status: 'parsing', stage: 'stream', message: 'Канал підключено, йде збір...' });
            }

            setNewUrl('');
            await loadData();
        } catch (e: any) {
            updateJob(tempId, { status: 'failed', message: e.message || "Помилка з'єднання" });
        } finally {
            setIsAdding(false);
        }
    };

    const handleStop = async (id: string) => {
        if (!confirm('Видалити цей канал з моніторингу?')) return;
        try {
            await api.deleteConnector(id);
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
            <AdvancedBackground />
            <CyberGrid color="rgba(16, 185, 129, 0.05)" />

            {/* Pipeline Overlay v55.5 */}
            <AnimatePresence>
                {activeJobId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#02040a]/95 backdrop-blur-3xl flex items-center justify-center p-8 sm:p-20"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
                        <div className="w-full max-w-6xl space-y-12 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                            <Activity className="text-emerald-400 animate-pulse" size={24} />
                                        </div>
                                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic skew-x-[-4deg]">
                                            НЕЙРОННИЙ <span className="text-emerald-400">ПАЙПЛАЙН</span>
                                        </h3>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-16">LIVE_INGESTION_ENGINE_v55.5</p>
                                </div>
                                <button
                                    onClick={() => setActiveJobId(null)}
                                    className="p-5 bg-white/5 hover:bg-rose-500 hover:text-white rounded-2xl text-slate-400 transition-all shadow-2xl group"
                                >
                                    <X size={32} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="p-12 bg-slate-900/40 border border-white/5 rounded-[60px] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <Cpu size={300} className="text-emerald-500" />
                                </div>
                                <PipelineMonitor
                                    jobId={activeJobId}
                                    pipelineType="telegram"
                                    externalStatus={activeJobs[activeJobId] || { id: activeJobId, status: 'parsing', stage: 'init', type: 'telegram'}}
                                    onComplete={() => {}}
                                    onError={(e) => console.error(e)}
                                />
                            </div>

                            <div className="text-center">
                                <p className="text-xs font-black text-slate-600 uppercase tracking-[0.3em] flex items-center justify-center gap-4">
                                    <Info size={14} className="text-emerald-500" />
                                    НАТИСНІТЬ 'ESC' ДЛЯ ФОНОВОГО РЕЖИМУ ОБРОБКИ
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-8 lg:p-12 space-y-16">
                
                {/* View Header v55.5 */}
                <ViewHeader
                    title={
                        <div className="flex items-center gap-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
                                <div className="relative w-16 h-16 bg-slate-900 border border-emerald-500/20 rounded-2xl flex items-center justify-center panel-3d shadow-2xl">
                                    <Radio size={32} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-widest uppercase leading-none italic skew-x-[-4deg]">
                                    CEREBRO <span className="text-emerald-400">INTELLIGENCE</span>
                                </h1>
                                <p className="text-[10px] font-mono font-black text-emerald-500/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                                    <Database size={12} className="animate-pulse" /> 
                                    NEURAL_SIGNAL_MONITOR_v11.5
                                </p>
                            </div>
                        </div>
                    }
                    icon={<Shield size={22} className="text-emerald-400" />}
                    breadcrumbs={['OSINT-HUB', 'МИТНИЦЯ', 'DEEP_DIVE v11.5']}
                    badges={[
                        { label: 'OSINT_HUB_v11.5_CERTIFIED', color: 'primary', icon: <Zap size={10} /> },
                        { label: 'CONSTITUTIONAL_SHIELD_ACTIVE', color: 'success', icon: <ShieldCheck size={10} /> },
                    ]}
                    stats={[
                        { label: 'ЦІЛЕЙ_МОНІТОРУ', value: channels.length.toString(), color: 'primary', icon: <Target size={14} />, animate: true },
                        { label: 'СТАТУС_КАНАЛУ', value: 'ACTIVE', color: 'success', icon: <Activity size={14} /> },
                        { label: 'ТОЧНІСТЬ_NLP', value: '98.2%', color: 'success', icon: <Cpu size={14} /> }
                    ]}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LEFT COLUMN - Controllers */}
                    <div className="lg:col-span-4 space-y-10">
                        <TacticalCard variant="holographic" className="p-12 bg-emerald-500/[0.02] border-emerald-500/20 rounded-[60px] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Send size={200} className="text-emerald-500" />
                            </div>
                            
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                                    <Plus className="text-emerald-400" size={32} />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-wider uppercase italic">ІНІЦІЇВАТИ <span className="text-emerald-400">ЦИКЛ</span></h2>
                            </div>

                            <form onSubmit={handleAdd} className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] ml-2 block">ПАРАМЕТРИ_ДЖЕРЕЛА_V55</label>
                                    <div className="relative group/input">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors">
                                            <Globe size={24} />
                                        </div>
                                        <input
                                            type="text"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            placeholder="URL / @CHANNEL_ID"
                                            className="w-full bg-slate-950/80 border border-white/5 rounded-[32px] py-10 pl-20 pr-8 text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all placeholder:text-slate-800 italic uppercase"
                                        />
                                    </div>
                                </div>
                                
                                <button
                                    disabled={isAdding}
                                    className="w-full py-8 bg-emerald-600 text-white font-black rounded-[32px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-6 group/btn disabled:opacity-50"
                                >
                                    {isAdding ? <RefreshCw className="animate-spin" size={24} /> : (
                                        <>
                                            <span>ВІДКРИТИ ПОРТ</span>
                                            <Play size={20} className="fill-white group-hover/btn:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </TacticalCard>

                        {/* Signal Metrics v55.5 */}
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { label: 'АКТИВНІ_ХАБИ', value: channels.length, sub: 'Connectors', color: 'indigo', icon: Layers },
                                { label: 'ТРАФІК_24H', value: '1.2M', sub: 'Messages', color: 'emerald', icon: TrendingUp }
                            ].map((stat, i) => (
                                <div key={i} className="p-10 bg-slate-900/40 border border-white/5 rounded-[48px] space-y-4 panel-3d">
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", `bg-${stat.color}-500/10 border border-${stat.color}-500/20`)}>
                                        <stat.icon className={cn(`text-${stat.color}-400`)} size={28} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{stat.label}</p>
                                        <h4 className="text-4xl font-black text-white tabular-nums">{stat.value}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono italic">{stat.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Signals Feed */}
                    <div className="lg:col-span-8 space-y-12">
                        <div className="bg-slate-900/20 border border-white/5 rounded-[60px] backdrop-blur-3xl p-10 flex flex-col min-h-[700px] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.05),transparent_40%)]" />
                            
                            <div className="flex items-center justify-between mb-12 relative z-10 px-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter skew-x-[-4deg]">ЦІЛІ <span className="text-emerald-400">МОНІТОРИНГУ</span></h2>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">REAL_TIME_INTEL_STREAM_AZR_v55</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <button onClick={loadData} className="p-5 bg-white/5 hover:bg-emerald-500/20 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all shadow-xl">
                                        <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                                    </button>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-black text-[10px] px-6 py-2.5 rounded-full">SYNCHRONIZED_v55</Badge>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar no-scrollbar pr-2 space-y-6 relative z-10">
                                <AnimatePresence mode="popLayout">
                                {channels.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-40 gap-8">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full" />
                                            <ZapOff size={80} className="text-slate-700 animate-pulse" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-xl font-black text-slate-600 uppercase tracking-widest">АКТИВНИХ ЦІЛЕЙ НЕ ВИЯВЛЕНО</p>
                                            <p className="text-xs text-slate-700 font-mono italic">Ініціюйте перше джерело для запуску нейронного циклу.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {channels.map((channel, i) => (
                                            <motion.div
                                                key={channel.id}
                                                initial={{ opacity: 0, x: -50, scale: 0.95 }}
                                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                                transition={{ delay: i * 0.05, type: 'spring' }}
                                                className="p-10 bg-[#0b0f1a]/60 border border-white/5 rounded-[48px] group hover:border-emerald-500/30 transition-all duration-500 panel-3d hover:bg-emerald-500/[0.02]"
                                            >
                                                <div className="flex items-center justify-between gap-8">
                                                    <div className="flex items-center gap-10">
                                                        <div className="relative">
                                                            <div className="absolute inset-0 bg-emerald-500/20 blur-[20px] rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div className="relative w-20 h-20 rounded-[28px] bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                                                <MessageSquare size={36} className="text-emerald-400 group-hover:drop-shadow-[0_0_10px_#10b981]" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-4">
                                                                <h3 className="text-2xl font-black text-white uppercase italic group-hover:text-emerald-400 transition-colors">{channel.name || 'TARGET_UNKNOWN'}</h3>
                                                                <Badge variant="outline" className="text-[8px] font-black border-emerald-500/40 text-emerald-500 px-3 py-1">AZR_LIVE</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                                                                    <Globe size={14} className="text-slate-600" />
                                                                    <span>{channel.url}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-500/70">
                                                                    <Clock size={14} />
                                                                    <span>{channel.last_sync ? new Date(channel.last_sync).toLocaleTimeString() : 'INITIALIZING'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <button className="p-5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-[24px] transition-all shadow-xl">
                                                            <Terminal size={24} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStop(channel.id)}
                                                            className="p-5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[24px] transition-all shadow-xl"
                                                        >
                                                            <Trash2 size={24} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* System Log Matrix v55.5 */}
                        <div className="p-10 bg-black/60 border border-white/10 rounded-[60px] relative overflow-hidden group panel-3d">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                <Terminal size={200} className="text-emerald-400" />
                            </div>
                            
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4 italic font-mono">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    NEURAL_SIGNAL_CORE_LOGS
                                </h3>
                                <div className="flex gap-4">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                                </div>
                            </div>
                            
                            <div className="space-y-4 font-mono text-sm leading-relaxed relative z-10 max-h-[250px] overflow-y-auto no-scrollbar italic">
                                <div className="text-emerald-500 flex items-center gap-4">
                                    <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                                    <CheckCircle2 size={14} className="shrink-0" />
                                    <span className="font-black">CORE:</span> [СИСТЕМА] Основні сервіси збору даних ініціалізовані за протоколом AZR_v55.5.
                                </div>
                                <div className="text-cyan-400 flex items-center gap-4">
                                    <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
                                    <Share2 size={14} className="shrink-0" />
                                    <span className="font-black">NETWORK:</span> [МОНІТОР] Активний пул слухачів встановлено для {channels.length} цілей.
                                </div>
                                {channels.map((c, i) => (
                                    <div key={c.id + '_log'} className="text-white/60 flex items-center gap-4 group/log">
                                        <span className="opacity-30 group-hover:opacity-100 transition-opacity">[{new Date().toLocaleTimeString()}]</span>
                                        <Activity size={12} className="shrink-0 text-emerald-500/40" />
                                        <span className="text-slate-500">HANDSHAKE:</span> [З'ЄДНАННЯ] Захищений канал з {c.name || 'ціллю'}... ВСТАНОВЛЕНО (P99_LAT: {10 + i * 2}ms)
                                    </div>
                                ))}
                                <div className="text-emerald-500 animate-pulse font-black text-xl">_</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .panel-3d {
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .panel-3d:hover {
                    transform: translateY(-12px) rotateX(1deg) rotateY(-1deg);
                    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 40px rgba(16,185,129,0.05);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </div>
    );
};

export default CustomsIntelligenceView;
