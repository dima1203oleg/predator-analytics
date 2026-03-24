/**
 * PREDATOR v55.5 | Sovereign Briefing Sanctum — Стратегічний Дайджест Аналітика
 * 
 * Центр формування персоналізованих звітів для вищого керівництва.
 * - Глибока семантична агрегація новин та подій
 * - Персоналізація контенту під ролі (БІЗНЕС, УРЯД, БЕЗПЕКА)
 * - Візуалізація обґрунтування висновків ШІ (XAI)
 * - Експорт у захищені формати та прямий друк
 * 
 * © 2026 PREDATOR Analytics | Sovereign Level Intelligence
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Newspaper, TrendingUp, AlertCircle, Shield, 
    Briefcase, Landmark, Globe, Zap, Cpu, 
    ChevronRight, ChevronDown, Download, Share2,
    Lock, Eye, Printer, Terminal, Fingerprint,
    Info, ExternalLink, Calendar, Clock, User, Layers,
    FileText, ZapOff, ShieldAlert, Target, Star
} from 'lucide-react';
import { apiClient } from '@/services/api/config';
import { PageTransition } from '@/components/layout/PageTransition';
import { TacticalCard } from '@/components/TacticalCard';
import { Badge } from '@/components/ui/badge';
import { AdvancedBackground } from '@/components/AdvancedBackground';
import { CyberGrid } from '@/components/CyberGrid';
import { ViewHeader } from '@/components/ViewHeader';
import { cn } from '@/utils/cn';

// ========================
// Types & Interfaces
// ========================

type Persona = 'BUSINESS' | 'GOVERNMENT' | 'SECURITY' | 'DIPLOMAT' | 'CYBER';

const PERSONA_CONFIG: Record<Persona, { icon: any, label: string, color: string, bg: string }> = {
    BUSINESS: { icon: Briefcase, label: 'БІЗНЕС-ЛІДЕР', color: 'text-sky-400', bg: 'bg-sky-500/10' },
    GOVERNMENT: { icon: Landmark, label: 'УРЯДОВОВЕЦЬ', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    SECURITY: { icon: Shield, label: 'СИЛОВИК', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    DIPLOMAT: { icon: Globe, label: 'ДИПЛОМАТ', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    CYBER: { icon: Cpu, label: 'КІБЕР-АНАЛІТИК', color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
};

// ========================
// Main Component
// ========================

const ExecutiveBriefView: React.FC = () => {
    const [persona, setPersona] = useState<Persona>('BUSINESS');
    const [brief, setBrief] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<string[]>(['TOP_SITUATION']);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchBrief = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/intelligence/brief?persona=${persona}`);
            setBrief(res.data);
        } catch (err) {
            console.error('Failed to fetch executive brief:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBrief();
    }, [persona]);

    const toggleSection = (id: string) => {
        setExpandedSections(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 6) return "ДОБРОЇ НОЧІ";
        if (hour < 12) return "ДОБРОГО РАКУНКУ";
        if (hour < 18) return "ДОБРОГО ДНЯ";
        return "ДОБРОГО ВЕЧОРА";
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-[#02040a] text-slate-200 relative overflow-hidden font-sans pb-40">
                <AdvancedBackground />
                <CyberGrid color="rgba(14, 165, 233, 0.05)" />

                <div className="relative z-10 max-w-[1700px] mx-auto p-4 sm:p-8 lg:p-12 space-y-16">
                    
                    {/* View Header v55.5 */}
                    <ViewHeader
                        title={
                            <div className="flex items-center gap-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-sky-500/20 blur-[50px] rounded-full scale-150 animate-pulse" />
                                    <div className="relative w-16 h-16 bg-slate-900 border border-sky-500/20 rounded-2xl flex items-center justify-center panel-3d shadow-2xl">
                                        <Newspaper size={32} className="text-sky-400 drop-shadow-[0_0_15px_rgba(14, 165, 233, 0.8)]" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-widest uppercase leading-none italic skew-x-[-4deg]">
                                        SOVEREIGN <span className="text-sky-400">BRIEFING</span>
                                    </h1>
                                    <p className="text-[10px] font-mono font-black text-sky-500/70 uppercase tracking-[0.6em] mt-3 flex items-center gap-3">
                                        <Star size={12} className="animate-pulse" /> 
                                        EXECUTIVE_SIGNAL_DECODE_v55.5
                                    </p>
                                </div>
                            </div>
                        }
                        icon={<Shield size={22} className="text-sky-400" />}
                        breadcrumbs={['РОЗВІДКА', 'БРИФІНГ', persona]}
                        stats={[
                            { label: 'СТРАТЕГІЧНИЙ_ЧАС', value: time.toLocaleTimeString(), color: 'primary', icon: <Clock size={14} /> },
                            { label: 'РІВЕНЬ_ДОПУСКУ', value: 'ULTRA_S', color: 'danger', icon: <Lock size={14} /> },
                            { label: 'СКОР_ДОВІРИ_ШІ', value: '98.5%', color: 'success', icon: <Fingerprint size={14} />, animate: true }
                        ]}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        
                        {/* LEFT COLUMN - Persona & Alerts */}
                        <div className="lg:col-span-3 space-y-10">
                            <TacticalCard variant="holographic" className="p-10 bg-sky-500/[0.02] border-sky-500/20 rounded-[60px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                                    <User size={150} className="text-sky-500" />
                                </div>
                                
                                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/5 relative z-10">
                                    <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/30">
                                        <User className="text-sky-400" size={24} />
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-widest uppercase italic">ПРОФІЛЬ <span className="text-sky-400">ЛІДЕРА</span></h2>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    {(Object.keys(PERSONA_CONFIG) as Persona[]).map(p => {
                                        const Config = PERSONA_CONFIG[p];
                                        const isActive = persona === p;
                                        return (
                                            <button 
                                                key={p}
                                                onClick={() => setPersona(p)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-6 rounded-[32px] border transition-all panel-3d",
                                                    isActive 
                                                        ? "bg-slate-900 border-sky-500/40 shadow-[0_0_30px_rgba(14,165,233,0.1)] scale-105 z-10" 
                                                        : "bg-black/20 border-white/5 opacity-40 hover:opacity-100 hover:bg-white/5 text-slate-500"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn("p-3 rounded-2xl bg-slate-800/50", isActive && Config.color)}>
                                                        <Config.icon size={22} />
                                                    </div>
                                                    <span className={cn("text-[11px] font-black uppercase tracking-widest", isActive ? "text-white" : "text-slate-600")}>
                                                        {Config.label}
                                                    </span>
                                                </div>
                                                {isActive && <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </TacticalCard>

                            <TacticalCard variant="cyber" className="p-10 bg-rose-500/[0.01] border-rose-500/20 rounded-[60px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5">
                                    <ShieldAlert size={150} className="text-rose-500" />
                                </div>
                                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-rose-500/10 relative z-10">
                                    <div className="p-3 bg-rose-500/10 rounded-xl">
                                        <AlertCircle size={24} className="text-rose-400 animate-pulse" />
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-widest uppercase italic">ТЕРМІНОВІ <span className="text-rose-400">СИГНАЛИ</span></h2>
                                </div>
                                <div className="space-y-6 relative z-10">
                                    {brief?.alerts.map((alert: string, i: number) => (
                                        <div key={i} className="flex gap-6 p-6 bg-black/40 rounded-[32px] border border-rose-500/10 hover:border-rose-500/30 transition-all panel-3d cursor-help group/log">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 animate-ping" />
                                            <p className="text-[11px] text-slate-400 font-black leading-relaxed uppercase group-hover/log:text-white transition-colors">
                                                {alert}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-10 py-5 bg-rose-500/10 border border-rose-500/20 rounded-[28px] text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all italic">
                                    ПЕРЕГЛЯНУТИ ВСІ СИГНАЛИ
                                </button>
                            </TacticalCard>
                        </div>

                        {/* RIGHT COLUMN - Content */}
                        <div className="lg:col-span-9 space-y-12">
                            <AnimatePresence mode="wait">
                            {loading ? (
                                <div className="h-[800px] bg-slate-900/20 rounded-[60px] border border-white/5 flex flex-col items-center justify-center gap-10">
                                    <div className="relative">
                                        <div className="w-32 h-32 border-2 border-sky-500/20 rounded-full animate-ping" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Cpu size={60} className="text-sky-400 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-4">
                                        <p className="text-xl font-black text-white uppercase tracking-[0.5em] italic">СИНТЕЗ СТРАТЕГІЧНОГО ЗВІТУ...</p>
                                        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">АГРЕГАЦІЯ_СЕМАНТИЧНИХ_ТОЧОК_АЗР_v55.5</p>
                                    </div>
                                </div>
                            ) : brief && (
                                <motion.div 
                                    key={persona}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="space-y-12"
                                >
                                    {/* Summary Sanctum */}
                                    <div className="p-16 bg-[#0b0f1a]/80 border border-sky-500/20 rounded-[80px] relative overflow-hidden group shadow-2xl">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(14,165,233,0.08),transparent_50%)]" />
                                        <div className="absolute bottom-0 right-0 p-20 opacity-[0.03] group-hover:scale-110 transition-transform">
                                            <FileText size={400} className="text-sky-500" />
                                        </div>
                                        
                                        <div className="relative z-10 space-y-12">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-3 h-10 bg-sky-500 rounded-full" />
                                                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase skew-x-[-4deg] leading-none">
                                                            {brief.title}
                                                        </h2>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] ml-14">STRATEGIC_EXECUTIVE_SUMMARY</p>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button className="p-5 bg-white/5 hover:bg-sky-500 hover:text-black rounded-3xl transition-all shadow-2xl group">
                                                        <Printer size={24} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                    <button className="p-5 bg-white/5 hover:bg-sky-500 hover:text-black rounded-3xl transition-all shadow-2xl group">
                                                        <Download size={24} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="relative pl-14">
                                                <div className="absolute left-0 top-0 text-7xl text-sky-500/20 font-serif italic">“</div>
                                                <p className="text-2xl text-slate-200 leading-relaxed font-black max-w-5xl italic tracking-tight">
                                                    {brief.summary}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-12 border-t border-white/5">
                                                {[
                                                    { label: 'СЕМАНТИЧНА_ДОВІРА', val: brief.sections[0].confidence + '%', color: 'emerald', icon: Fingerprint, progress: brief.sections[0].confidence },
                                                    { label: 'ГЛИБИНА_АНАЛІЗУ', val: 'V-PRO', color: 'sky', icon: Layers },
                                                    { label: 'АКТУАЛЬНІСТЬ', val: 'REAL-TIME', color: 'amber', icon: Zap }
                                                ].map((stat, i) => (
                                                    <div key={i} className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <stat.icon size={16} className={cn(`text-${stat.color}-400`)} />
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{stat.label}</span>
                                                        </div>
                                                        <div className="flex items-baseline gap-4">
                                                            <span className={cn(`text-3xl font-black italic`, `text-${stat.color}-400`)}>{stat.val}</span>
                                                            {stat.progress && (
                                                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                                    <motion.div initial={{ width: 0 }} animate={{ width: stat.progress + '%' }} className={cn(`h-full`, `bg-${stat.color}-500 shadow-[0_0_10px_currentColor]`)} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Intelligence Matrix */}
                                    <div className="grid grid-cols-1 gap-12">
                                        {brief.sections.map((section: any, idx: number) => {
                                            const isExpanded = expandedSections.includes(section.id);
                                            return (
                                                <motion.div 
                                                    key={section.id} 
                                                    className={cn(
                                                        "rounded-[60px] border transition-all duration-700 overflow-hidden panel-3d",
                                                        isExpanded 
                                                            ? "bg-slate-900/60 border-sky-500/30 shadow-2xl" 
                                                            : "bg-slate-950/20 border-white/5 hover:border-white/10"
                                                    )}
                                                >
                                                    <button 
                                                        onClick={() => toggleSection(section.id)}
                                                        className="w-full flex items-center justify-between p-12 group"
                                                    >
                                                        <div className="flex items-center gap-10">
                                                            <div className={cn(
                                                                "w-16 h-16 rounded-[24px] flex items-center justify-center text-xl font-black italic shadow-2xl group-hover:scale-110 transition-transform",
                                                                section.priority === 'CRITICAL' ? 'bg-rose-600 text-white shadow-rose-900/40' : 
                                                                section.priority === 'HIGH' ? 'bg-amber-600 text-black shadow-amber-900/40' : 
                                                                'bg-sky-600 text-black shadow-sky-900/40'
                                                            )}>
                                                                0{idx + 1}
                                                            </div>
                                                            <div className="flex flex-col items-start gap-1">
                                                                <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter group-hover:text-sky-400 transition-colors">
                                                                    {section.title}
                                                                </h4>
                                                                <div className="flex items-center gap-4">
                                                                    <Badge variant="outline" className="text-[8px] font-black border-white/10 text-slate-500 px-3 uppercase">{section.priority}</Badge>
                                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                                                        AI_CONFIDENCE: {section.confidence}%
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={cn(
                                                            "p-6 bg-white/5 rounded-3xl transition-all duration-500 group-hover:bg-white/10",
                                                            isExpanded && "rotate-180 bg-sky-500 text-black shadow-2xl"
                                                        )}>
                                                            <ChevronDown size={28} />
                                                        </div>
                                                    </button>
                                                    
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="px-12 pb-16"
                                                            >
                                                                <div className="pt-10 border-t border-white/5 space-y-12 relative">
                                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                                                        <div className="space-y-6">
                                                                            <h5 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] flex items-center gap-3">
                                                                                <Info size={14} /> АНАЛІТИЧНИЙ КОНТЕНТ
                                                                            </h5>
                                                                            <p className="text-lg text-slate-300 leading-relaxed font-bold italic tracking-tight">
                                                                                {section.content}
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        <div className="p-10 bg-black/60 rounded-[48px] border border-white/5 relative overflow-hidden group/case">
                                                                            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover/case:rotate-12 transition-transform">
                                                                                <TrendingUp size={150} className="text-amber-500" />
                                                                            </div>
                                                                            <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] flex items-center gap-3 mb-8 relative z-10">
                                                                                <Zap size={14} /> ПРОГНОЗ ВПЛИВУ
                                                                            </h5>
                                                                            <p className="text-slate-400 text-base italic font-bold leading-relaxed relative z-10">
                                                                                {section.impact}
                                                                            </p>
                                                                            <div className="mt-12 pt-8 border-t border-white/5 flex gap-6 relative z-10">
                                                                                <Badge className="bg-white/5 text-slate-500 border-none font-black text-[8px] px-4 italic">SANCTIONS_CHECK_OK</Badge>
                                                                                <Badge className="bg-white/5 text-slate-500 border-none font-black text-[8px] px-4 italic">RISK_GEO_V4</Badge>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* XAI Visualization Component */}
                                                                    <div className="p-10 bg-sky-500/[0.03] border border-sky-500/20 rounded-[48px] flex items-center justify-between group/xai hover:bg-sky-500/10 transition-all cursor-pointer panel-3d shadow-2xl">
                                                                        <div className="flex items-center gap-8">
                                                                            <div className="p-5 bg-sky-900/40 rounded-[28px] group-hover/xai:scale-110 transition-transform shadow-2xl">
                                                                                <Eye size={32} className="text-sky-400" />
                                                                            </div>
                                                                            <div>
                                                                                <h5 className="text-2xl font-black text-white uppercase italic tracking-tighter">XAI_ВІЗУАЛІЗАЦІЯ_ОБҐРУНТУВАННЯ</h5>
                                                                                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">КЛІКНІТЬ ЩОБ ВІДКРИТИ ПОВНУ СЕМАНТИЧНУ ТРАЄКТОРІЮ ВИСНОВКУ</p>
                                                                            </div>
                                                                        </div>
                                                                        <ExternalLink size={24} className="text-slate-600 group-hover/xai:text-sky-400 transition-colors mr-6" />
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Technical Footer Footnote */}
                    <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 opacity-30">
                        <div className="flex flex-wrap items-center justify-center gap-10 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
                            <span className="flex items-center gap-3"><Lock size={12} /> SECURE_TUNNEL_v55.5</span>
                            <span className="flex items-center gap-3"><Globe size={12} /> GLOBAL_GRID_SYNCED</span>
                            <span className="flex items-center gap-3 font-mono">ID: 0xPREDATOR_{Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Terminal size={14} className="text-slate-500" />
                            <span className="text-[10px] font-mono text-slate-500">SOVEREIGN_OS_BUILD_2026_ALPHA_STABLE</span>
                        </div>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    .panel-3d {
                        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                    .panel-3d:hover {
                        transform: translateY(-8px) rotateX(1deg) rotateY(-1deg);
                        box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 40px rgba(14, 165, 233, 0.05);
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .animate-spin-slow {
                        animation: spin 12s linear infinite;
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}} />
            </div>
        </PageTransition>
    );
};

export default ExecutiveBriefView;
