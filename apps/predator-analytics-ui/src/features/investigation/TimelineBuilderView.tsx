/**
 * ⏳ TIMELINE BUILDER // РЕКОНСТРУКТОР ХРОНОЛОГІЇ | v58.2-WRAITH
 * PREDATOR Analytics — Temporal Forensic & Event Reconstruction Array
 *
 * Глибока хронологічна реконструкція подій: Фінанси, Право, OSINT.
 * Жорстка прив'язка до кейсів та WORM-фіксація артефактів.
 *
 * © 2026 PREDATOR Analytics — HR-04 (100% українська)
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Calendar, ChevronDown, ChevronRight, Clock,
    DollarSign, Eye, FileText, Filter, Hash, History, Lock,
    MapPin, MessageSquare, PlusCircle, Search, Shield,
    TrendingUp, User, Activity, Zap, Target, Binary, RefreshCcw,
    Database, Satellite, Fingerprint, Layout
} from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/ui/TacticalCard';
import { ViewHeader } from '@/components/ViewHeader';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import Modal from '@/components/Modal';

// ========================
// Types
// ========================

type EventCategory = 'financial' | 'legal' | 'contact' | 'travel' | 'document' | 'risk' | 'investigation';

interface TimelineEvent {
    id: string;
    date: string;
    time?: string;
    category: EventCategory;
    title: string;
    description: string;
    source: string;
    confidence: number; // 0–100
    relatedEntities?: string[];
    documents?: string[];
    caseId?: string;
    verified: boolean;
}

// ========================
// Constants & Config
// ========================

const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bg: string; icon: any }> = {
    financial:     { label: 'ФІНАНСИ', color: '#10b981', bg: 'bg-emerald-500/10', icon: DollarSign },
    legal:         { label: 'ПРАВО', color: '#3b82f6', bg: 'bg-blue-500/10', icon: Shield },
    contact:       { label: 'КОНТАКТ', color: '#0ea5e9', bg: 'bg-sky-500/10', icon: MessageSquare },
    travel:        { label: 'ТРАНСПОРТ', color: '#f59e0b', bg: 'bg-amber-500/10', icon: MapPin },
    document:      { label: 'ДОКУМЕНТ', color: '#6366f1', bg: 'bg-indigo-500/10', icon: FileText },
    risk:          { label: 'РИЗИК', color: '#f43f5e', bg: 'bg-rose-500/10', icon: AlertTriangle },
    investigation: { label: 'СЛІДСТВО', color: '#a855f7', bg: 'bg-purple-500/10', icon: Eye },
};

const MOCK_EVENTS: TimelineEvent[] = [
    {
        id: 'EVT-001',
        date: '2026-01-15',
        time: '09:30',
        category: 'financial',
        title: 'ВІДКРИТТЯ_РАХУНКУ_MONOBANK',
        description: 'Відкрито поточний рахунок UA213206490000026007233566001. Первісний депозит 50,000 UAH.',
        source: 'БАНКІВСЬКІ_РЕЄСТРИ',
        confidence: 98,
        relatedEntities: ['Марченко Р.Г.', 'Monobank'],
        caseId: 'CASE-2026-089',
        verified: true,
    },
    {
        id: 'EVT-002',
        date: '2026-02-03',
        category: 'legal',
        title: 'РЕЄСТРАЦІЯ_ТОВ_ГОЛДЕН_ТРЕЙД',
        description: 'Зареєстровано нову юридичну особу. КВЕДи: 46.39, 46.90. Статутний капітал 1,000 UAH.',
        source: 'ЄДР_УКРАЇНИ',
        confidence: 100,
        relatedEntities: ['ТОВ "ГОЛДЕН ТРЕЙД"', 'Марченко Р.Г.'],
        verified: true,
    },
    {
        id: 'EVT-003',
        date: '2026-02-28',
        time: '14:15',
        category: 'risk',
        title: 'ІДЕНТИФІКАЦІЯ_PEP_ЗВ_ЯЗКУ',
        description: 'Встановлено ділові відносини з Олещуком В.О. — заступником міністра. Ризик: HIGH.',
        source: 'АНАЛІТИЧНИЙ_ЯДРО_PREDATOR',
        confidence: 92,
        relatedEntities: ['Марченко Р.Г.', 'Олещук В.О.'],
        caseId: 'CASE-2026-089',
        verified: true,
    }
];

// ========================
// Sub-Components
// ========================

const EventCard: React.FC<{ event: TimelineEvent; isLast: boolean }> = ({ event, isLast }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = CATEGORY_CONFIG[event.category];
    const Icon = cfg.icon;

    return (
        <div className="relative flex gap-10">
            {/* ТЕМПОРАЛЬНА ЛІНІЯ */}
            {!isLast && (
                <div className="absolute left-[39px] top-16 bottom-0 w-1 bg-gradient-to-b from-indigo-500/30 to-transparent rounded-full" />
            )}

            {/* ХРОНО-ВУЗОЛ */}
            <div className="flex-shrink-0 z-10 pt-4">
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={cn(
                        "w-20 h-20 rounded-[2rem] border-2 flex items-center justify-center shadow-2xl transition-all relative overflow-hidden",
                        expanded ? "bg-indigo-600 border-indigo-400" : "bg-black border-white/10"
                    )}
                >
                    <Icon size={32} style={{ color: expanded ? '#fff' : cfg.color }} className={cn(expanded ? "drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "")} />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </motion.div>
            </div>

            {/* КОНТЕНТ ПОДІЇ */}
            <div className="flex-1 pb-16">
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            {new Date(event.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic mt-1">
                            {event.time || '--:--'} // TIMESTAMP_VERIFIED
                        </span>
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <Badge className={cn("px-4 py-1 text-[10px] font-black italic border-none uppercase tracking-widest", cfg.bg)} style={{ color: cfg.color }}>
                        {cfg.label}
                    </Badge>
                    {!event.verified && (
                        <Badge className="bg-rose-600/10 text-rose-500 border-rose-500/20 text-[9px] font-black italic">УВАГА: НЕВЕРИФІКОВАНО</Badge>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                        <div className="h-1 w-20 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${event.confidence}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 font-mono italic">{event.confidence}% CONFIDENCE</span>
                    </div>
                </div>

                <TacticalCard 
                    variant="cyber" 
                    className={cn(
                        "p-8 rounded-[3rem] transition-all cursor-pointer group",
                        expanded ? "bg-indigo-600/5 border-indigo-500/30 shadow-4xl" : "bg-black/40 border-white/5 hover:border-white/10 shadow-2xl"
                    )}
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-start justify-between gap-10">
                        <div className="space-y-3 flex-1">
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-indigo-400 transition-colors">{event.title}</h3>
                            <p className="text-sm text-slate-400 font-medium italic leading-relaxed group-hover:text-slate-200 transition-colors uppercase">{event.description}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl text-slate-700 group-hover:text-white transition-all self-start">
                            {expanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                        </div>
                    </div>

                    <AnimatePresence>
                        {expanded && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="mt-8 pt-8 border-t border-white/5 space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none">ДЖЕРЕЛО_АРТЕФАКТУ</p>
                                        <div className="p-6 bg-black/60 rounded-[2rem] border border-white/5 flex items-center gap-4">
                                            <Satellite size={18} className="text-indigo-500" />
                                            <span className="text-sm font-black text-white italic uppercase">{event.source}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none">ID_ПОДІЇ_WORM</p>
                                        <div className="p-6 bg-black/60 rounded-[2rem] border border-white/5 flex items-center gap-4">
                                            <Hash size={18} className="text-indigo-500" />
                                            <span className="text-sm font-mono font-black text-slate-500 italic">{event.id} // SECURED</span>
                                        </div>
                                    </div>
                                </div>

                                {event.relatedEntities && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none">ПОВ'ЯЗАНІ_СУБ'ЄКТИ</p>
                                        <div className="flex flex-wrap gap-3">
                                            {event.relatedEntities.map(e => (
                                                <Badge key={e} className="px-6 py-2 bg-indigo-600/10 text-indigo-400 border-indigo-500/20 text-xs font-black italic rounded-xl">
                                                    <User size={12} className="mr-2" /> {e.toUpperCase()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-6 border-t border-white/[0.04]">
                                    <div className="flex gap-4">
                                        <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest italic hover:text-white transition-all flex items-center gap-3">
                                            <FileText size={16} /> ПЕРЕГЛЯНУТИ_ЗВІТ
                                        </button>
                                        <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest italic hover:text-white transition-all flex items-center gap-3">
                                            <History size={16} /> ЛОГ_ЗМІН
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 text-emerald-500">
                                        <Shield size={16} />
                                        <span className="text-[9px] font-black uppercase italic tracking-widest">ДАНІ_ВЕРЕФІКОВАНО_АНАЛІТИКОМ</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </TacticalCard>
            </div>
        </div>
    );
};

// ========================
// Main Component
// ========================

const TimelineBuilderView: React.FC = () => {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'ALL'>('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filtered = useMemo(() => {
        return MOCK_EVENTS.filter((e) => {
            const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
            const matchCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
            return matchSearch && matchCategory;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [search, categoryFilter]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(99, 102, 241, 0.04)" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 max-w-[1780px] mx-auto p-4 sm:p-12 space-y-16">
                    
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-10">
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
                                    <div className="relative p-7 bg-black border border-indigo-900/40 rounded-[2.5rem] shadow-4xl transform hover:rotate-3 transition-transform">
                                        <History size={42} className="text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="badge-v2 bg-indigo-600/10 border border-indigo-600/20 text-indigo-500 px-3 py-1 text-[10px] font-black tracking-[0.4em] uppercase italic">
                                            TEMPORAL_FORENSIC // TIMELINE_BUILDER
                                        </span>
                                        <div className="h-px w-10 bg-indigo-600/20" />
                                        <span className="text-[10px] font-black text-slate-700 font-mono tracking-widest uppercase italic">v58.2-WRAITH</span>
                                    </div>
                                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic skew-x-[-2deg] leading-none">
                                        РЕКОНСТРУКТОР <span className="text-indigo-500 underline decoration-indigo-600/20 decoration-8 italic uppercase">ХРОНОЛОГІЇ</span>
                                    </h1>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.5em] italic mt-2 opacity-80 leading-none">
                                        ГЛИБИННИЙ АНАЛІЗ ЧАСОВИХ ВЕКТОРІВ ТА ПРИХОВАНИХ ЗВ'ЯЗКІВ
                                    </p>
                                </div>
                            </div>
                        }
                        stats={[
                            { label: 'ПОДІЙ_В_КЕЙСІ', value: '142', icon: <Hash size={14} />, color: 'primary' },
                            { label: 'ВЕРИФІКОВАНО', value: '89.4%', icon: <Shield size={14} />, color: 'success', animate: true },
                            { label: 'АКТИВНІ_ВЕКТОРІ', value: '12', icon: <Target size={14} />, color: 'warning' }
                        ]}
                        actions={
                            <div className="flex gap-4">
                                <button onClick={() => {setSearch(''); setCategoryFilter('ALL');}} className="p-5 bg-black border border-white/[0.04] rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl">
                                    <RefreshCcw size={24} />
                                </button>
                                <button onClick={() => setIsAddModalOpen(true)} className="px-8 py-5 bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] italic hover:bg-indigo-600 shadow-2xl transition-all flex items-center gap-4">
                                    <PlusCircle size={18} /> ДОДАТИ_ТЕМПОРАЛЬНИЙ_АРТЕФАКТ
                                </button>
                            </div>
                        }
                    />

                    {/* HUD ФІЛЬТРІВ */}
                    <div className="flex flex-col lg:flex-row items-center gap-10 bg-black/40 border-2 border-white/[0.03] p-10 rounded-[3rem] shadow-3xl backdrop-blur-3xl">
                        <div className="flex-1 w-full relative group">
                            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-800 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ПОШУК ПОДІЙ У МАТРИЦІ ЧАСУ..."
                                className="w-full bg-white/[0.01] border-2 border-white/[0.04] p-8 pl-24 rounded-[2rem] text-2xl font-black text-white italic tracking-tighter placeholder:text-slate-900 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.02] transition-all uppercase"
                            />
                        </div>

                        <div className="flex items-center gap-4 flex-wrap justify-center lg:justify-start">
                            <div className="flex items-center gap-4 mr-4 p-4 border-r border-white/5">
                                <Filter className="w-6 h-6 text-indigo-500" />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic leading-none">ФІЛЬТР_КАТЕГОРІЙ</span>
                            </div>
                            <button
                                onClick={() => setCategoryFilter('ALL')}
                                className={cn(
                                    "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all border-2",
                                    categoryFilter === 'ALL' ? "bg-indigo-600 border-indigo-500 text-white shadow-xl" : "bg-black border-white/5 text-slate-600 hover:text-white"
                                )}
                            >
                                ВСІ_ОБ'ЄКТИ
                            </button>
                            {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={() => setCategoryFilter(categoryFilter === key ? 'ALL' : key)}
                                    className={cn(
                                        "px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic transition-all border-2",
                                        categoryFilter === key ? "bg-white/10 border-indigo-500/40 text-white shadow-xl" : "bg-black border-white/5 text-slate-700 hover:text-white"
                                    )}
                                    style={{ color: categoryFilter === key ? cfg.color : undefined }}
                                >
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ТЕМПОРАЛЬНА ШКАЛА */}
                    <div className="max-w-6xl mx-auto space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filtered.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 flex flex-col items-center justify-center text-center space-y-10">
                                    <Satellite size={120} className="text-slate-900 animate-pulse" />
                                    <div className="space-y-4">
                                        <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">ВІДСУТНІСТЬ_ДАННИХ</h3>
                                        <p className="text-[11px] text-slate-700 font-black uppercase tracking-[0.4em] italic max-w-md mx-auto leading-relaxed">СІТКА ЧАСУ ПОРОЖНЯ. ЗАДАЙТЕ ІНШІ ПАРАМЕТРИ ФІЛЬТРАЦІЇ АБО ЗАПУСТИТИ_СКАНЕР.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                filtered.map((event, index) => (
                                    <EventCard key={event.id} event={event} isLast={index === filtered.length - 1} />
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* MODAL ADD EVENT */}
                <Modal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                    title="ДОДАТИ_ТЕМПОРАЛЬНИЙ_АРТЕФАКТ" 
                    icon={<PlusCircle size={24} />}
                    size="md"
                    variant="default"
                >
                    <div className="space-y-10">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic ml-2">ДАТА_ПОДІЇ</label>
                                <div className="relative">
                                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500" />
                                    <input type="date" className="w-full bg-black/60 border border-white/10 p-5 pl-16 rounded-2xl text-white outline-none focus:border-indigo-500/40" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic ml-2">КАТЕГОРІЯ_МАТРИЦІ</label>
                                <select className="w-full bg-black/60 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-indigo-500/40 uppercase font-black italic text-xs tracking-widest">
                                    {Object.values(CATEGORY_CONFIG).map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic ml-2">ЗАГОЛОВОК_АРТЕФАКТУ</label>
                            <input type="text" placeholder="НАЗВА ПОДІЇ..." className="w-full bg-black/60 border border-white/10 p-6 rounded-2xl text-white outline-none focus:border-indigo-500/40 font-black italic uppercase" />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic ml-2">ОПИС_ТА_АНАЛІТИЧНИЙ_ВИСНОВОК</label>
                            <textarea rows={4} placeholder="ДЕТАЛІ ПОДІЇ..." className="w-full bg-black/60 border border-white/10 p-6 rounded-3xl text-white outline-none focus:border-indigo-500/40 font-medium italic uppercase text-xs leading-relaxed" />
                        </div>

                        <button className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-[0.4em] italic rounded-[2rem] shadow-4xl transition-all flex items-center justify-center gap-6">
                            <Fingerprint size={24} /> ЗАКРІПИТИ_В_WORM_МАСИВІ
                        </button>
                    </div>
                </Modal>

                <style dangerouslySetInnerHTML={{ __html: `
                    .shadow-4xl { box-shadow: 0 80px 150px -40px rgba(0,0,0,0.95), 0 0 100px rgba(99,102,241,0.02); }
                    .shadow-3xl { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8); }
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
                `}} />
            </div>
        </PageTransition>
    );
};

export default TimelineBuilderView;
