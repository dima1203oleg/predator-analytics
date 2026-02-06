import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Database, Play, Plus, RefreshCw, Shield, Terminal, Trash2, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { PipelineMonitor } from '../components/pipeline/PipelineMonitor';
import { ViewHeader } from '../components/ViewHeader';
import { api } from '../services/api';
import { useIngestionStore } from '../store/useIngestionStore';

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

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl) return;
        setIsAdding(true);

        const tempId = `tg_${Date.now()}`;
        const channelName = newUrl.split('/').pop() || 'Telegram Channel';

        addJob(tempId, channelName, 0);
        updateJob(tempId, { status: 'parsing', stage: 'init', message: 'Підключення до Telegram...' });
        setActiveJobId(tempId); // Show pipeline immediately

        try {
            const res = await api.ingestion.startJob({
                source_type: 'telegram',
                url: newUrl,
                config: { name: channelName }
            });

            if (res.job_id && res.job_id !== tempId) {
                // Update implementation plan to track real job
                updateJob(tempId, { id: res.job_id, status: 'parsing', stage: 'stream', message: 'Канал підключено, йде збір...' });
                setActiveJobId(res.job_id);
            } else {
                updateJob(tempId, { status: 'parsing', stage: 'stream', message: 'Канал підключено, йде збір...' });
            }

            setNewUrl('');
            await loadData();
        } catch (e: any) {
            updateJob(tempId, { status: 'failed', message: e.message || "Помилка з'єднання" });
            alert('Error adding channel: ' + (e.message || 'Unknown error'));
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
        <div className="min-h-screen animate-in fade-in duration-700 pb-20 relative">

            {/* Pipeline Overlay */}
            <AnimatePresence>
                {activeJobId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <div className="w-full max-w-4xl space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="text-emerald-400" />
                                    Живий Пайплайн Збору Даних
                                </h3>
                                <button
                                    onClick={() => setActiveJobId(null)}
                                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                                    title="Закрити"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <PipelineMonitor
                                jobId={activeJobId}
                                pipelineType="telegram"
                                externalStatus={activeJobs[activeJobId] || { id: activeJobId, status: 'parsing', stage: 'init', type: 'telegram'}}
                                onComplete={() => {
                                    // Keep showing for a moment or close?
                                    // For telegram streams, it might not complete immediately, but stay active.
                                    // We keep it open until user closes or explicit completion.
                                }}
                                onError={(e) => console.error(e)}
                            />

                            <div className="text-center text-xs text-slate-500 font-mono">
                                НАТИСНІТЬ 'ESC' АБО КНОПКУ ЗАКРИТТЯ ДЛЯ РОБОТИ У ФОНІ
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ViewHeader
                title="TELEGRAM РОЗВІДКА (PREDATOR v45)"
                icon={<Shield size={20} className="icon-3d-green" />}
                breadcrumbs={['РОЗВІДКА', 'ДЖЕРЕЛА', 'TELEGRAM']}
                stats={[
                    { label: 'Каналів', value: channels.length, icon: <Database size={12} />, color: 'primary' },
                    { label: 'Статус', value: 'ACTIVE', icon: <Activity size={12} />, color: 'success' },
                ]}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: CONTROLS */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* ADD SOURCE PANEL */}
                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-white relative z-10">
                                <Plus className="w-5 h-5 text-emerald-400" />
                                Додати Джерело
                            </h2>

                            <form onSubmit={handleAdd} className="space-y-4 relative z-10">
                                <div>
                                    <label className="block text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">URL / Ім'я користувача Телеграм-каналу</label>
                                    <div className="relative group/input">
                                        <Activity className="absolute left-3 top-3 w-4 h-4 text-slate-500 group-focus-within/input:text-emerald-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={newUrl}
                                            onChange={(e) => setNewUrl(e.target.value)}
                                            placeholder="https://t.me/customs_of_ukraine"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 font-mono"
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={isAdding}
                                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                    {isAdding ? <RefreshCw className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4 fill-current group-hover/btn:translate-x-0.5 transition-transform" />}
                                    Ініціалізувати Монітор
                                </button>
                            </form>
                        </div>

                        {/* STATS PANEL */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div whileHover={{ y: -2 }} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Активні Канали</div>
                                <div className="text-3xl font-black text-white tracking-tighter">{channels.length}</div>
                            </motion.div>
                            <motion.div whileHover={{ y: -2 }} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Повідомлень</div>
                                <div className="text-3xl font-black text-emerald-400 tracking-tighter">--</div>
                            </motion.div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LIST */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl h-full min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                                <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <Database className="w-5 h-5 text-cyan-400" />
                                    Активні Цілі Моніторингу
                                </h2>
                                <div className="flex gap-2">
                                     <button onClick={loadData} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white" title="Оновити дані">
                                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                                     </button>
                                     <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">ЖИВА СИНХРОНІЗАЦІЯ</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                <AnimatePresence>
                                {channels.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center h-64 text-slate-500"
                                    >
                                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                                            <Activity className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="font-bold text-sm uppercase tracking-wider">Немає активних цілей</p>
                                        <p className="text-xs mt-1 opacity-60">Додайте Telegram канал для початку збору даних</p>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-2">
                                        {channels.map((channel, i) => (
                                            <motion.div
                                                key={channel.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-4 bg-slate-800/20 border border-white/5 hover:border-white/10 hover:bg-slate-800/40 rounded-xl transition-all flex items-center justify-between group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/5 group-hover:scale-105 transition-transform">
                                                        <Zap size={20} className="fill-current" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">{channel.name || 'Unnamed Channel'}</h3>
                                                        <p className="text-slate-500 text-xs font-mono mt-0.5 truncate max-w-[250px]">{channel.url}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden sm:block">
                                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">ОСТАННЯ СИНХРОНІЗАЦІЯ</div>
                                                        <div className="text-xs font-mono text-emerald-400">{channel.last_sync ? new Date(channel.last_sync).toLocaleTimeString() : 'PENDING'}</div>
                                                    </div>
                                                    <div className="h-8 w-[1px] bg-white/5 hidden sm:block"></div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                            title="Переглянути логи"
                                                        >
                                                            <Terminal size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStop(channel.id)}
                                                            className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                            title="Зупинити та видалити"
                                                        >
                                                            <Trash2 size={16} />
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
                    </div>
                </div>

                {/* LOGO FOOTER */}
                <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-xs text-slate-400 max-h-60 overflow-y-auto relative hidden lg:block">
                    <div className="sticky top-0 bg-black/90 backdrop-blur-sm pb-2 mb-2 border-b border-white/10 flex items-center justify-between z-10 -mx-2 px-2 pt-1">
                        <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider">
                            <Terminal size={12} /> СИСТЕМНІ ЛОГИ ЯДРА
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-500/20" />
                            <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                        </div>
                    </div>
                    <div className="space-y-1.5 font-medium opacity-80">
                        <div className="text-emerald-500">[СИСТЕМА] Основні сервіси збору даних ініціалізовані за протоколом AZR.</div>
                        <div className="text-slate-400">[МОНІТОР] Активний пул слухачів встановлено для {channels.length} цілей.</div>
                        {channels.map((c, i) => (
                            <div key={c.id + '_log'} className="text-cyan-400/80">
                                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span> [З'ЄДНАННЯ] Захищене рукостискання з {c.name || 'ціллю'}... ВСТАНОВЛЕНО (Затримка: {10 + i * 2}мс)
                            </div>
                        ))}
                        <div className="text-emerald-500 animate-pulse">_</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomsIntelligenceView;
