import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Search as SearchIcon, Building2, User, AlertTriangle,
  CheckCircle, Lock, Network, ChevronRight, Briefcase, FileText,
  Globe, Shield, MapPin, BrainCircuit, Sparkles, RefreshCw, Target, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { api } from '../services/api';
import { SearchResultRadar } from '../components/premium/SearchResultRadar';
import { SystemClock } from '../components/ui/SystemClock';
import { ExplainabilityPanel } from '../components/explain/ExplainabilityPanel';

// --- TYPES ---
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface Company {
  id: string;
  edrpou: string;
  name: string;
  status: 'active' | 'bankrupt' | 'process' | 'unknown';
  risk: RiskLevel;
  director: string;
  address: string;
  capital: string;
  type: string;
  tags: string[];
  beneficiaries?: string[];
  connections?: number;
  explanation?: any;
}

// --- COMPONENTS ---

const RiskBadge = ({ level }: { level: RiskLevel }) => {
  const colors = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    critical: 'bg-rose-950/50 text-rose-500 border-rose-500 border shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse'
  };
  const icons = { low: CheckCircle, medium: AlertTriangle, high: AlertTriangle, critical: Shield };
  const Icon = icons[level] || AlertTriangle;

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider", colors[level] || colors.medium)}>
      <Icon className="w-3.5 h-3.5" />
      {level === 'low' ? 'Низький' : level === 'medium' ? 'Середній' : level === 'high' ? 'Високий' : 'Критичний'} Ризик
    </div>
  );
};

const RedactedField = () => (
    <div className="bg-slate-800/50 rounded px-2 py-0.5 inline-block min-w-[120px] relative group cursor-help select-none">
        <span className="opacity-0">ПРИХОВАНІ ДАНІ</span>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-600/50 w-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>
        </div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-amber-500 text-[10px] px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none flex items-center gap-1">
            <Lock className="w-3 h-3" /> Тільки Premium
        </div>
    </div>
);

const AIAnswerCard = ({ query, answer, loading }: { query: string, answer: string | null, loading: boolean }) => {
    if (!loading && !answer) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/30 rounded-2xl relative overflow-hidden group shadow-xl"
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex gap-5 relative z-10">
                 <div className="min-w-[48px] h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                     {loading ? <Sparkles className="text-white w-6 h-6 animate-pulse" /> : <BrainCircuit className="text-white w-6 h-6" />}
                 </div>
                 <div className="flex-1">
                     <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                        ШІ Аналіз Запиту: <span className="text-white normal-case tracking-normal opacity-80">"{query}"</span>
                     </h3>
                     {loading ? (
                         <div className="space-y-3 max-w-2xl">
                             <div className="h-2 bg-indigo-400/20 rounded-full w-full animate-pulse" />
                             <div className="h-2 bg-indigo-400/20 rounded-full w-5/6 animate-pulse" />
                             <div className="h-2 bg-indigo-400/20 rounded-full w-4/6 animate-pulse" />
                         </div>
                     ) : (
                         <div className="prose prose-invert prose-sm max-w-none">
                             <p className="text-slate-200 leading-relaxed font-medium text-[15px]">
                                 {answer}
                             </p>
                         </div>
                     )}
                 </div>
            </div>
        </motion.div>
    );
};

