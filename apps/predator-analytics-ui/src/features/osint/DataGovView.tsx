/**
 * PREDATOR v55.5 | Матриця відкритих даних — Матриця державних реєстрів
 * 
 * Модуль інтеграції з Єдиним державним веб-порталом відкритих даних (data.gov.ua).
 * - Семантичний пошук по мільйонах записів
 * - Автоматизований аналіз структури датасетів
 * - Прямий імпорт та AI-збагачення даних
 * - Візуалізація метаданих українських реєстрів
 * 
 * © 2026 PREDATOR Analytics | Контур відкритих державних даних
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Search, Filter, ExternalLink, Download,
    FileText, Info, Calendar, Users, List, Grid,
    ArrowRight, Globe, Shield, RefreshCw, X, AlertCircle,
    Server, Share2, Layers, Zap, Clock, TrendingUp,
    ChevronDown, ChevronUp, History, Bookmark, Settings2,
    Lock, CheckCircle, InfoIcon, Layout
} from 'lucide-react';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { HoloContainer } from '@/components/HoloContainer';
import { cn } from '@/utils/cn';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import {
    normalizeDataGovSearchPayload,
    type Dataset,
} from './dataGovView.utils';

// ========================
// Допоміжні компоненти
// ========================

const DataBadge: React.FC<{ format: string }> = ({ format }) => {
    const colors: Record<string, string> = {
        'CSV': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'JSON': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'XML': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'XLSX': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        'ZIP': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    const color = colors[format.toUpperCase()] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

    return (
        <span className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", color)}>
            {format}
        </span>
    );
};

// ========================
// Основний компонент
// ========================

const DataGovView: React.FC = () => {
    const backendStatus = useBackendStatus();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('УСІ');
    const [lastUpdate, setLastUpdate] = useState('');
    const [hasConfirmedData, setHasConfirmedData] = useState(false);

    const searchDatasets = useCallback(async (query: string = '') => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/osint_ua/datagov/search?q=${encodeURIComponent(query)}&rows=15`);
            const normalized = normalizeDataGovSearchPayload(response.data);

            setDatasets(normalized.datasets);
            setTotalCount(normalized.totalCount);
            setHasConfirmedData(true);
            setLastUpdate(new Date().toLocaleTimeString('uk-UA'));
        } catch (err: unknown) {
            console.error('Помилка пошуку відкритих даних:', err);
            setError('Не вдалося отримати підтверджені дані з порталу відкритих даних. Локальні датасети не підставляються.');
            setDatasets([]);
            setTotalCount(0);
            setSelectedDataset(null);
            setHasConfirmedData(false);
            setLastUpdate('');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        searchDatasets();
    }, [searchDatasets]);

    const availableCategories = useMemo(() => {
        const tagSet = new Set<string>();

        datasets.forEach((dataset) => {
            dataset.tags.forEach((tag) => {
                const normalizedTag = tag.trim().toUpperCase();
                if (normalizedTag.length > 0) {
                    tagSet.add(normalizedTag);
                }
            });
        });

        return ['УСІ', ...Array.from(tagSet).slice(0, 6)];
    }, [datasets]);

    useEffect(() => {
        if (!availableCategories.includes(activeCategory)) {
            setActiveCategory('УСІ');
        }
    }, [activeCategory, availableCategories]);

    const visibleDatasets = useMemo(() => {
        if (activeCategory === 'УСІ') {
            return datasets;
        }

        return datasets.filter((dataset) =>
            dataset.tags.some((tag) => tag.trim().toUpperCase() === activeCategory),
        );
    }, [activeCategory, datasets]);

    useEffect(() => {
        setSelectedDataset((current) => {
            if (!current) {
                return null;
            }

            return visibleDatasets.find((dataset) => dataset.id === current.id) ?? null;
        });
    }, [visibleDatasets]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchDatasets(searchTerm);
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(59, 130, 246, 0.05)" />

                <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-8 lg:p-12 space-y-16">
                    
                    {/* Заголовок контуру */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 bg-blue-500/5 p-12 rounded-[60px] border border-blue-500/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_rgba(59,130,246,0.1),_transparent_40%)]" />
                        
                        <div className="space-y-6 relative">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <Globe size={32} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">КОНТУР_ВІДКРИТИХ_ДАНИХ</span>
                                    </div>
                                    <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none skew-x-[-4deg]">
                                        ВІДКРИТІ <span className="text-blue-400">ДАНІ</span> <span className="text-white/40">UA</span>
                                    </h1>
                                </div>
                            </div>
                            <p className="text-slate-400 max-w-2xl font-medium leading-relaxed italic border-l-2 border-blue-500/30 pl-8">
                                "Доступ до мільйонів записів державного реєстру України. Семантичний пошук, AI-аналіз структури та автоматизована обробка датасетів офіційного порталу відкритих даних."
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-6 relative">
                            <TacticalCard variant="holographic" className="px-10 py-6 bg-blue-500/10 flex flex-col items-end border-blue-500/20 shadow-2xl">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-3">
                                    ЗНАЙДЕНО_РЕЄСТРІВ <Database size={14} />
                                </span>
                                <span className="text-5xl font-black text-white font-mono tracking-tighter italic">
                                    {hasConfirmedData ? totalCount.toLocaleString() : 'Н/д'}
                                </span>
                            </TacticalCard>
                            <div className="flex flex-col items-end gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                <span>У ВИДАЧІ: {hasConfirmedData ? visibleDatasets.length : 'Н/д'}</span>
                                <span>СИНХРОНІЗАЦІЯ: {lastUpdate || 'Н/д'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 px-2">
                        <Badge className={cn(
                            'border px-4 py-2 text-[11px] font-bold',
                            backendStatus.isOffline
                                ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
                                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
                        )}>
                            {backendStatus.statusLabel}
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                            Джерело: /osint_ua/datagov/search
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold text-slate-200">
                            Джерело бекенду: {backendStatus.sourceLabel}
                        </Badge>
                    </div>

                    {/* Пошуковий контур */}
                    <div className="relative group max-w-5xl mx-auto w-full">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
                        <div className="relative bg-slate-950/40 border border-white/5 p-3 rounded-[40px] backdrop-blur-3xl shadow-2xl flex items-center gap-6 group focus-within:border-blue-500/40 transition-all duration-500 ring-1 ring-white/5 ring-inset">
                            <div className="pl-8 text-slate-300 group-focus-within:text-blue-400 transition-colors duration-500">
                                <Search size={28} />
                            </div>
                            <form onSubmit={handleSearch} className="flex-1">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="ПОШУК ПО МІЛЬЙОНАХ ДЕРЖАВНИХ РЕЄСТРІВ..."
                                    className="w-full bg-transparent py-8 text-2xl font-black text-white focus:outline-none placeholder:text-slate-700 tracking-tight italic uppercase"
                                />
                            </form>
                            <button
                                onClick={() => searchDatasets(searchTerm)}
                                disabled={loading}
                                className="mr-3 px-14 py-7 bg-blue-600 text-white font-black rounded-[28px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/50 hover:bg-blue-500 active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center gap-4"
                            >
                                {loading ? <RefreshCw className="animate-spin" /> : (
                                    <>
                                        <span>ІНІЦІЮВАТИ</span>
                                        <Zap size={20} className="fill-white" />
                                    </>
                                )}
                            </button>
                        </div>
                        
                        {/* Категорії у видачі */}
                        <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
                            {availableCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border",
                                        activeCategory === cat 
                                            ? "bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                                            : "bg-white/5 border-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Робоча область результатів */}
                    <div className="grid grid-cols-12 gap-12">
                        
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="col-span-12 p-8 bg-rose-500/10 border border-rose-500/20 rounded-[32px] flex items-center gap-6"
                            >
                                <div className="p-4 bg-rose-500/20 rounded-2xl text-rose-400">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-rose-400 uppercase tracking-widest">ПОМИЛКА_СИСТЕМИ</p>
                                    <p className="text-slate-400 font-medium italic">{error}</p>
                                </div>
                            </motion.div>
                        )}
                        
                        <div className={cn(
                            "transition-all duration-700 ease-in-out",
                            selectedDataset ? 'col-span-12 lg:col-span-7' : 'col-span-12'
                        )}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {visibleDatasets.map((pkg, i) => (
                                        <motion.div
                                            key={pkg.id}
                                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ delay: i * 0.05, duration: 0.5, type: 'spring' }}
                                            onClick={() => setSelectedDataset(pkg)}
                                            className="cursor-pointer group perspective-1000"
                                        >
                                            <TacticalCard
                                                variant={selectedDataset?.id === pkg.id ? 'holographic' : 'cyber'}
                                                className={cn(
                                                    "p-10 border-white/5 group-hover:bg-slate-900/60 transition-all duration-500 h-full flex flex-col rounded-[48px] panel-3d",
                                                    selectedDataset?.id === pkg.id ? 'border-blue-500/50 bg-blue-500/5 ring-4 ring-blue-500/10' : ''
                                                )}
                                            >
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div className="flex flex-wrap gap-2">
                                                            {pkg.resources?.slice(0, 3).map((res, idx) => (
                                                                <DataBadge key={idx} format={res.format} />
                                                            ))}
                                                        {pkg.resources?.length > 3 && (
                                                            <span className="text-[9px] font-bold text-slate-400">+{pkg.resources.length - 3}</span>
                                                        )}
                                                    </div>
                                                    <div className="p-3 bg-white/5 rounded-xl text-[10px] font-mono font-bold text-slate-300 group-hover:text-blue-400 transition-colors">
                                                        {new Date(pkg.metadataModified).toLocaleDateString()}
                                                    </div>
                                                </div>

                                                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight mb-8 group-hover:translate-x-2 transition-transform duration-500 italic">
                                                    {pkg.title}
                                                </h3>

                                                <div className="mt-auto space-y-6">
                                                    <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/30 via-transparent to-transparent" />
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4 group/org">
                                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 opacity-60 group-hover/org:opacity-100 transition-opacity">
                                                                <Users size={16} className="text-slate-400 group-hover/org:text-blue-400" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase truncate max-w-[200px] group-hover:text-white transition-colors">
                                                                {pkg.organizationTitle}
                                                            </span>
                                                        </div>
                                                        <button className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-blue-600 hover:text-white">
                                                            <ArrowRight size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </TacticalCard>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                {loading && datasets.length === 0 && [...Array(4)].map((_, i) => (
                                    <div key={i} className="h-[400px] bg-slate-900/20 rounded-[48px] border border-white/5 animate-pulse" />
                                ))}

                                {!loading && visibleDatasets.length === 0 && (
                                    <div className="col-span-full rounded-[48px] border border-white/5 bg-slate-950/30 px-8 py-16 text-center">
                                        <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">
                                            {hasConfirmedData ? 'РЕЗУЛЬТАТІВ НЕ ЗНАЙДЕНО' : 'НЕМАЄ ПІДТВЕРДЖЕНИХ ДАНИХ'}
                                        </p>
                                        <p className="mt-4 max-w-2xl mx-auto text-sm leading-6 text-slate-500">
                                            {hasConfirmedData
                                                ? 'Спробуйте інший пошуковий запит або змініть категорію датасетів.'
                                                : 'Екран не підставляє локальні реєстри, якщо маршрут data.gov.ua не повернув відповіді.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    {/* Панель деталей датасету */}
                    <AnimatePresence>
                        {selectedDataset && (
                                <motion.div
                                    initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                    className="col-span-12 lg:col-span-5 relative"
                                >
                                    <TacticalCard variant="holographic" className="p-12 border-blue-500/30 h-full flex flex-col sticky top-12 rounded-[60px] bg-slate-900/80 backdrop-blur-3xl shadow-[0_0_100px_rgba(59,130,246,0.15)] overflow-hidden">
                                        <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                                            <Globe size={400} className="text-blue-500" />
                                        </div>

                                        <div className="flex justify-between items-start mb-12 relative z-10">
                                            <div className="space-y-4">
                                                <Badge className="bg-blue-500 text-white font-black text-[9px] px-4 py-1.5 uppercase tracking-widest italic rounded-lg">ПАСПОРТ_ДАТАСЕТУ</Badge>
                                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic skew-x-[-6deg]">
                                                    АНАЛІТИКА <span className="text-blue-400">РЕЄСТРУ</span>
                                                </h2>
                                            </div>
                                            <button onClick={() => setSelectedDataset(null)} className="p-4 text-slate-300 hover:text-white transition-all bg-white/5 rounded-2xl hover:bg-rose-500 shadow-xl">
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div className="space-y-12 overflow-y-auto pr-6 custom-scrollbar no-scrollbar flex-1 relative z-10">
                                            <div className="space-y-6">
                                                <h3 className="text-2xl font-black text-white uppercase italic leading-tight">{selectedDataset.title}</h3>
                                                <p className="text-base text-slate-400 leading-relaxed italic border-l-4 border-blue-500/20 pl-8">
                                                    {selectedDataset.notes || 'Опис реєстру відсутній у метаданих джерела.'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="p-8 bg-slate-950/80 rounded-[32px] border border-white/5 space-y-2 panel-3d">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ОРГАНІЗАЦІЯ_ДЖЕРЕЛО</span>
                                                    <span className="text-sm font-black text-white uppercase leading-tight">{selectedDataset.organizationTitle}</span>
                                                </div>
                                                <div className="p-8 bg-slate-950/80 rounded-[32px] border border-white/5 space-y-2 panel-3d">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ОСТАННЯ_МОДИФІКАЦІЯ</span>
                                                    <span className="text-sm font-mono text-blue-400 italic">{new Date(selectedDataset.metadataModified).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between px-2">
                                                    <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] flex items-center gap-4">
                                                        <Layers size={16} />
                                                        РЕСУРСИ_ДЛЯ_ОБРОБКИ ({selectedDataset.resources?.length || 0})
                                                    </h4>
                                                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[8px] font-black">
                                                        ПІДТВЕРДЖЕНІ_РЕСУРСИ
                                                    </Badge>
                                                </div>
                                                <div className="space-y-4">
                                                    {selectedDataset.resources?.map((res) => (
                                                        <div key={res.id} className="p-8 bg-black/40 rounded-[32px] border border-white/5 flex items-center justify-between group/res hover:border-blue-500/40 transition-all duration-300 hover:bg-blue-500/[0.02]">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-blue-400 border border-white/5 shadow-2xl group-hover/res:scale-110 transition-transform">
                                                                    <FileText size={28} />
                                                                </div>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-xs font-black text-white uppercase truncate max-w-[200px] italic">{res.name || 'РЕСУРС'}</span>
                                                                    <div className="flex items-center gap-4">
                                                                        <DataBadge format={res.format} />
                                                                        <span className="text-[9px] font-mono text-slate-400">
                                                                            {res.sizeLabel}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <a
                                                                    href={res.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-5 bg-blue-500/10 text-blue-400 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl group-hover/res:shadow-blue-500/20"
                                                                >
                                                                    <Download size={20} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 pt-12 border-t border-white/5 flex gap-6 relative z-10">
                                            {selectedDataset.resources[0]?.url && selectedDataset.resources[0].url !== '#' ? (
                                                <a
                                                    href={selectedDataset.resources[0].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 py-7 bg-blue-600 text-white font-black rounded-[32px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                                >
                                                    <ExternalLink size={24} className="group-hover:rotate-12 transition-transform" />
                                                    <span>ВІДКРИТИ РЕСУРС</span>
                                                </a>
                                            ) : (
                                                <div className="flex-1 py-7 bg-slate-900 border border-white/10 text-slate-300 font-black rounded-[32px] uppercase tracking-[0.2em] flex items-center justify-center gap-4">
                                                    <Shield size={24} />
                                                    <span>РЕСУРС НЕДОСТУПНИЙ</span>
                                                </div>
                                            )}
                                            <a
                                                href="https://data.gov.ua"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-7 bg-slate-900 border border-white/10 rounded-[32px] text-white hover:bg-white hover:text-slate-950 transition-all shadow-xl"
                                            >
                                                <ExternalLink size={24} />
                                            </a>
                                        </div>
                                    </TacticalCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .panel-3d {
                        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-12px) rotateX(1deg) rotateY(-1deg);
                        box-shadow: 0 50px 100px -20px rgba(0,0,0,0.9), 0 0 40px rgba(59,130,246,0.1);
                    }
                    .perspective-1000 {
                        perspective: 1000px;
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default DataGovView;
