import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Search,
    AlertTriangle,
    Building2,
    Users,
    Activity,
    ArrowRight,
    Loader2,
    UserCheck,
    Globe,
    FileText,
    History
} from 'lucide-react';
import { diligenceApi } from '@/features/diligence/api/diligence';
import { CompanyProfileResponse, RiskEntity } from '@/features/diligence/types';

export default function DiligencePage() {
    const [riskEntities, setRiskEntities] = useState<RiskEntity[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<RiskEntity | null>(null);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfileResponse | null>(null);
    const [loadingSidebar, setLoadingSidebar] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoadingSidebar(true);
                const entities = await diligenceApi.getRiskEntities();
                setRiskEntities(entities);
                if (entities.length > 0) {
                    handleSelectEntity(entities[0]);
                }
            } catch (error) {
                console.error('Failed to fetch risk entities:', error);
            } finally {
                setLoadingSidebar(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSelectEntity = async (entity: RiskEntity) => {
        setSelectedEntity(entity);
        try {
            setLoadingProfile(true);
            const profile = await diligenceApi.getCompanyProfile(entity.edrpou);
            setCompanyProfile(profile);
        } catch (error) {
            console.error('Failed to fetch company profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const filteredEntities = riskEntities.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.edrpou.includes(searchQuery)
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] overflow-hidden">
            {/* Sidebar: Entity List */}
            <div className="w-full lg:w-96 flex flex-col bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-white/5">
                    <h2 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        Ризикові контрагенти
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Пошук за назвою або ЄДРПОУ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {loadingSidebar ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500 opacity-50">
                            <Loader2 className="animate-spin" size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Завантаження...</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredEntities.map((entity) => (
                                <button
                                    key={entity.edrpou}
                                    onClick={() => handleSelectEntity(entity)}
                                    className={`w-full p-3 rounded-xl flex flex-col gap-1 text-left transition-all duration-300 group
                                        ${selectedEntity?.edrpou === entity.edrpou
                                            ? 'bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                            : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <span className={`text-sm font-bold truncate ${selectedEntity?.edrpou === entity.edrpou ? 'text-emerald-400' : 'text-gray-300 group-hover:text-white'}`}>
                                            {entity.name}
                                        </span>
                                        <RiskBadge level={entity.risk_level} />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                                        <span>ЄДРПОУ: {entity.edrpou}</span>
                                        <span className="font-bold text-gray-400 tracking-tighter">SCORE: {entity.risk_score}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Company Dossier */}
            <div className="flex-1 bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-y-auto custom-scrollbar shadow-2xl relative">
                <AnimatePresence mode="wait">
                    {loadingProfile ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gray-950/20 backdrop-blur-sm z-10"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 border-2 border-emerald-500/20 rounded-full" />
                                <div className="absolute inset-0 w-16 h-16 border-t-2 border-emerald-400 rounded-full animate-spin" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-1">Скупчення даних...</h3>
                                <p className="text-gray-500 text-xs">Формування компрометуючого досьє</p>
                            </div>
                        </motion.div>
                    ) : companyProfile ? (
                        <motion.div
                            key={companyProfile.edrpou}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-8 space-y-8"
                        >
                            {/* Header Section */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/5 pb-8">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                        <Building2 size={14} className="text-gray-400" />
                                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Профіль компанії</span>
                                    </div>
                                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight uppercase max-w-2xl">
                                        {companyProfile.name}
                                    </h1>
                                    <div className="flex flex-wrap gap-4 text-xs font-mono">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 uppercase tracking-tighter">ЄДРПОУ</span>
                                            <span className="text-white font-bold">{companyProfile.edrpou}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 uppercase tracking-tighter">Статус</span>
                                            <span className="text-emerald-400 font-bold uppercase">{companyProfile.status}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 uppercase tracking-tighter">Реєстрація</span>
                                            <span className="text-white font-bold">{companyProfile.registration_date || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/40 rounded-2xl border border-white/10 p-6 flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <svg className="w-24 h-24 transform -rotate-90">
                                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                            <circle
                                                cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - companyProfile.risk_score / 100)}`}
                                                className={`${companyProfile.risk_score > 70 ? 'text-red-500' : 'text-emerald-500'}`}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-2xl font-black text-white">{companyProfile.risk_score}</span>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase">RISK</span>
                                        </div>
                                    </div>
                                    <RiskBadge level={selectedEntity?.risk_level || 'low'} />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard
                                    icon={<Users className="text-blue-400" />}
                                    label="Керівництво"
                                    value={companyProfile.directors.length}
                                    suffix="осіб"
                                />
                                <StatCard
                                    icon={<AlertTriangle className="text-amber-400" />}
                                    label="Аномалії"
                                    value={companyProfile.anomalies.length}
                                    suffix="виявлено"
                                    highlight={companyProfile.anomalies.length > 0}
                                />
                                <StatCard
                                    icon={<ShieldCheck className="text-red-400" />}
                                    label="Санкції"
                                    value={companyProfile.sanctions.length}
                                    suffix="записів"
                                    highlight={companyProfile.sanctions.length > 0}
                                />
                            </div>

                            {/* Section: Sanctions & Anomalies */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                        Санкційні перевірки
                                    </h3>
                                    {companyProfile.sanctions.length > 0 ? (
                                        <div className="space-y-3">
                                            {companyProfile.sanctions.map((s, i) => (
                                                <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-red-400 text-xs font-black uppercase tracking-tight">{s.list_name}</span>
                                                        <span className="text-[10px] text-gray-500 font-mono">{s.date_added}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 leading-relaxed">{s.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <span className="text-xs text-emerald-400/70 font-bold uppercase tracking-widest">Профілактика: Санкцій не виявлено</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        Аномалії активності
                                    </h3>
                                    {companyProfile.anomalies.length > 0 ? (
                                        <div className="space-y-3">
                                            {companyProfile.anomalies.map((a, i) => (
                                                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-white text-xs font-bold uppercase">{a.type}</span>
                                                            <span className="text-[10px] text-gray-500 font-mono">{a.date_detected}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{a.description}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-amber-400 font-black font-mono">{a.score}</span>
                                                        <div className="text-[8px] text-gray-600 font-bold uppercase">Impact</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center">
                                            <Activity size={32} className="text-gray-700" />
                                            <span className="text-xs text-gray-600 font-bold uppercase tracking-widest">Аномальних патернів не знайдено</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Section: Management & Structure */}
                            <div className="space-y-6">
                                <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    Бенефіціари та Керівництво
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {companyProfile.ultimate_beneficiaries.map((p) => (
                                        <PersonCard key={p.id} person={p} role="Бенефіціар" />
                                    ))}
                                    {companyProfile.directors.map((p) => (
                                        <PersonCard key={p.id} person={p} role="Керівник" />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4 opacity-50">
                            <Building2 size={64} className="animate-pulse" />
                            <p className="text-sm font-black uppercase tracking-[0.3em]">Виберіть об'єкт для аналізу</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function RiskBadge({ level }: { level: string }) {
    const colors = {
        low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
        critical: 'bg-red-500/20 text-red-500 border-red-500/30'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${colors[level as keyof typeof colors] || colors.low}`}>
            {level}
        </span>
    );
}

function StatCard({ icon, label, value, suffix, highlight }: { icon: React.ReactNode, label: string, value: any, suffix: string, highlight?: boolean }) {
    return (
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${highlight ? 'bg-white/10 border-white/20 scale-[1.02]' : 'bg-black/20 border-white/5'}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{value}</span>
                <span className="text-[10px] text-gray-600 font-bold uppercase">{suffix}</span>
            </div>
        </div>
    );
}

function PersonCard({ person, role }: { person: any, role: string }) {
    return (
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <UserCheck size={20} />
                </div>
                <div>
                    <div className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">{role}</div>
                    <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{person.label}</div>
                </div>
            </div>
            <div className="space-y-1">
                {Object.entries(person.properties).slice(0, 2).map(([key, val]: [string, any]) => (
                    <div key={key} className="flex justify-between text-[9px] font-mono">
                        <span className="text-gray-600 uppercase">{key}</span>
                        <span className="text-gray-400 truncate max-w-[120px]">{String(val)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
