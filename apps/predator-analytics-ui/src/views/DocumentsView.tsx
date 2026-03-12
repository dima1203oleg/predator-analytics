
import React, { useState, useEffect, useMemo } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import {
    FileText, Search, Filter, Layers, Download, Eye, Trash2,
    RefreshCw, CheckCircle2, AlertCircle, Clock, Database, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useUser, UserRole } from '../context/UserContext';
import { NeutralizedContent } from '../components/NeutralizedContent';

const DocumentsView: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const toast = useToast();
    const { canAccess } = useUser();

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await (api.documents as any).list({
                limit: 100,
                category: categoryFilter === 'all' ? undefined : categoryFilter
            });
            setDocuments(response?.documents || []);
        } catch (e) {
            console.error(e);
            toast.error("Помилка", "Не вдалося завантажити базу знань.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocuments(); }, [categoryFilter]);

    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesText = doc.title?.toLowerCase().includes(filter.toLowerCase()) ||
                               doc.snippet?.toLowerCase().includes(filter.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
            return matchesText && matchesCategory;
        });
    }, [documents, filter, categoryFilter]);

    const stats = [
        { label: 'Документів в Системі', value: String(documents.length), icon: <FileText size={14} />, color: 'primary' },
        { label: 'Верифіковано AI', value: String(documents.filter(d => d.source !== 'mock').length), icon: <CheckCircle2 size={14} />, color: 'success' },
        { label: 'Останній Аналіз', value: 'Щойно', icon: <Clock size={14} />, color: 'warning' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 w-full max-w-[1700px] mx-auto relative z-10">
            <ViewHeader
                title="РЕПОЗИТОРІЙ СЕМАНТИЧНИХ ЗНАНЬ"
                icon={<Layers size={20} className="icon-3d-blue" />}
                breadcrumbs={['СИНАПСИС', 'ДОСЛІДЖЕННЯ', 'АРХІВ ЗНАНЬ']}
                stats={stats as any}
            />

            {/* DROPZONE - Clean & Premium */}
            <div className="relative group border border-dashed border-slate-800 hover:border-blue-500/50 rounded-[28px] p-10 transition-all duration-500 bg-slate-950/20 backdrop-blur-sm hover:bg-blue-500/5 cursor-pointer overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-cyber-grid opacity-5 pointer-events-none"></div>

                <div className="flex flex-col items-center justify-center text-center relative z-10">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-2xl group-hover:border-blue-500/50 transition-all duration-500"
                    >
                        <Download size={32} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                    </motion.div>
                    <h3 className="text-xl font-display font-black text-slate-200 group-hover:text-blue-400 transition-colors tracking-tight">Додати нові матеріали до аналізу</h3>
                    <p className="text-sm text-slate-500 mt-3 max-w-lg leading-relaxed">
                        Підтримуються PDF звіти, реєстри CSV/JSON та текстові документи. <br/>
                        <span className="text-xs text-slate-600 font-mono mt-2 block uppercase tracking-widest">Автоматична семантична індексація V45</span>
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-slate-950/40 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Пошук за змістом або назвою..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-slate-900/50 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-200 focus:border-blue-500/50 outline-none w-full sm:w-80 transition-all shadow-inner placeholder:text-slate-600"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-500/50 hover:border-slate-700 transition-all cursor-pointer shadow-sm appearance-none"
                    >
                        <option value="all">Усі Джерела</option>
                        <option value="customs">Державні Реєстри</option>
                        <option value="legal">Юридичні Документи</option>
                        <option value="technical">Аналітичні Звіти</option>
                    </select>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                     <div className="flex items-center p-1 bg-black/40 rounded-2xl border border-white/5">
                         <button className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-all"><Layers size={16} /></button>
                         <button className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-all"><Filter size={16} /></button>
                     </div>
                     <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                        <button className="p-2 text-slate-500 hover:text-red-400 transition-all" title="Видалити"><Trash2 size={16} /></button>
                        <button className="p-2 text-slate-500 hover:text-blue-400 transition-all" title="Експорт"><Download size={16} /></button>
                    </div>
                    <button
                        onClick={fetchDocuments}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95 whitespace-nowrap"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Оновити Репозиторій
                    </button>
                </div>
            </div>

            <TacticalCard variant="holographic" title="Архів Верифікованих Знань" className="panel-3d shadow-2xl rounded-[32px] overflow-hidden border-white/5">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] bg-black/20">
                                <th className="p-5">Об'єкт Дослідження</th>
                                <th className="p-5">Категорія</th>
                                <th className="p-5">Сховище</th>
                                <th className="p-5">Дата Додавання</th>
                                <th className="p-5">Статус Доступу</th>
                                <th className="p-5 text-right">Управління</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                                                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Синхронізація з ядром...</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : filteredDocs.length === 0 ? (
                                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan={6} className="p-20 text-center text-slate-500 font-display italic">
                                            Записи відсутні у вибраній категорії.
                                        </td>
                                    </motion.tr>
                                ) : (
                                    filteredDocs.map((doc, idx) => (
                                        <motion.tr
                                            key={doc.id || idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-default"
                                        >
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800 group-hover:border-blue-500/30 transition-all duration-500 shadow-lg">
                                                        <FileText size={18} className="text-blue-400" />
                                                    </div>
                                                     <div>
                                                         <div className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors tracking-tight">
                                                            <NeutralizedContent
                                                                content={doc.title}
                                                                requiredRole={UserRole.OPERATOR}
                                                            />
                                                         </div>
                                                         <div className="text-[10px] text-slate-500 font-mono truncate max-w-[350px] mt-1 opacity-70 italic">
                                                            <NeutralizedContent
                                                                content={doc.snippet}
                                                                mode="blur"
                                                                requiredRole={UserRole.COMMANDER}
                                                                redactedLabel="SNIPPET_PROTECTED"
                                                            />
                                                         </div>
                                                     </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                                    {doc.category === 'customs' ? 'Митниця/Реєстри' : doc.category || 'Загальне'}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono lowercase tracking-tight">
                                                    <Database size={12} className="text-slate-600" />
                                                    {doc.source}
                                                </div>
                                            </td>
                                            <td className="p-5 text-[11px] text-slate-500 font-mono tabular-nums">
                                                {doc.created_at ? new Date(doc.created_at).toLocaleDateString('uk-UA') : '20.12.2025'}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Доступно AI</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                    <button className="p-2.5 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 hover:border-blue-500 transition-all shadow-xl" title="Переглянути"><Eye size={16} /></button>
                                                    <button className="p-2.5 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500 transition-all shadow-xl" title="Скачати"><Download size={16} /></button>
                                                    <button className="p-2.5 text-slate-400 hover:text-red-400 bg-slate-900 rounded-xl border border-slate-800 hover:border-red-500 transition-all shadow-xl" title="Видалити"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </TacticalCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TacticalCard variant="holographic" title="Статистика Сховища Знань" className="panel-3d rounded-[32px] border-white/5">
                    <div className="space-y-6 py-4">
                        {[
                            { name: 'Митні Декларації', count: 42, color: 'bg-blue-500' },
                            { name: 'Державні Реєстри', count: 18, color: 'bg-emerald-500' },
                            { name: 'Юридичні Документи', count: 12, color: 'bg-purple-500' },
                            { name: 'Аналітичні Звіти', count: 9, color: 'bg-amber-500' },
                        ].map((cat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs mb-1 font-bold">
                                    <span className="text-slate-400 uppercase tracking-widest">{cat.name}</span>
                                    <span className="text-slate-200 font-mono tracking-tighter text-sm">{cat.count} шт.</span>
                                </div>
                                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(cat.count / 81) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className={`h-full ${cat.color} shadow-[0_0_12px_currentColor] opacity-70`}
                                        style={{ color: cat.color.replace('bg-', '') === 'blue-500' ? '#3b82f6' : cat.color.replace('bg-', '') === 'emerald-500' ? '#10b981' : cat.color.replace('bg-', '') === 'purple-500' ? '#a855f7' : '#f59e0b' }}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TacticalCard>

                <TacticalCard variant="holographic" title="Технологічний Аналіз (AI Readiness)" className="panel-3d rounded-[32px] border-white/5">
                    <div className="flex flex-col sm:flex-row items-center justify-around h-full py-6 gap-8">
                        <div className="text-center relative">
                            <div className="w-32 h-32 rounded-full border-[6px] border-white/5 flex items-center justify-center relative shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="364.4" strokeDasharray-offset="29.1" className="text-blue-500 opacity-60 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ strokeDashoffset: 364.4 * 0.08 }} />
                                </svg>
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-display font-black text-white tracking-widest">92%</span>
                                    <span className="text-[8px] text-slate-500 font-black uppercase mt-1">Оброблено</span>
                                </div>
                            </div>
                            <div className="mt-4 text-[9px] text-slate-500 uppercase font-black tracking-[0.3em]">AI СЕМАНТИЧНЕ ПОКРИТТЯ</div>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Синхронізація OpenSearch', status: 'АКТИВНА', color: 'text-emerald-500' },
                                { label: 'Векторизація Qdrant', status: 'ГОТОВО', color: 'text-emerald-500' },
                                { label: 'Цілісність Gold Layer', status: 'В НОРМІ', color: 'text-emerald-500' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                                    <CheckCircle2 size={16} className={item.color} />
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{item.label}</div>
                                        <div className={`text-[9px] font-black tracking-[0.1em] ${item.color}`}>{item.status}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </TacticalCard>
            </div>

            <TacticalCard variant="holographic" title="Протокол Обробки Інформації" className="panel-3d bg-blue-500/[0.03] border-blue-500/20 rounded-[32px]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-blue-400 font-black text-xs uppercase tracking-[0.2em]">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><Layers size={14} /></div> Валідація Даних
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Кожен документ проходить багаторівневу перевірку цілісності та верифікацію джерела перед потраплянням в основний репозиторій.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-emerald-400 font-black text-xs uppercase tracking-[0.2em]">
                            <div className="p-2 bg-emerald-500/10 rounded-lg"><Tag size={14} /></div> Семантичне Тегування
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            AI-ядро автоматично розпізнає ключові сутності, дати та логічні зв'язки, створюючи "цифровий відбиток" документа.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-amber-400 font-black text-xs uppercase tracking-[0.2em]">
                            <div className="p-2 bg-amber-500/10 rounded-lg"><Clock size={14} /></div> Відстеження Змін
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Система зберігає повну історію взаємодії з кожним файлом, забезпечуючи прозорість аудиту та незмінність даних.
                        </p>
                    </div>
                </div>
            </TacticalCard>
        </div>
    );
};

export default DocumentsView;
