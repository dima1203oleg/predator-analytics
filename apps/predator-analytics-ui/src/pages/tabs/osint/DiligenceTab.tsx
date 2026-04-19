import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
// ... other imports
import { diligenceApi } from '@/features/diligence/api/diligence';
import type {
    RiskEntity,
    RiskLevelValue,
    CompanyProfileResponse,
} from '@/features/diligence/types';
import { createMetric, createRisk, createStandardContextActions } from '@/components/layout/contextRail.builders';
import { useContextRail } from '@/hooks/useContextRail';
import { cn } from '@/utils/cn';
import { VramSentinel } from '@/components/intelligence/VramSentinel';
import { LiveAgentTerminal } from '@/components/intelligence/LiveAgentTerminal';
import { TacticalCard } from '@/components/TacticalCard';
import ReactECharts from '@/components/ECharts';
import type { ContextTone } from '@/types/shell';

// --- TYPES & HELPERS ---
// ... (skipping some lines for brevity in TargetContent matching)
// ...

export const DiligenceTab: React.FC = () => {
    const [riskEntities, setRiskEntities] = useState<RiskEntity[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<RiskEntity | null>(null);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfileResponse | null>(null);
    const [loadingSidebar, setLoadingSidebar] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
    
    const [searchParams, setSearchParams] = useSearchParams();
    const ueidParam = searchParams.get('ueid');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingSidebar(true);
                const payload = await diligenceApi.getRiskEntities();
                const entities = normalizeRiskEntities(payload).sort(
                    (left, right) => (right.risk_score ?? right.riskScore ?? 0) - (left.risk_score ?? left.riskScore ?? 0),
                );
                setRiskEntities(entities);
                
                // Вибір сутності на основі параметру або першої в списку
                const entityToSelect = ueidParam 
                    ? entities.find(e => e.ueid === ueidParam || e.edrpou === ueidParam) || entities[0]
                    : entities[0];

                if (entityToSelect) {
                    await handleSelectEntity(entityToSelect);
                }
            } catch (error) {
                setRiskEntities(MOCK_ENTITIES);
                const entityToSelect = ueidParam 
                    ? MOCK_ENTITIES.find(e => e.ueid === ueidParam || e.edrpou === ueidParam) || MOCK_ENTITIES[0]
                    : MOCK_ENTITIES[0];

                if (entityToSelect) {
                    setSelectedEntity(entityToSelect);
                }
            } finally {
                setLoadingSidebar(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSelectEntity = async (entity: RiskEntity) => {
        setSelectedEntity(entity);
        // Оновлюємо URL параметр
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('ueid', entity.ueid || entity.edrpou);
            return next;
        }, { replace: true });

        try {
            setLoadingProfile(true);
            const profile = await diligenceApi.getCompanyProfile(entity.ueid ?? entity.edrpou);
            setCompanyProfile(profile);
        } catch (error) {
            setCompanyProfile(null);
        } finally {
            setLoadingProfile(false);
        }
    };

    const filteredEntities = useMemo(() => {
        return riskEntities.filter((entity) => {
            const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) || entity.edrpou.includes(searchQuery);
            const matchesRisk = riskFilter === 'all' || normalizeRiskLevel(entity.risk_level) === riskFilter;
            return matchesSearch && matchesRisk;
        });
    }, [riskEntities, riskFilter, searchQuery]);

    const sanctions = companyProfile?.sanctions ?? [];
    const anomalies = companyProfile?.anomalies ?? [];
    const directors = companyProfile?.directors ?? [];
    const beneficiaries = companyProfile?.ultimate_beneficiaries ?? [];
    const profileRiskLevel = normalizeRiskLevel(companyProfile?.risk_level ?? selectedEntity?.risk_level);
    const profileIdentifier = companyProfile?.ueid ?? companyProfile?.edrpou ?? selectedEntity?.ueid ?? selectedEntity?.edrpou;
    const radarPoints = useMemo(() => buildRadarPoints(companyProfile), [companyProfile]);
    const cersConfidence = companyProfile?.cers_confidence;

    const diligenceRailPayload = useMemo(() => {
        if (!selectedEntity && !companyProfile) return null;
        return {
            entityId: String(profileIdentifier ?? selectedEntity?.edrpou ?? 'diligence'),
            entityType: 'контрагент',
            title: companyProfile?.name ?? selectedEntity?.name ?? 'Контрагент',
            subtitle: `ЄДРПОУ ${profileIdentifier ?? 'Н/Д'} • ${riskLevelLabel[profileRiskLevel]}`,
            status: {
                label: `Ризик: ${riskLevelLabel[profileRiskLevel]}`,
                tone: (profileRiskLevel === 'critical' || profileRiskLevel === 'high' ? 'danger' : profileRiskLevel === 'elevated' || profileRiskLevel === 'watchlist' ? 'warning' : 'success') as ContextTone,
            },
            actions: createStandardContextActions({
                auditPath: '/diligence',
                documentsPath: '/documents',
                agentPath: '/agents',
            }),
            insights: [
                createMetric('risk-score', 'Ризик-скоринг', `${Math.round(companyProfile?.risk_score ?? selectedEntity?.risk_score ?? 0)}`, 'Поточна оцінка ризику', 'warning'),
                createMetric('sanctions', 'Санкційні збіги', `${sanctions.length}`, 'Записи санкційного контуру', sanctions.length > 0 ? 'danger' : 'success'),
                createMetric('confidence', 'Впевненість CERS', cersConfidence ? `${Math.round(cersConfidence * 100)}%` : 'Н/д', 'Рівень підтвердження профілю', cersConfidence ? 'info' : 'neutral'),
            ],
            sourcePath: '/osint?tab=diligence',
        };
    }, [companyProfile, selectedEntity, profileIdentifier, profileRiskLevel, sanctions.length, cersConfidence]);

    useContextRail(diligenceRailPayload);

    return (
        <div className=\"flex h-full gap-6 overflow-hidden\">
            {/* Sidebar with Stats & Feed */}
            <div className=\"w-80 flex flex-col gap-6 overflow-hidden hidden xl:flex shrink-0\">
                <VramSentinel />
                <TacticalCard title=\"МЕТРИКИ РОЗВІДКИ\" icon={<Cpu className=\"w-4 h-4 text-rose-400\" />}>
                    <div className=\"space-y-4\">
                        <div className=\"space-y-2\">
                            <div className=\"flex justify-between text-[10px] font-black uppercase text-slate-500\">
                                <span>Активні вузли</span>
                                <span className=\"text-rose-400 text-[10px]\">8/8 v58.2</span>
                            </div>
                            <div className=\"h-1 bg-slate-800 rounded-full overflow-hidden\">
                                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className=\"h-full bg-rose-500\" />
                            </div>
                        </div>
                        <div className=\"grid grid-cols-2 gap-2\">
                            <div className=\"p-3 bg-black/40 border border-white/5 rounded-2xl\">
                                <div className=\"text-[9px] font-black text-slate-500 uppercase mb-1 underline decoration-rose-500/30\">Запитів</div>
                                <div className=\"text-lg font-black text-white italic\">124.8</div>
                            </div>
                            <div className=\"p-3 bg-black/40 border border-white/5 rounded-2xl text-right\">
                                <div className=\"text-[9px] font-black text-slate-500 uppercase mb-1 underline decoration-emerald-500/30\">Впевненість</div>
                                <div className=\"text-lg font-black text-emerald-400 italic\">98%</div>
                            </div>
                        </div>
                    </div>
                </TacticalCard>
                <div className=\"flex-1 overflow-hidden\">
                    <LiveAgentTerminal />
                </div>
            </div>

            {/* List Sidebar */}
            <div className=\"flex w-96 flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-2xl shrink-0\">
                <div className=\"border-b border-white/[0.06] bg-black/20 p-4\">
                    <h2 className=\"mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white italic\">
                        <ShieldCheck size={14} className=\"text-emerald-400\" />
                        Ризикові контрагенти
                    </h2>
                    <div className=\"relative\">
                        <Search className=\"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500\" />
                        <input
                            type=\"text\"
                            placeholder=\"Пошук за назвою або ЄДРПОУ...\"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className=\"w-full rounded-2xl border border-white/[0.08] bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-rose-400/30\"
                        />
                    </div>
                    <div className=\"mt-4 flex flex-wrap gap-1.5\">
                        {riskFilters.slice(0, 5).map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setRiskFilter(filter.value)}
                                className={cn(
                                    'rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-all',
                                    riskFilter === filter.value
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                        : 'border-white/5 bg-black/20 text-slate-500 hover:text-white',
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className=\"custom-scrollbar flex-1 overflow-y-auto p-2 space-y-1.5\">
                    {loadingSidebar ? (
                        <div className=\"flex h-full flex-col items-center justify-center gap-3 text-slate-500\">
                            <Loader2 className=\"h-6 w-6 animate-spin text-rose-500\" />
                        </div>
                    ) : (
                        filteredEntities.map((entity) => (
                            <button
                                key={entity.edrpou}
                                onClick={() => handleSelectEntity(entity)}
                                className={cn(
                                    'w-full rounded-[20px] border p-4 text-left transition-all duration-300 relative overflow-hidden group',
                                    selectedEntity?.edrpou === entity.edrpou
                                        ? 'border-rose-500/30 bg-rose-500/10 ring-1 ring-rose-500/20'
                                        : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/5',
                                )}
                            >
                                <div className=\"flex items-start justify-between gap-2\">
                                    <div className=\"min-w-0\">
                                        <div className={cn('truncate text-xs font-black uppercase italic tracking-tight', selectedEntity?.edrpou === entity.edrpou ? 'text-rose-400' : 'text-slate-100')}>
                                            {entity.name}
                                        </div>
                                        <div className=\"mt-1 text-[10px] text-slate-500 font-mono\">{entity.edrpou}</div>
                                    </div>
                                    <RiskBadge level={entity.risk_level} />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Profile Content */}
            <div className=\"flex-1 overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-2xl relative\">
                <AnimatePresence mode=\"wait\">
                    {loadingProfile ? (
                        <div className=\"flex h-full items-center justify-center\"><Loader2 className=\"h-10 w-10 animate-spin text-rose-500\" /></div>
                    ) : companyProfile ? (
                        <motion.div
                            key={companyProfile.edrpou}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className=\"h-full flex flex-col overflow-hidden\"
                        >
                            <div className=\"p-8 border-b border-white/5 flex justify-between items-start\">
                                <div>
                                    <div className=\"inline-flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1 mb-4\">
                                        <Building2 size={12} className=\"text-rose-400\" />
                                        <span className=\"text-[9px] font-black uppercase tracking-widest text-rose-300 text-center\">АНАЛІЗ ОБ'ЄКТА</span>
                                    </div>
                                    <h2 className=\"text-3xl font-black text-white uppercase italic skew-x-[-1deg] tracking-tight\">{companyProfile.name}</h2>
                                    <div className=\"mt-4 flex gap-6\">
                                        <HeaderFact label=\"ЄДРПОУ\" value={companyProfile.edrpou} accent=\"text-rose-400\" />
                                        <HeaderFact label=\"Сектор\" value={companyProfile.sector} />
                                        <HeaderFact label=\"Статус\" value={formatStatusLabel(companyProfile.status)} accent=\"text-emerald-400\" />
                                    </div>
                                </div>

                                <div className=\"flex flex-col items-center gap-2\">
                                    <div className=\"relative w-24 h-24\">
                                        <svg className=\"w-full h-full -rotate-90\"><circle cx=\"48\" cy=\"48\" r=\"40\" stroke=\"currentColor\" strokeWidth=\"6\" fill=\"transparent\" className=\"text-white/5\" /><circle cx=\"48\" cy=\"48\" r=\"40\" stroke=\"currentColor\" strokeWidth=\"6\" fill=\"transparent\" strokeDasharray=\"251\" strokeDashoffset={251 * (1 - companyProfile.risk_score/100)} className={companyProfile.risk_score > 70 ? 'text-rose-500' : 'text-emerald-500'} /></svg>
                                        <div className=\"absolute inset-0 flex flex-col items-center justify-center\"><span className=\"text-2xl font-black text-white\">{Math.round(companyProfile.risk_score)}</span></div>
                                    </div>
                                    <RiskBadge level={profileRiskLevel} />
                                </div>
                            </div>

                            <div className=\"flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar\">
                                <div className=\"grid gap-6 grid-cols-1 xl:grid-cols-2\">
                                     <TacticalCard title=\"CERS АНАЛІЗ ФАКТОРІВ\" icon={<Activity className=\"w-4 h-4 text-rose-400\" />}>
                                         <div className=\"h-64\"><CERSRadarChart points={radarPoints} /></div>
                                     </TacticalCard>
                                     <div className=\"grid grid-cols-2 gap-4 h-fit\">
                                        <StatCard icon={<ShieldAlert className=\"text-rose-400\" />} label=\"Санкції\" value={sanctions.length} suffix=\"збігів\" highlight={sanctions.length > 0} />
                                        <StatCard icon={<AlertTriangle className=\"text-amber-400\" />} label=\"Аномалії\" value={anomalies.length} suffix=\"сигналів\" highlight={anomalies.length > 0} />
                                        <StatCard icon={<Users className=\"text-cyan-400\" />} label=\"Зв'язки\" value={directors.length + beneficiaries.length} suffix=\"осіб\" />
                                        <StatCard icon={<Fingerprint className=\"text-purple-400\" />} label=\"CERS Confidence\" value={Math.round((cersConfidence || 0) * 100)} suffix=\"%\" />
                                     </div>
                                </div>

                                <div className=\"bg-rose-500/5 border border-rose-500/10 rounded-2xl p-6 relative overflow-hidden\">
                                     <div className=\"absolute top-0 right-0 p-4 opacity-5\"><Brain size={120} /></div>
                                     <div className=\"flex items-center gap-3 mb-4\">
                                        <Bot size={16} className=\"text-rose-400\" />
                                        <span className=\"text-[10px] font-black uppercase tracking-widest text-white italic\">Вердикт AI</span>
                                     </div>
                                     <p className=\"text-sm text-slate-300 italic leading-relaxed\">{companyProfile.interpretation || \"Аналіз моделі AI-WRAITH...\"}</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className=\"flex h-full flex-col items-center justify-center gap-4 text-slate-500 opacity-30\">
                            <Building2 size={64} />
                            <span className=\"text-[10px] font-black uppercase tracking-widest\">Виберіть об'єкт для аналізу</span>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---
function RiskBadge({ level }: { level?: RiskLevelValue }) {
    if (!level) return null;
    return (
        <span className={cn('px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border', riskLevelTone[level])}>
            {riskLevelLabel[level]}
        </span>
    );
}

function HeaderFact({ label, value, accent }: { label: string; value?: string | null; accent?: string }) {
    return (
        <div className=\"flex flex-col gap-0.5\">
            <span className=\"text-[8px] font-black uppercase text-slate-600 tracking-wider\">{label}</span>
            <span className={cn('text-xs font-mono font-bold tracking-tight', accent || 'text-white')}>{value ?? 'Н/Д'}</span>
        </div>
    );
}

function StatCard({ icon, label, value, suffix, highlight }: { icon: React.ReactNode; label: string; value: string | number; suffix?: string; highlight?: boolean }) {
    return (
        <div className={cn('p-4 rounded-2xl border bg-black/20 transition-all group', highlight ? 'border-rose-500/20 bg-rose-500/5' : 'border-white/5 hover:border-white/10')}>
            <div className=\"flex items-center gap-2 mb-2\">{icon}<span className=\"text-[9px] font-black uppercase tracking-widest text-slate-500\">{label}</span></div>
            <div className=\"flex items-baseline gap-1.5\"><span className=\"text-xl font-black text-white italic\">{value}</span>{suffix && <span className=\"text-[9px] font-black text-slate-600 uppercase italic\">{suffix}</span>}</div>
        </div>
    );
}

function CERSRadarChart({ points }: { points: RadarPoint[] }) {
    const option = {
        backgroundColor: 'transparent',
        radar: {
            indicator: points.map(p => ({ name: p.label, max: 100 })),
            shape: 'circle',
            splitNumber: 4,
            axisName: { color: '#64748b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase' },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } },
            splitArea: { show: false },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.05)' } }
        },
        series: [{
            type: 'radar',
            data: [{
                value: points.map(p => p.value),
                symbolSize: 0,
                lineStyle: { width: 2, color: '#f43f5e' },
                areaStyle: { color: 'rgba(244, 63, 94, 0.15)' }
            }]
        }]
    };
    return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}
