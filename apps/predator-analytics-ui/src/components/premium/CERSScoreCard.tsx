import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, Activity, Target, RefreshCw, Layers, AlertTriangle } from 'lucide-react';
import { TacticalCard } from '@/components/TacticalCard';
import { diligenceApi } from '@/features/diligence/api/diligence';
import { CERSCompany, CERSScoreSegment } from '@/types';
import { cn } from '@/lib/utils';

interface CERSScoreCardProps {
    edrpou: string;
    className?: string;
}

export const CERSScoreCard: React.FC<CERSScoreCardProps> = ({ edrpou, className }) => {
    const [company, setCompany] = useState<CERSCompany | null>(null);
    const [scoreData, setScoreData] = useState<{ totalScore: number; segments: CERSScoreSegment[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCERSData = async () => {
        if (!edrpou) return;
        setIsLoading(true);
        setError(null);
        try {
            const companyProfile = await diligenceApi.getCompanyProfile(edrpou);
            const riskScores = await diligenceApi.getRiskScores([edrpou]);
            
            // Map CompanyProfileResponse to CERSCompany
            // Note: address and director might not be directly on CompanyProfileResponse 
            // from the types, so we handle them safely.
            const mappedCompany: CERSCompany = {
                edrpou: companyProfile.edrpou || edrpou,
                name: companyProfile.name || 'Компанія не знайдена',
                type: 'Юридична особа',
                status: companyProfile.status || 'НЕВИЗНАЧЕНО',
                registrationDate: companyProfile.registration_date || '',
                address: (companyProfile as any).address || 'Дані про адресу відсутні',
                director: companyProfile.directors?.[0]?.label || 'Дані про керівника відсутні',
                beneficiaries: companyProfile.ultimate_beneficiaries?.map(b => b.label) || [],
                riskScore: companyProfile.risk_score || 0,
                tags: (companyProfile as any).tags || [],
                flags: (companyProfile as any).flags || []
            };

            // Map riskScores to segments
            const entityScore = riskScores[edrpou] || { score: 0, risk_vectors: [] };
            const mappedScoreDetails = {
                totalScore: entityScore.score,
                segments: (entityScore.risk_vectors || []).map((v: any) => ({
                    name: v.name,
                    score: v.score,
                    weight: v.weight,
                    description: v.description || 'Аналіз компонента завершено',
                    status: (v.status || (v.score > 80 ? 'OK' : v.score > 50 ? 'WARNING' : 'CRITICAL')) as 'OK' | 'WARNING' | 'CRITICAL'
                }))
            };

            // Fallback if no vectors found
            if (mappedScoreDetails.segments.length === 0) {
              mappedScoreDetails.segments = [
                { name: 'Behavioral', score: entityScore.score, weight: 100, description: 'Загальний поведінковий аналіз', status: entityScore.score > 70 ? 'OK' : 'WARNING' }
              ];
            }

            setCompany(mappedCompany);
            setScoreData(mappedScoreDetails);
        } catch (err) {
            console.error('Помилка завантаження CERS:', err);
            setError('Не вдалося завантажити дані скорингу');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (edrpou) {
            fetchCERSData();
        }
    }, [edrpou]);

    const handleRecalculate = async () => {
        setIsRecalculating(true);
        try {
            await fetchCERSData();
        } finally {
            setIsRecalculating(false);
        }
    };

    if (isLoading) {
        return (
            <TacticalCard variant="holographic" className={cn("min-h-[300px] flex items-center justify-center", className)}>
                <div className="flex flex-col items-center gap-4 text-emerald-500/50">
                    <Activity size={32} className="animate-spin" />
                    <span className="text-[10px] uppercase font-black tracking-widest">Агрегація CERS-Реєстрів...</span>
                </div>
            </TacticalCard>
        );
    }

    if (error) {
        return (
            <TacticalCard variant="holographic" className={cn("min-h-[300px] flex items-center justify-center", className)}>
                <div className="flex flex-col items-center gap-4 text-red-500/50">
                    <AlertTriangle size={32} />
                    <span className="text-[10px] uppercase font-black tracking-widest">{error}</span>
                </div>
            </TacticalCard>
        );
    }

    if (!company || !scoreData) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <TacticalCard 
            title="CERS SCORECARD" 
            subtitle="Central Entity Resolution Scoring"
            icon={<Shield className="text-emerald-400" size={18} />}
            variant="holographic"
            className={className}
        >
            <div className="p-5 flex flex-col gap-6">
                {/* Header Info */}
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-black text-white hover:text-emerald-400 transition-colors cursor-pointer">
                                {company.name}
                            </h3>
                            {company.flags.includes('COURT_CASES') && (
                                <AlertTriangle size={14} className="text-amber-500" />
                            )}
                        </div>
                        <div className="flex gap-3 text-[10px] font-mono text-slate-400">
                            <span>ЄДРПОУ: <span className="text-slate-200">{company.edrpou}</span></span>
                            <span>СТАТУС: <span className="text-emerald-400">{company.status}</span></span>
                        </div>
                    </div>
                    
                    {/* Main Score Circle */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-800" />
                            <motion.circle 
                                initial={{ strokeDashoffset: 175 }}
                                animate={{ strokeDashoffset: 175 - (175 * scoreData.totalScore) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="32" cy="32" r="28" 
                                stroke="currentColor" 
                                strokeWidth="4" 
                                fill="none" 
                                strokeDasharray="175"
                                className={cn("transition-colors duration-500", getScoreColor(scoreData.totalScore))}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="text-center relative z-10 flex flex-col">
                            <span className={cn("text-lg font-black font-mono leading-none", getScoreColor(scoreData.totalScore))}>
                                {scoreData.totalScore}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                    {company.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-300 font-bold tracking-wider">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Segments Breakdown */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                            <Target size={12} /> ДЕТАЛІЗАЦІЯ ВЕКТОРІВ
                        </h4>
                        <button 
                            onClick={handleRecalculate}
                            disabled={isRecalculating}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={10} className={cn(isRecalculating && "animate-spin")} />
                            ПЕРЕРАХУНОК
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <AnimatePresence>
                            {(scoreData.segments || []).map((segment, idx) => (
                                <motion.div 
                                    key={segment.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-3 bg-slate-900/50 rounded-xl border border-white/5 flex flex-col gap-2 relative overflow-hidden group"
                                >
                                    {/* Background Progress Indicator */}
                                    <div 
                                        className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-20 group-hover:opacity-100 transition-opacity", getScoreBg(segment.score))}
                                    />
                                    
                                    <div className="flex items-center justify-between pl-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            {segment.status === 'OK' ? <ShieldCheck size={12} className="text-emerald-500" /> : 
                                             segment.status === 'WARNING' ? <ShieldAlert size={12} className="text-amber-500" /> : 
                                             <AlertTriangle size={12} className="text-red-500" />}
                                            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">{segment.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[8px] text-slate-500 font-mono">Вага: {segment.weight}%</span>
                                            <span className={cn("text-xs font-black font-mono", getScoreColor(segment.score))}>
                                                {segment.score}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="pl-6 text-[9px] text-slate-500 font-mono relative z-10">
                                        {segment.description}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </TacticalCard>
    );
};

export default CERSScoreCard;