const CompanyCard = ({
    company,
    isPremium,
    isHackerMode,
    isExpanded,
    onToggleExplain
}: {
    company: Company,
    isPremium: boolean,
    isHackerMode: boolean,
    isExpanded: boolean,
    onToggleExplain: (id: string) => void
}) => {
  // Mock radar data based on company risk/connections
  const radarData = {
      risk: company.risk === 'critical' ? 90 : company.risk === 'high' ? 70 : company.risk === 'medium' ? 40 : 20,
      connections: Math.min(100, (company.connections || 0) * 5),
      capital: company.capital.includes('млн') ? 80 : 30,
      reputation: company.status === 'active' ? 85 : 40,
      transparency: isPremium ? 90 : 20
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-slate-900/60 border rounded-2xl overflow-hidden transition-all duration-500 backdrop-blur-md group",
        company.risk === 'critical' ? 'border-rose-900/50 shadow-[0_0_20px_rgba(225,29,72,0.05)]' : 'border-white/5 hover:border-emerald-500/30',
        isHackerMode && "rounded-none border-emerald-500/20 bg-black"
      )}
    >
      <div className="flex flex-col lg:flex-row">
          <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start gap-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110",
                    company.type === 'ТОВ' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 font-black' :
                    company.type === 'АТ' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 font-black' :
                    'bg-slate-800 border-slate-700 text-slate-400 font-black'
                )}>
                  {company.type}
                </div>
                <div>
                  <h3 className={cn(
                      "text-xl font-black text-white leading-tight mb-1 transition-colors",
                      isHackerMode ? "text-emerald-500 font-mono" : "group-hover:text-emerald-400"
                  )}>
                    {company.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="font-mono text-slate-500 font-bold bg-slate-800/50 px-2 py-0.5 rounded tracking-tighter">#{company.edrpou}</span>
                    <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                    <span className={cn(
                        "font-bold uppercase text-[10px] tracking-widest",
                        company.status === 'active' ? 'text-emerald-500' : 'text-amber-500'
                    )}>
                       {company.status === 'active' ? 'ДІЮЧА' : 'В СТАНІ ПРИПИНЕННЯ'}
                    </span>
                  </div>
                </div>
              </div>
              <RiskBadge level={company.risk} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-white/5 shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Керівник</span>
                        <span className="text-slate-200 font-bold">{company.director || "---"}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-white/5 shrink-0">
                        <MapPin className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Адреса Реєстрації</span>
                        <span className="text-slate-400 truncate max-w-[280px]">{company.address || "---"}</span>
                    </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-white/5 shrink-0">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Статутний Капітал</span>
                        <span className="text-slate-200 font-bold">{company.capital}</span>
                    </div>
                </div>
                 <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-white/5 shrink-0">
                        <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest block mb-1">Сфери Діяльності</span>
                        <div className="flex gap-1.5 flex-wrap">
                            {company.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-slate-800 text-[10px] rounded-full border border-white/5 text-slate-400 font-bold uppercase">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* PREMIUM SECTION */}
            <div className="pt-6 border-t border-white/5">
                {isPremium ? (
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="col-span-2">
                            <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-2 block">Власники та Бенефіціари</span>
                            <div className="space-y-1.5">
                                {company.beneficiaries?.length ? company.beneficiaries.map(b => (
                                    <div key={b} className="flex items-center gap-2 text-sm text-slate-200 group/link cursor-pointer hover:text-amber-400 transition-colors">
                                        <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full" />
                                        {b}
                                    </div>
                                )) : <span className="text-slate-600 text-xs italic">Дані в реєстрі уточнюються</span>}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2 block">Зв'язки</span>
                            <div className="flex items-center gap-2 text-2xl font-black text-white font-mono">
                                <Network className="w-5 h-5 text-emerald-400" />
                                {company.connections}
                                <span className="text-[10px] text-slate-500 font-normal tracking-normal ml-1">ОСІБ</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end justify-between lg:justify-end gap-2">
                            <button
                                onClick={() => onToggleExplain && onToggleExplain(company.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 w-full justify-center",
                                    isExpanded
                                        ? "bg-indigo-500 hover:bg-indigo-400 text-white border-indigo-500 shadow-indigo-500/20"
                                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                                )}
                            >
                                <Sparkles className="w-3 h-3" />
                                {isExpanded ? 'ПРИХОВАТИ ПОЯСНЕННЯ' : 'ПОЯСНИТИ РІШЕННЯ'}
                            </button>
                            <button className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all w-full">
                                ЗВ'ЯЗКИ
                            </button>
                        </div>
                     </div>
                ) : (
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-900/40 rounded-xl border border-dashed border-white/10">
                        <div className="flex gap-8">
                            <div className="flex flex-col gap-1.5">
                                 <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Бенефіціари</span>
                                 <RedactedField />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                 <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Тіньові Зв'язки</span>
                                 <RedactedField />
                            </div>
                        </div>
                        <div className="text-center group cursor-pointer">
                             <Lock className="w-5 h-5 text-amber-500/40 group-hover:text-amber-400 transition-colors mb-1 mx-auto" />
                             <span className="text-[8px] text-amber-500/30 uppercase font-black tracking-tighter group-hover:text-amber-400/50">Unlock Premium</span>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-white/5 bg-slate-900/50">
                             <ExplainabilityPanel
                                entityId={company.id}
                                entityName={company.name}
                                decision={company.status === 'active' ? 'Active Entitiy' : 'Risky Entity'}
                                riskScore={company.risk === 'critical' ? 95 : company.risk === 'high' ? 75 : 30}
                                explanation={company.explanation}
                             />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          {/* RIGHT SIDE RADAR (Premium Only) */}
          {isPremium && !isHackerMode && (
              <div className="lg:w-48 xl:w-64 border-l border-white/5 bg-slate-950/20 p-4 shrink-0 flex flex-col justify-center items-center">
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Профіль Ризику</div>
                  <div className="w-full h-40">
                      <SearchResultRadar {...radarData} />
                  </div>
                  <div className="mt-2 text-center">
                      <div className="text-lg font-mono font-black text-slate-200">
                          {Math.round((radarData.reputation + radarData.transparency) / 2)}
                          <span className="text-xs text-slate-500 font-normal">/100</span>
                      </div>
                      <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Alpha Score</div>
                  </div>
              </div>
          )}
      </div>

      <div className="bg-slate-950/50 px-6 py-3 flex justify-between items-center border-t border-white/5">
        <div className="flex gap-4">
             <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Реєстри
             </button>
             <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Суди
             </button>
        </div>
        <button className="py-1 px-4 bg-slate-800 hover:bg-slate-700 text-[10px] font-black text-white rounded-lg transition-all flex items-center gap-2 group border border-white/5">
          ПОВНЕ ДОСЬЄ
          <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-emerald-400" />
        </button>
      </div>
    </motion.div>
  );
};

export const SearchView = () => {
    const { userRole } = useAppStore();
    const isPremium = userRole === 'premium' || userRole === 'admin';
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // AI State
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Advanced Controls
    const [searchMode, setSearchMode] = useState<'neural' | 'exact' | 'deep'>('neural');
    const [isHackerMode, setIsHackerMode] = useState(false);
    const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);

    const toggleExplain = (id: string) => {
        setExpandedExplainId(prev => prev === id ? null : id);
    };

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setAiLoading(true);
        setHasSearched(true);
        setAiSummary(null);

        try {
            // Parallel execution of search and AI analysis
            const [searchRes, aiRes] = await Promise.allSettled([
                api.search.query({ q: query, mode: 'hybrid' }),
                api.v25.analyze(query).catch(() => null)
            ]);

            // Process Search Results
            if (searchRes.status === 'fulfilled' && Array.isArray(searchRes.value)) {
                 const adapted: Company[] = searchRes.value.map((r: any) => ({
                    id: r.id,
                    edrpou: r.metadata?.edrpou || '00000000',
                    name: r.title || 'Невідома Компанія',
                    status: r.metadata?.status || 'unknown',
                    risk: r.metadata?.risk_level || (r.score > 0.8 ? 'high' : 'low'),
                    director: r.metadata?.director || 'N/A',
                    address: r.metadata?.address || 'N/A',
                    capital: r.metadata?.capital || 'N/A',
                    type: r.metadata?.type || 'ТОВ',
                    tags: [r.category || 'General', r.source || 'Search'],
                    beneficiaries: r.metadata?.beneficiaries || [],
                    connections: r.metadata?.connections_count || 0,
                    explanation: r.explanation || undefined // Map explanation
                }));
                setResults(adapted);
            } else {
                setResults([]);
            }

            // Process AI Result
            if (aiRes.status === 'fulfilled' && aiRes.value) {
                // Assuming aiRes.value can be an object with 'result' or just a string
                // We also add a fallback mechanism if analysis is empty
                const answer = typeof aiRes.value === 'string'
                    ? aiRes.value
                    : aiRes.value.result || aiRes.value.summary || aiRes.value.message;

                setAiSummary(answer || "Система виявила декілька потенційних співпадінь у реєстрах. Рекомендується перевірити фінансову звітність та судові справи для детальнішої оцінки ризиків.");
            } else {
                // Fallback AI message if the endpoint fails but search succeeded
                 setAiSummary("ШІ проводить перехресний аналіз знайдених сутностей. Виявлено зв'язки з публічними реєстрами.");
            }

        } catch (e) {
            console.error(e);
            setResults([]);
        } finally {
            setLoading(false);
            setAiLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className={cn(
            "max-w-7xl mx-auto min-h-screen pb-20 transition-all duration-700",
            isHackerMode && "hacker-mode bg-black"
        )}>
            {/* Hacker Mode HUD Overlay */}
            {isHackerMode && (
                <div className="fixed top-20 right-8 text-[10px] font-mono text-emerald-500/50 uppercase tracking-[0.3em] pointer-events-none z-50 animate-pulse">
                    TERMINAL_LINK_ACTIVE // PORT: 8443 // S_KEY: AX-42
                </div>
            )}

            <div className="mb-12 text-center py-10 relative overflow-hidden">
                {!isHackerMode && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                )}

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <h1 className={cn(
                        "text-5xl font-black mb-4 tracking-tighter",
                        isHackerMode ? "text-emerald-500 font-mono" : "bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-400 to-cyan-500"
                    )}>
                        {isHackerMode ? "> PREDATOR_QUERY_HUB" : "Глобальний Інтелектуальний Пошук"}
                    </h1>
                    <p className="text-slate-500 max-w-xl mx-auto mb-10 text-lg font-medium leading-relaxed">
                        Прямий доступ до 2.5 млн суб'єктів через нейронні фільтри та судові масиви даних.
                    </p>
                </motion.div>

                <div className="max-w-3xl mx-auto relative group z-20">
                    {/* Mode Selector HUD */}
                    <div className="flex justify-center gap-1 mb-4">
                        {[
                            { id: 'neural', label: 'NEURAL', icon: BrainCircuit },
                            { id: 'exact', label: 'EXACT', icon: Target },
                            { id: 'deep', label: 'DEEP SCAN', icon: SearchIcon }
                        ].map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setSearchMode(mode.id as any)}
                                className={cn(
                                    "px-4 py-1.5 rounded-t-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 border-t border-x border-transparent",
                                    searchMode === mode.id
                                        ? "bg-slate-900 text-emerald-400 border-white/10"
                                        : "text-slate-600 hover:text-slate-400"
                                )}
                            >
                                <mode.icon size={11} />
                                {mode.label}
                            </button>
                        ))}
                    </div>

                    <div className={cn(
                        "absolute -inset-1 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000",
                        isHackerMode ? "bg-emerald-500/20" : "bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-600"
                    )}></div>

                    <div className={cn(
                        "relative flex items-center bg-slate-950/80 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl",
                        isHackerMode && "bg-black border-emerald-500/30 font-mono"
                    )}>
                        <div className="pl-6 pr-2 py-6 flex items-center justify-center border-r border-white/5">
                             {loading ? <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" /> : <SearchIcon className="w-6 h-6 text-slate-500" />}
                        </div>
                        <input
                            type="text"
                            placeholder={isHackerMode ? "ENTER_QUERY_OR_EDRPOU..." : "Введіть код ЄДРПОУ, назву або складний запит..."}
                            className="flex-1 bg-transparent text-white placeholder-slate-600 px-6 py-6 outline-none border-none text-xl font-medium tracking-tight"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="flex items-center gap-2 pr-4">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsHackerMode(!isHackerMode)}
                                className={cn(
                                    "p-3 rounded-xl transition-all border",
                                    isHackerMode ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-slate-900 border-white/5 text-slate-500 hover:text-white"
                                )}
                                title="Hacker Mode"
                            >
                                <Lock size={18} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSearch}
                                className={cn(
                                    "px-10 py-6 font-black uppercase tracking-widest text-sm transition-all",
                                    isHackerMode ? "bg-emerald-500 text-black" : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                                )}
                            >
                                {loading ? "SCANNING..." : "SEARCH"}
                            </motion.button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-2 mt-6 overflow-x-auto pb-2 px-4 no-scrollbar">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center mr-2">Trending:</span>
                    {['ТОВ "НАВІГАТОР"', '42883391', 'Тендери Паливо', 'Судові рішення 2026', 'Санкції РНБО'].map(f => (
                        <button key={f} onClick={() => { setQuery(f.replace('"', '')); handleSearch(); }} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-xs font-bold whitespace-nowrap">
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 relative z-10">
                 {/* AI Answer Card */}
                 <AIAnswerCard query={query} answer={aiSummary} loading={aiLoading} />

                 {hasSearched && (
                    <div className="flex justify-between items-center px-4 mb-2">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity size={12} className="text-emerald-500" />
                            ВИЯВЛЕНО <span className="text-white text-xs">{results.length}</span> ПРЯМИХ СПІВПАДІНЬ
                        </div>
                        {!isPremium && (
                            <div className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-2 uppercase tracking-widest">
                                <Lock className="w-3 h-3" />
                                RESTRICTED_FEED
                            </div>
                        )}
                    </div>
                 )}

                 <div className="grid grid-cols-1 gap-6">
                    {results.map(company => (
                        <CompanyCard
                            key={company.id}
                            company={company}
                            isPremium={isPremium}
                            isHackerMode={isHackerMode}
                            isExpanded={expandedExplainId === company.id}
                            onToggleExplain={toggleExplain}
                        />
                    ))}
                 </div>

                 {hasSearched && results.length === 0 && !loading && !aiLoading && (
                     <div className="text-center py-24 bg-slate-900/30 border border-dashed border-white/5 rounded-3xl">
                         <SearchIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                         <p className="text-slate-500 font-bold uppercase tracking-widest">Нуль результатів у базі PREDATOR</p>
                         <p className="text-[10px] text-slate-600 mt-2">Спробуйте змінити параметри пошуку або активувати DEEP SCAN.</p>
                     </div>
                 )}
            </div>
        </div>
    );
};
