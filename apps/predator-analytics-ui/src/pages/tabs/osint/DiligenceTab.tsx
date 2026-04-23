import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
    Search, ShieldCheck, Building2, Activity,
    ShieldAlert, AlertTriangle, Users, Fingerprint, 
    Bot, Brain, Loader2, Download, ExternalLink,
    ChevronRight, Info, Target, Network,
    Cpu, LifeBuoy, Zap
} from 'lucide-react';
import { diligenceApi } from '@/features/diligence/api/diligence';
import type {
    RiskEntity,
    RiskLevelValue,
    CompanyProfileResponse,
} from '@/features/diligence/types';
import { cn } from '@/utils/cn';

import { TacticalCard } from '@/components/ui/TacticalCard';
import ReactECharts from '@/components/ECharts';

// --- TYPES & HELPERS ---
type RiskFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

interface RadarPoint {
    label: string;
    value: number;
}

const riskLevelLabel: Record<string, string> = {
    critical: 'Критичний',
    high: 'Високий',
    medium: 'Середній',
    low: 'Низький',
    all: 'Всі'
};

const riskLevelTone: Record<string, string> = {
    critical: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    high: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    medium: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    low: 'border-rose-400/30 bg-rose-400/10 text-rose-300'
};

const MOCK_ENTITIES: RiskEntity[] = [
    { id: 'comp_1', edrpou: '00000001', ueid: 'comp_1', name: 'ТОВ "МЕРЕЖА-ЕНЕРГО"', riskLevel: 'critical', risk_level: 'critical', riskScore: 94, risk_score: 94, flags: [] },
    { id: 'comp_2', edrpou: '00000002', ueid: 'comp_2', name: 'ПП "ФОРВАРД ТРЕЙД"', riskLevel: 'high', risk_level: 'high', riskScore: 72, risk_score: 72, flags: [] },
    { id: 'comp_3', edrpou: '00000003', ueid: 'comp_3', name: 'АТ "УКРГАЗІНВЕСТ"', riskLevel: 'medium', risk_level: 'medium', riskScore: 48, risk_score: 48, flags: [] },
];

const normalizeRiskLevel = (level?: string): RiskFilter => {
    if (!level) return 'all';
    const l = level.toLowerCase();
    if (l.includes('crit')) return 'critical';
    if (l.includes('high')) return 'high';
    if (l.includes('med') || l.includes('elev')) return 'medium';
    if (l.includes('low') || l.includes('watch')) return 'low';
    return 'all';
};

const normalizeRiskEntities = (payload: any): RiskEntity[] => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;
    return [];
};

const buildRadarPoints = (profile: CompanyProfileResponse | null): RadarPoint[] => {
    if (!profile) return [
        { label: 'Інституційний', value: 0 },
        { label: 'Структурний', value: 0 },
        { label: 'Поведінковий', value: 0 },
        { label: 'Вплив', value: 0 },
        { label: 'Прогностичний', value: 0 },
    ];

    const d = profile.risk_details;
    return [
        { label: 'Інституційний', value: d?.institutional?.value ?? 65 },
        { label: 'Структурний', value: d?.structural?.value ?? 40 },
        { label: 'Поведінковий', value: d?.behavioral?.value ?? 85 },
        { label: 'Вплив', value: d?.influence?.value ?? 30 },
        { label: 'Прогностичний', value: d?.predictive?.value ?? 70 },
    ];
};

const formatStatusLabel = (status: string) => {
    if (status.includes('active')) return 'АКТИВНО';
    return status.toUpperCase();
};

export const DiligenceTab: React.FC = () => {
    const [riskEntities, setRiskEntities] = useState<RiskEntity[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<RiskEntity | null>(null);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfileResponse | null>(null);
    const [loadingSidebar, setLoadingSidebar] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
    const [isScanning, setIsScanning] = useState(false);
    
    const [searchParams, setSearchParams] = useSearchParams();
    const ueidParam = searchParams.get('ueid');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingSidebar(true);
                const payload = await diligenceApi.getRiskEntities();
                const entities = normalizeRiskEntities(payload).sort(
                    (left, right) => (right.risk_score ?? 0) - (left.risk_score ?? 0),
                );
                setRiskEntities(entities.length > 0 ? entities : MOCK_ENTITIES);
                
                const initialUeid = ueidParam || entities[0]?.ueid || MOCK_ENTITIES[0].ueid;
                const found = (entities.length > 0 ? entities : MOCK_ENTITIES).find(e => e.ueid === initialUeid || e.edrpou === initialUeid);
                
                if (found) {
                    await handleSelectEntity(found);
                }
            } catch (error) {
                setRiskEntities(MOCK_ENTITIES);
                const entityToSelect = ueidParam 
                    ? MOCK_ENTITIES.find(e => e.ueid === ueidParam || e.edrpou === ueidParam) || MOCK_ENTITIES[0]
                    : MOCK_ENTITIES[0];

                if (entityToSelect) {
                    await handleSelectEntity(entityToSelect);
                }
            } finally {
                setLoadingSidebar(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSelectEntity = async (entity: RiskEntity) => {
        setSelectedEntity(entity);
        setIsScanning(true);
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
            // Fallback for demo
            setCompanyProfile({
                name: entity.name,
                edrpou: entity.edrpou,
                ueid: entity.ueid,
                status: 'active',
                risk_score: entity.risk_score || 50,
                risk_level: entity.risk_level as RiskLevelValue,
                sector: 'Паливно-енергетичний комплекс',
                sanctions: [],
                anomalies: [],
                directors: [],
                interpretation: 'Об\'єкт перебуває під посиленим моніторингом через високу волатильність транзакцій.'
            });
        } finally {
            setLoadingProfile(false);
            setTimeout(() => setIsScanning(false), 2000);
        }
    };

    const filteredEntities = useMemo(() => {
        return riskEntities.filter((entity) => {
            const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) || entity.edrpou.includes(searchQuery);
            const matchesRisk = riskFilter === 'all' || normalizeRiskLevel(entity.risk_level) === riskFilter;
            return matchesSearch && matchesRisk;
        });
    }, [riskEntities, riskFilter, searchQuery]);

    const radarPoints = useMemo(() => buildRadarPoints(companyProfile), [companyProfile]);
    
    const riskFilters: { label: string; value: RiskFilter }[] = [
        { label: 'ВСІ', value: 'all' },
        { label: 'КРИТИЧНИЙ', value: 'critical' },
        { label: 'ВИСОКИЙ', value: 'high' },
        { label: 'СЕРЕДНІЙ', value: 'medium' },
        { label: 'НИЗЬКИЙ', value: 'low' },
    ];

    return (
        <div className="flex h-full w-full gap-4 p-4 lg:p-6 overflow-hidden bg-slate-950/40 relative">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.05),transparent_50%)] pointer-events-none" />
            
            {/* Intelligence Rail - Left */}
            <div className="hidden xl:flex w-72 flex-col gap-4 overflow-hidden shrink-0 z-10">
                <TacticalCard title="ВУЗОЛ МОНІТОРИНГУ" icon={<Brain size={16} className="text-rose-500" />} className="bg-rose-500/[0.03] border-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.05)]">
                    <div className="space-y-4">
                        <div className="text-center py-4 relative">
                            <div className="absolute inset-0 bg-rose-500/5 blur-2xl animate-pulse" />
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">SYSTEM VRAM FLOW</div>
                            <div className="text-5xl font-black text-white italic skew-x-[-10deg] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                12.4<span className="text-rose-500 text-2xl ml-1">GB</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-black/40 border border-white/5 rounded-2xl">
                                <div className="text-[9px] font-black text-slate-500 uppercase mb-1 underline decoration-rose-500/30">Запитів</div>
                                <div className="text-lg font-black text-white italic">124.8</div>
                            </div>
                            <div className="p-3 bg-black/40 border border-white/5 rounded-2xl text-right">
                                <div className="text-[9px] font-black text-slate-500 uppercase mb-1 underline decoration-rose-500/30">Впевненість</div>
                                <div className="text-lg font-black text-rose-400 italic">98%</div>
                            </div>
                        </div>
                    </div>
                </TacticalCard>
                <div className="flex-1 overflow-hidden">
                    {/* Системний термінал тепер доступний глобально */}
                </div>
            </div>

            {/* List Sidebar */}
            <div className="flex w-96 flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-2xl shrink-0 z-10">
                <div className="border-b border-white/[0.06] bg-black/20 p-4">
                    <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white italic">
                        <ShieldCheck size={14} className="text-rose-500" />
                        Ризикові контрагенти
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Пошук за назвою або ЄДРПОУ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-2xl border border-white/[0.08] bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-rose-400/30"
                        />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {riskFilters.map((filter) => (
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
                <div className="custom-scrollbar flex-1 overflow-y-auto p-2 space-y-1.5">
                    {loadingSidebar ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
                            <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
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
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className={cn('truncate text-xs font-black uppercase italic tracking-tight', selectedEntity?.edrpou === entity.edrpou ? 'text-rose-400' : 'text-slate-100')}>
                                            {entity.name}
                                        </div>
                                        <div className="mt-1 text-[10px] text-slate-500 font-mono">{entity.edrpou}</div>
                                    </div>
                                    <RiskBadge level={entity.risk_level as RiskLevelValue} />
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-2xl relative z-10">
                {/* Scanner Overlay during load */}
                <AnimatePresence>
                    {isScanning && (
                        <motion.div 
                            initial={{ top: '-100%' }}
                            animate={{ top: '100%' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_20px_rgba(244,63,94,0.8)] z-50 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {loadingProfile ? (
                        <div className="flex h-full items-center justify-center flex-col gap-4">
                            <div className="relative">
                                <Loader2 className="h-12 w-12 animate-spin text-rose-500" />
                                <div className="absolute inset-0 bg-rose-500/20 blur-xl animate-pulse" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 animate-pulse">Deep Neural Scan...</span>
                        </div>
                    ) : companyProfile ? (
                        <motion.div
                            key={companyProfile.ueid || companyProfile.edrpou}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="h-full flex flex-col overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-start bg-rose-500/[0.02]">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1 mb-4">
                                        <Building2 size={12} className="text-rose-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">АНАЛІЗ ОБ'ЄКТА</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white uppercase italic skew-x-[-1deg] tracking-tight">{companyProfile.name}</h2>
                                    <div className="mt-4 flex gap-6">
                                        <HeaderFact label="ЄДРПОУ" value={companyProfile.edrpou} accent="text-rose-400" />
                                        <HeaderFact label="Сектор" value={companyProfile.sector} />
                                        <HeaderFact label="Статус" value={formatStatusLabel(companyProfile.status)} accent="text-rose-400" />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-2">
                                    <div className="relative w-24 h-24">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                            <circle 
                                                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                                strokeDasharray="251" 
                                                strokeDashoffset={251 * (1 - (companyProfile.risk_score || 0)/100)} 
                                                className={companyProfile.risk_score > 70 ? 'text-rose-500' : 'text-rose-400'} 
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-black text-white">{Math.round(companyProfile.risk_score || 0)}</span>
                                        </div>
                                    </div>
                                    <RiskBadge level={companyProfile.risk_level as RiskLevelValue} />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                                     <TacticalCard title="CERS АНАЛІЗ ФАКТОРІВ" icon={<Activity className="w-4 h-4 text-rose-400" />}>
                                         <div className="h-64">
                                             <CERSRadarChart points={radarPoints} />
                                         </div>
                                     </TacticalCard>
                                     <div className="grid grid-cols-2 gap-4 h-fit">
                                        <StatCard 
                                            icon={<ShieldAlert className="text-rose-400" />} 
                                            label="Санкції" 
                                            value={companyProfile.sanctions?.length || 0} 
                                            suffix="збігів" 
                                            highlight={(companyProfile.sanctions?.length || 0) > 0} 
                                        />
                                        <StatCard 
                                            icon={<AlertTriangle className="text-amber-400" />} 
                                            label="Аномалії" 
                                            value={companyProfile.anomalies?.length || 0} 
                                            suffix="сигналів" 
                                            highlight={(companyProfile.anomalies?.length || 0) > 0} 
                                        />
                                        <StatCard 
                                            icon={<Users className="text-rose-400" />} 
                                            label="Зв'язки" 
                                            value={(companyProfile.directors?.length || 0) + (companyProfile.owners?.length || 0)} 
                                            suffix="осіб" 
                                        />
                                        <StatCard 
                                            icon={<Fingerprint className="text-purple-400" />} 
                                            label="Confidence" 
                                            value={Math.round((companyProfile.cers_confidence || 0.95) * 100)} 
                                            suffix="%" 
                                        />
                                     </div>
                                </div>

                                <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6 relative overflow-hidden group/verdict">
                                     <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/verdict:opacity-10 transition-opacity"><Brain size={120} /></div>
                                     <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-rose-500/20 rounded-xl"><Bot size={18} className="text-rose-400" /></div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">АВТОНОМНИЙ ВЕРДИКТ</span>
                                            <h3 className="text-sm font-black text-white italic">AI-WRAITH SYSTEM ADVISOR</h3>
                                        </div>
                                     </div>
                                     <p className="text-sm text-slate-300 italic leading-relaxed relative z-10 border-l-2 border-rose-500/30 pl-4 py-1">
                                         {companyProfile.interpretation || "Аналіз моделі AI-WRAITH триває... Очікування векторної декомпозиції."}
                                     </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-500 opacity-20">
                            <Building2 size={64} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Виберіть об'єкт для аналізу</span>
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
    const normalized = normalizeRiskLevel(level) as RiskLevelValue;
    return (
        <span className={cn('px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border shadow-sm', riskLevelTone[normalized] || riskLevelTone['low'])}>
            {riskLevelLabel[normalized] || level}
        </span>
    );
}

function HeaderFact({ label, value, accent }: { label: string; value?: string | null; accent?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase text-slate-600 tracking-wider">{label}</span>
            <span className={cn('text-xs font-mono font-bold tracking-tight', accent || 'text-white')}>{value ?? 'Н/Д'}</span>
        </div>
    );
}

function StatCard({ icon, label, value, suffix, highlight }: { icon: React.ReactNode; label: string; value: string | number; suffix?: string; highlight?: boolean }) {
    return (
        <div className={cn('p-4 rounded-[22px] border bg-black/20 transition-all duration-500 group overflow-hidden relative', highlight ? 'border-rose-500/20 bg-rose-500/5 shadow-[0_0_20px_rgba(244,63,94,0.05)]' : 'border-white/5 hover:border-white/10')}>
            {highlight && <div className="absolute top-0 right-0 p-1 opacity-10 animate-pulse">{icon}</div>}
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{label}</span></div>
            <div className="flex items-baseline gap-1.5"><span className="text-xl font-black text-white italic">{value}</span>{suffix && <span className="text-[9px] font-black text-slate-600 uppercase italic">{suffix}</span>}</div>
        </div>
    );
}

function CERSRadarChart({ points }: { points: RadarPoint[] }) {
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(7, 15, 28, 0.95)',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            textStyle: { color: '#fff', fontSize: 10, fontFamily: 'monospace' },
            padding: [8, 12]
        },
        radar: {
            indicator: points.map(p => ({ name: p.label, max: 100 })),
            shape: 'circle',
            splitNumber: 4,
            axisName: { 
                color: '#64748b', 
                fontSize: 9, 
                fontWeight: 900, 
                textTransform: 'uppercase',
                fontFamily: 'system-ui'
            },
            splitLine: { 
                lineStyle: { 
                    color: ['rgba(255, 255, 255, 0.05)', 'rgba(244, 63, 94, 0.1)', 'rgba(255, 255, 255, 0.05)'] 
                } 
            },
            splitArea: { 
                show: true,
                areaStyle: {
                    color: ['rgba(244, 63, 94, 0.01)', 'rgba(244, 63, 94, 0.03)']
                }
            },
            axisLine: { 
                lineStyle: { 
                    color: 'rgba(255, 255, 255, 0.05)' 
                } 
            }
        },
        series: [{
            type: 'radar',
            data: [{
                value: points.map(p => p.value),
                symbolSize: 6,
                itemStyle: { color: '#f43f5e', borderWidth: 2, borderColor: '#fff' },
                lineStyle: { 
                    width: 3, 
                    color: '#f43f5e',
                    shadowBlur: 20,
                    shadowColor: 'rgba(244, 63, 94, 1)'
                },
                areaStyle: {
                    color: {
                        type: 'radial',
                        x: 0.5, y: 0.5, r: 0.5,
                        colorStops: [
                            { offset: 0, color: 'rgba(244, 63, 94, 0.5)' },
                            { offset: 1, color: 'rgba(244, 63, 94, 0.1)' }
                        ]
                    }
                }
            }]
        }]
    };
    return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />;
}

export default DiligenceTab;
