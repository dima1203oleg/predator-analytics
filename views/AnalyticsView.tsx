
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import {
    Search, Sparkles, FileDown, Activity, Check, Scan, BrainCircuit,
    AlertTriangle, AlertOctagon, Share2, Layers, Info, FileText,
    Briefcase, Stethoscope, Leaf, Building2, Radio, Network,
    Clock, Target, Fingerprint, Map, Users, ChevronRight,
    Siren, Microscope, ShieldAlert, Crosshair, Database, RefreshCw, Calendar, Cpu,
    ToggleLeft, ToggleRight
} from 'lucide-react';
import { LLMMode, HybridSearchResult } from '../types';

const API_PREFIX = '/api/v1';

type SectorType = 'GOV' | 'BIZ' | 'MED' | 'SCI';

// --- CONFIGURATION ---
const SECTOR_CONFIG = {
    GOV: { label: 'Держсектор & PEP', icon: <Building2 size={16} />, color: 'blue', accent: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500', placeholder: "Введіть код ЄДРПОУ або ПІБ посадовця..." },
    BIZ: { label: 'Бізнес & Фінанси', icon: <Briefcase size={16} />, color: 'yellow', accent: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500', placeholder: "Введіть назву компанії або номер транзакції..." },
    MED: { label: 'Медицина & Фарма', icon: <Stethoscope size={16} />, color: 'red', accent: 'text-red-400', border: 'border-red-500', bg: 'bg-red-500', placeholder: "Введіть ID лікаря або номер тендеру..." },
    SCI: { label: 'Екологія & Наука', icon: <Leaf size={16} />, color: 'green', accent: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500', placeholder: "Введіть координати або ID сенсора..." }
};

// --- MOCK DATA GENERATORS ---
const generateTimeline = () => [
    { time: '2023-10-15', event: 'Зміна засновника компанії', risk: 45, detail: 'Новий бенефіціар: Кіпр (Offshore)', type: 'REGISTRY' },
    { time: '2023-10-28', event: 'Великий переказ коштів', risk: 90, detail: 'Сума: $1.2M -> Panama Bank', type: 'SWIFT' },
    { time: '2023-11-02', event: 'Перемога у держтендері', risk: 75, detail: 'Замовник: КП "МіськБуд" (без конкуренції)', type: 'TENDER' },
    { time: 'Вчора, 14:30', event: 'Згадка у кримінальному провадженні', risk: 99, detail: 'Стаття 191 ККУ (Привласнення майна)', type: 'COURT' },
];

const MOCK_NODES = [
    { id: 1, name: 'Цільовий Об\'єкт', type: 'MAIN', x: 50, y: 50, r: 40 },
    { id: 2, name: 'Офшор Ltd', type: 'RISK', x: 20, y: 30, r: 25 },
    { id: 3, name: 'КП "ДержЗакупівлі"', type: 'GOV', x: 80, y: 30, r: 30 },
    { id: 4, name: 'Родич (Дружина)', type: 'PERSON', x: 30, y: 80, r: 20 },
    { id: 5, name: 'Фіктивна ФОП', type: 'RISK', x: 70, y: 70, r: 25 },
];

const IntelligenceTicker = () => (
    <div className="w-full bg-slate-900/90 border-y border-slate-800 h-8 overflow-hidden flex items-center relative select-none backdrop-blur-sm mb-6 panel-3d">
        <div className="flex items-center gap-2 px-3 shrink-0 bg-slate-950 h-full border-r border-slate-800 z-20 text-red-500 font-bold text-[10px] uppercase tracking-wider shadow-xl">
            <Radio size={12} className="animate-pulse" /> Live Intercept
        </div>
        <div className="flex items-center gap-12 animate-marquee whitespace-nowrap pl-4">
            <span className="text-slate-400 text-xs font-mono"><span className="text-blue-500">::</span> ДМСУ: Зафіксовано аномальний імпорт електроніки (Одеса)</span>
            <span className="text-slate-400 text-xs font-mono"><span className="text-yellow-500">::</span> ФінМон: Транзакція &gt; 400k UAH без ідентифікації</span>
            <span className="text-slate-400 text-xs font-mono"><span className="text-green-500">::</span> Prozorro: Тендер UA-2023-11-05 оскаржено в АМКУ</span>
            <span className="text-slate-400 text-xs font-mono"><span className="text-purple-500">::</span> DarkWeb: Злив бази клієнтів 'Bank X' (перевірка хешів)</span>
        </div>
    </div>
);

const AnalyticsView: React.FC = () => {
    const [currentSector, setCurrentSector] = useState<SectorType>('GOV');
    const [searchQuery, setSearchQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'GRAPH' | 'TIMELINE' | '3D_TIMELINE'>('GRAPH');
    const [llmMode, setLlmMode] = useState<LLMMode>('auto');

    // Semantic Search State
    const [isSemantic, setIsSemantic] = useState(true);
    const [semanticResults, setSemanticResults] = useState<HybridSearchResult[]>([]);

    // Investigation State
    const [progress, setProgress] = useState(0);
    const [activeStep, setActiveStep] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const logsRef = useRef<HTMLDivElement>(null);

    // Simulation Steps
    const steps = [
        "Ініціалізація протоколу DeepScan v4.2...",
        "Підключення до реєстрів МінЮсту (ЄДР)...",
        "Аналіз податкових накладних (ДПС API)...",
        "Побудова графа зв'язків (Neo4j Depth=3)...",
        "Перевірка санкційних списків (PEP/NBU)...",
        "Аналіз судових рішень (NLP Processing)...",
        "Генерація фінального звіту (Gemini Pro)..."
    ];

    useEffect(() => {
        if (logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
    }, [logs]);

    const handleScan = async () => {
        if (!searchQuery.trim()) return;
        setIsScanning(true);
        setScanResult(null);
        setSemanticResults([]);
        setProgress(5);
        setActiveStep(0);

        const timestamp = new Date().toLocaleTimeString();
        setLogs([`[${timestamp}] Initializing request to Predator Core...`]);

        try {
            // Start progress simulation
            const stepInterval = setInterval(() => {
                setActiveStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
                setProgress(prev => (prev < 90 ? prev + 10 : prev));
            }, 800);

            if (isSemantic) {
                // --- SEMANTIC SEARCH FLOW ---
                setLogs(prev => [...prev, `[${timestamp}] Executing Hybrid Search (OpenSearch + Qdrant)...`]);

                const response = await fetch(`${API_PREFIX}/search?q=${encodeURIComponent(searchQuery)}&semantic=true&limit=10`);
                if (!response.ok) throw new Error('Search API Error');

                const data = await response.json();
                setSemanticResults(data.results || []);

                // Emulate scan result for UI consistency (first hit or summary)
                if (data.results && data.results.length > 0) {
                    // Create a "Virtual" entity from search results
                    const topHit = data.results[0];
                    finishScan({
                        query: searchQuery,
                        mode: 'HYBRID_SEARCH',
                        results: {
                            confidence: topHit.combinedScore ? Math.min(topHit.combinedScore / 20, 0.99) : 0.85,
                            model_used: 'Hybrid (Vector + Keyword)',
                            sources_count: data.total,
                            answer: topHit.snippet // Use snippet as "answer"
                        },
                        isSemanticSearch: true
                    });
                } else {
                    setLogs(prev => [...prev, `[WARN] No results found.`]);
                    finishScan({
                        query: searchQuery,
                        mode: 'HYBRID_SEARCH',
                        results: { confidence: 0, model_used: 'N/A', sources_count: 0, answer: 'No documents found matching criteria.' }
                    });
                }

            } else {
                // --- DEEP SCAN FLOW (Legacy/Full Agentic) ---
                setLogs(prev => [...prev, `[${timestamp}] Routing via ${llmMode.toUpperCase()} strategy...`]);

                const response = await fetch(`${API_PREFIX}/analytics/deepscan`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchQuery,
                        sectors: [currentSector],
                        llm_mode: llmMode
                    })
                });

                if (!response.ok) throw new Error('API Error');
                const data = await response.json();
                finishScan(data);
            }

            clearInterval(stepInterval);

        } catch (error) {
            console.error("Scan failed:", error);
            setLogs(prev => [...prev, `[ERROR] Scan failed: ${error}`]);
            setIsScanning(false);
        }
    };

    const finishScan = (data: any) => {
        // Map API Response to UI
        const timeline = generateTimeline(); // Keep mock timeline for visuals for now

        setScanResult({
            riskScore: Math.round((data.results?.confidence || 0.5) * 100),
            verdict: data.results?.model_used || 'AI Analysis',
            entity: {
                name: data.query,
                id: 'DETECTED',
                registered: new Date().toLocaleDateString(),
                status: 'Active',
                address: 'Data from ' + data.mode
            },
            timeline,
            flags: [
                `Sources: ${data.results?.sources_count || 0}`,
                `Confidence: ${Math.round((data.results?.confidence || 0) * 100)}%`,
                "AI Generated Insight"
            ],
            aiText: data.results?.answer // Store the real text here
        });
        setIsScanning(false);
        setProgress(100);
    };

    const c = SECTOR_CONFIG[currentSector];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto min-h-screen relative">

            <IntelligenceTicker />

            <ViewHeader
                title="DeepScan: Центр Розслідувань"
                icon={<Crosshair size={20} className={`${c.accent} icon-3d`} />}
                breadcrumbs={['INTELLIGENCE', 'DEEP SCAN', c.label]}
                stats={[
                    { label: 'Протокол', value: currentSector, icon: c.icon, color: 'primary' },
                    { label: 'Neural Engine', value: 'GEMINI 3', icon: <BrainCircuit size={14} />, color: 'primary' },
                    { label: 'Джерела Даних', value: '42 REGISTRIES', icon: <Database size={14} />, color: 'success' },
                ]}
            />

            {/* SECTOR TABS */}
            <div className="flex border-b border-slate-800 bg-slate-900/50 rounded-t-lg overflow-x-auto scrollbar-hide panel-3d">
                {(Object.keys(SECTOR_CONFIG) as SectorType[]).map(sector => {
                    const config = SECTOR_CONFIG[sector];
                    const isActive = currentSector === sector;
                    return (
                        <button
                            key={sector}
                            onClick={() => { setCurrentSector(sector); setScanResult(null); setSearchQuery(''); }}
                            className={`flex-1 min-w-[120px] py-4 text-xs font-bold border-b-2 transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden group ${isActive
                                ? `${config.border} ${config.accent} bg-slate-800/80`
                                : 'border-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                                }`}
                        >
                            <div className={`absolute inset-0 ${config.bg} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                            {config.icon}
                            <span className="uppercase tracking-wider">{config.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* SEARCH BAR (FORENSIC STYLE) */}
            <div className="relative z-10 -mt-6 mx-2 sm:mx-6">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-col sm:flex-row gap-2 items-center panel-3d ring-1 ring-white/5">
                    <div className={`hidden sm:flex p-3 rounded-lg bg-slate-800/50 ${c.accent} border border-slate-700`}>
                        <Search size={24} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={c.placeholder}
                        className="w-full sm:flex-1 bg-transparent border-none text-base sm:text-lg text-white placeholder-slate-600 focus:ring-0 outline-none font-medium px-4 py-3 sm:p-0"
                        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    />

                    {/* MODE SELECTOR */}
                    <div className="hidden sm:flex items-center gap-3 px-3 border-l border-slate-700">
                        {/* SEMANTIC TOGGLE */}
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setIsSemantic(!isSemantic)}
                        >
                            {isSemantic ? <ToggleRight size={28} className="text-green-500" /> : <ToggleLeft size={28} className="text-slate-600" />}
                            <div className="flex flex-col">
                                <span className={`text-[10px] uppercase font-bold ${isSemantic ? 'text-green-400' : 'text-slate-500'}`}>Semantic</span>
                                <span className="text-[8px] text-slate-600">Hybrid Search</span>
                            </div>
                        </div>

                        <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>

                        {/* LLM SELECTOR */}
                        <div className={`flex items-center gap-2 transition-opacity ${isSemantic ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                            <Cpu size={14} className="text-slate-500" />
                            <select
                                value={llmMode}
                                onChange={(e) => setLlmMode(e.target.value as LLMMode)}
                                className="bg-transparent text-xs font-bold text-slate-300 outline-none focus:ring-0 cursor-pointer uppercase tracking-wider"
                                disabled={isSemantic}
                            >
                                <option value="auto" className="bg-slate-900 text-slate-300">Auto (Smart)</option>
                                <option value="council" className="bg-slate-900 text-purple-400">⚡ Council (Rada)</option>
                                <option value="fast" className="bg-slate-900 text-green-400">Fast (Groq)</option>
                                <option value="precise" className="bg-slate-900 text-blue-400">Precise (Gemini)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleScan}
                        disabled={isScanning || !searchQuery}
                        className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] btn-3d flex items-center justify-center gap-2 ${isScanning
                            ? 'bg-slate-800 text-slate-500 cursor-wait'
                            : `${c.bg.replace('bg-', 'bg-').replace('500', '600')} hover:${c.bg} text-white shadow-lg`
                            }`}
                    >
                        {isScanning ? <RefreshCw className="animate-spin" /> : <Scan />}
                        {isScanning ? 'АНАЛІЗ...' : 'ЗАПУСТИТИ СКАН'}
                    </button>
                </div>
            </div>

            {/* LOADING STATE */}
            {isScanning && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 animate-in fade-in duration-500">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden panel-3d h-[300px] md:h-[400px]">
                        <div className={`absolute inset-0 ${c.bg} opacity-5 animate-pulse`}></div>
                        <div className="relative w-48 h-48 mb-8">
                            <div className={`absolute inset-0 border-4 ${c.border.replace('border-', 'border-').replace('500', '500/30')} rounded-full animate-ping`}></div>
                            <div className={`absolute inset-0 border-4 border-t-${c.color}-500 border-r-transparent border-b-${c.color}-500 border-l-transparent rounded-full animate-spin`}></div>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="font-mono text-3xl font-bold text-white">{Math.round(progress)}%</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Confidence</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 animate-pulse font-display">ГЛИБИННИЙ АНАЛІЗ</h3>
                        <p className={`${c.accent} font-mono text-xs md:text-sm text-center px-4`}>{steps[activeStep]}</p>
                    </div>

                    <div className="bg-black/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-green-400 overflow-hidden h-[300px] md:h-[400px] shadow-inner custom-scrollbar relative flex flex-col">
                        <div className="absolute top-0 left-0 right-0 p-2 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center z-10">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">System Log Output</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pt-10 px-2" ref={logsRef}>
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1 border-l-2 border-green-500/30 pl-2 animate-in slide-in-from-left-2 opacity-80 hover:opacity-100 transition-opacity">
                                    <span className="text-green-600 mr-2">➜</span>{log}
                                </div>
                            ))}
                            <div className="animate-pulse text-green-500">_</div>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULTS DASHBOARD */}
            {!isScanning && scanResult && (
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">

                    {/* 1. TOP ROW: VERDICT & PROFILE */}
                    {/* 1. TOP ROW: VERDICT & PROFILE OR SEARCH RESULTS */}
                    {isSemantic && semanticResults.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
                                    <Database size={20} className="text-blue-500" />
                                    FOUND EVIDENCE
                                    <span className="text-sm text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 ml-2">
                                        {semanticResults.length} MATCHES
                                    </span>
                                </h3>
                                <div className="text-xs text-slate-500">Hybrid Search (Vector + Keyword)</div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar p-1">
                                {semanticResults.map((res: HybridSearchResult) => (
                                    <div key={res.id} className="bg-slate-900/80 border border-slate-800 p-5 rounded-lg hover:border-blue-500 transition-all group relative overflow-hidden panel-3d">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <FileText size={40} />
                                        </div>

                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <h4 className="text-lg font-bold text-blue-100 group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                {res.title}
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                {res.combinedScore && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${res.combinedScore > 10 ? 'border-green-500/50 text-green-400 bg-green-900/20' :
                                                        'border-slate-700 text-slate-400 bg-slate-800'
                                                        }`}>
                                                        SCORE: {res.combinedScore.toFixed(1)}
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                                                    {res.source.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            className="text-sm text-slate-300 mb-3 font-mono leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: res.snippet.replace(/<mark>/g, '<span class="bg-yellow-500/20 text-yellow-200 font-bold px-0.5 rounded">').replace(/<\/mark>/g, '</span>') }}
                                        />

                                        <div className="flex items-center gap-4 text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={10} /> {res.published_date || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Target size={10} /> {res.category || 'General'}
                                            </div>
                                            <div className="flex-1 text-right font-mono text-slate-600">
                                                ID: {res.id}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Entity Profile */}
                            <TacticalCard className="relative overflow-hidden border-l-4 border-l-purple-500 panel-3d bg-slate-900/80">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Fingerprint size={120} />
                                </div>
                                <div className="flex flex-col h-full justify-between relative z-10">
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-2">
                                                    <Target size={12} className="text-purple-500" /> Ціль Аналізу
                                                </div>
                                                <h2 className="text-2xl font-bold text-white leading-none font-display tracking-wide">{scanResult.entity.name}</h2>
                                            </div>
                                            <div className="px-3 py-1 bg-red-900/20 border border-red-500/50 rounded text-red-500 text-xs font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                                HIGH RISK
                                            </div>
                                        </div>
                                        <div className="space-y-2 mt-4">
                                            <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                                <span className="text-slate-500">ЄДРПОУ / ID</span>
                                                <span className="text-slate-300 font-mono select-all">{scanResult.entity.id}</span>
                                            </div>
                                            <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                                <span className="text-slate-500">Дата Реєстрації</span>
                                                <span className="text-slate-300 font-mono">{scanResult.entity.registered}</span>
                                            </div>
                                            <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                                <span className="text-slate-500">Адреса</span>
                                                <span className="text-slate-300 truncate max-w-[150px]">{scanResult.entity.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <div className="text-[10px] text-slate-500 uppercase">Ризик Скоринг (AI)</div>
                                            <div className="text-3xl font-bold text-red-500 font-display text-glow-red">{scanResult.riskScore}/100</div>
                                        </div>
                                        <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" style={{ width: `${scanResult.riskScore}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </TacticalCard>

                            {/* AI Verdict */}
                            <div className="lg:col-span-2 bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-500/30 rounded-xl p-6 relative overflow-hidden flex flex-col justify-center panel-3d group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_red]"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-red-500/20 rounded-full animate-pulse">
                                            <ShieldAlert size={24} className="text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-red-400 uppercase tracking-widest font-display">Вердикт AI: {scanResult.verdict}</h3>
                                            <p className="text-[10px] text-red-300/70 font-mono">Gemini Pro • Confidence: 98.2%</p>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 p-4 rounded-lg border border-red-500/20 backdrop-blur-sm mb-4 max-h-[300px] overflow-y-auto">
                                        <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                                            {scanResult.aiText ? (
                                                <>
                                                    <span className="text-red-400 font-bold block mb-2">AI REPORT ({llmMode.toUpperCase()}):</span>
                                                    {scanResult.aiText}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-red-400 font-bold">УВАГА:</span> Система виявила критичні аномалії, що вказують на високу ймовірність <span className="text-white border-b border-red-500/50">корупційних ризиків</span>.
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {scanResult.flags.map((flag: string, i: number) => (
                                            <span key={i} className="text-[10px] font-bold bg-red-950/80 text-red-200 px-3 py-1.5 rounded border border-red-800 flex items-center gap-2 shadow-sm">
                                                <AlertTriangle size={12} /> {flag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. MIDDLE ROW: VISUALIZATION */}
                    <TacticalCard
                        title="Forensic Visualization"
                        className="min-h-[500px] panel-3d p-0 overflow-hidden relative"
                        noPadding
                        action={
                            <div className="flex gap-2 bg-slate-900/80 p-1 rounded border border-slate-700">
                                <button onClick={() => setViewMode('GRAPH')} className={`p-1.5 rounded ${viewMode === 'GRAPH' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}><Share2 size={16} /></button>
                                <button onClick={() => setViewMode('TIMELINE')} className={`p-1.5 rounded ${viewMode === 'TIMELINE' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}><Calendar size={16} /></button>
                                <button onClick={() => setViewMode('3D_TIMELINE')} className={`p-1.5 rounded ${viewMode === '3D_TIMELINE' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}><Layers size={16} /></button>
                            </div>
                        }
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_transparent_70%)] opacity-30"></div>
                        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>

                        {viewMode === 'GRAPH' && (
                            <div className="w-full h-full relative">
                                {/* SVG Lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <defs>
                                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="20" refY="3" orient="auto" markerUnits="strokeWidth">
                                            <path d="M0,0 L0,6 L9,3 z" fill="#475569" />
                                        </marker>
                                    </defs>
                                    {MOCK_NODES.slice(1).map((node, i) => (
                                        <line
                                            key={i}
                                            x1="50%" y1="50%"
                                            x2={`${node.x}%`} y2={`${node.y}%`}
                                            stroke={node.type === 'RISK' ? '#ef4444' : '#475569'}
                                            strokeWidth={node.type === 'RISK' ? 2 : 1}
                                            strokeDasharray={node.type === 'RISK' ? "5,5" : ""}
                                            className={node.type === 'RISK' ? "animate-pulse" : ""}
                                            markerEnd="url(#arrow)"
                                        />
                                    ))}
                                </svg>

                                {/* Nodes */}
                                {MOCK_NODES.map((node, i) => (
                                    <div
                                        key={i}
                                        className="absolute flex flex-col items-center group cursor-pointer transition-all duration-500 hover:z-50"
                                        style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div className={`
                                        rounded-full border-2 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:scale-110
                                        ${node.type === 'MAIN' ? 'w-16 h-16 bg-blue-600 border-blue-400 text-white z-20' :
                                                node.type === 'RISK' ? 'w-12 h-12 bg-red-900/80 border-red-500 text-red-200 z-10' :
                                                    'w-10 h-10 bg-slate-800 border-slate-600 text-slate-400'}
                                    `}>
                                            {node.type === 'MAIN' ? <Target size={28} /> :
                                                node.type === 'RISK' ? <Siren size={20} className="animate-pulse" /> :
                                                    node.type === 'GOV' ? <Building2 size={18} /> :
                                                        <Users size={18} />}
                                        </div>

                                        <div className={`mt-2 px-2 py-1 rounded text-[10px] font-bold backdrop-blur-md border transition-all ${node.type === 'MAIN' ? 'bg-blue-900/80 border-blue-500 text-white' :
                                            node.type === 'RISK' ? 'bg-red-900/80 border-red-500 text-white' :
                                                'bg-slate-900/80 border-slate-700 text-slate-300 group-hover:bg-slate-800'
                                            }`}>
                                            {node.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {viewMode === 'TIMELINE' && (
                            <div className="w-full h-full p-8 overflow-y-auto custom-scrollbar">
                                <div className="relative pl-8 space-y-8">
                                    <div className="absolute left-11 top-0 bottom-0 w-0.5 bg-slate-800"></div>
                                    {scanResult.timeline.map((event: any, i: number) => (
                                        <div key={i} className="relative flex items-center gap-6 group animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                            {/* Date Bubble */}
                                            <div className="w-24 text-right">
                                                <div className="text-[10px] font-mono text-slate-500">{event.time.split(',')[0]}</div>
                                                <div className="text-xs font-bold text-slate-300">{event.time.split(',')[1] || ''}</div>
                                            </div>

                                            {/* Node Dot */}
                                            <div className={`w-6 h-6 rounded-full border-4 z-10 transition-colors flex items-center justify-center shrink-0 ${event.risk > 80 ? 'border-red-900 bg-red-500 shadow-[0_0_15px_red]' :
                                                event.risk > 50 ? 'border-yellow-900 bg-yellow-500' : 'border-slate-900 bg-slate-600'
                                                }`}></div>

                                            <div className="flex-1 bg-slate-900/50 p-4 rounded border border-slate-800 group-hover:border-slate-600 transition-colors hover:bg-slate-900 cursor-pointer backdrop-blur-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="text-xs font-bold text-slate-200 group-hover:text-primary-400 transition-colors">{event.event}</div>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${event.risk > 80 ? 'text-red-400 border-red-900/50 bg-red-900/20' :
                                                        'text-slate-400 border-slate-700 bg-slate-800'
                                                        }`}>
                                                        {event.type}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                                    <Info size={10} /> {event.detail}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {viewMode === '3D_TIMELINE' && (
                            <div className="w-full h-full flex items-center justify-center perspective-[1000px] overflow-hidden">
                                <div className="relative w-[60%] h-full transform-style-3d rotate-x-20 rotate-y-[-10deg]">
                                    {scanResult.timeline.map((event: any, i: number) => (
                                        <div
                                            key={i}
                                            className="absolute left-0 right-0 p-4 bg-slate-900/80 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md transform transition-all hover:translate-x-4 hover:scale-105"
                                            style={{
                                                top: `${i * 100 + 50}px`,
                                                transform: `translateZ(${-i * 50}px)`,
                                                opacity: 1 - (i * 0.1)
                                            }}
                                        >
                                            <div className="flex justify-between">
                                                <span className="text-xs font-bold text-white">{event.event}</span>
                                                <span className="text-[10px] text-slate-400">{event.time}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1">{event.detail}</div>
                                        </div>
                                    ))}
                                    {/* Center line */}
                                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500/30 transform -translate-x-1/2 -z-10"></div>
                                </div>
                            </div>
                        )}
                    </TacticalCard>

                    {/* 3. BOTTOM ROW: ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-red-500/50 group transition-all btn-3d relative overflow-hidden">
                            <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-red-900/20 text-red-500 rounded group-hover:scale-110 transition-transform">
                                    <Siren size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-200">Подати до Фінмоніторингу</div>
                                    <div className="text-[10px] text-slate-500">Автоматичний звіт (XML)</div>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-blue-500/50 group transition-all btn-3d relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-blue-900/20 text-blue-500 rounded group-hover:scale-110 transition-transform">
                                    <FileDown size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-200">Експорт Досьє (PDF)</div>
                                    <div className="text-[10px] text-slate-500">Повний пакет доказів</div>
                                </div>
                            </div>
                        </button>

                        <button className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-purple-500/50 group transition-all btn-3d relative overflow-hidden">
                            <div className="absolute inset-0 bg-purple-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                <div className="p-2 bg-purple-900/20 text-purple-500 rounded group-hover:scale-110 transition-transform">
                                    <Microscope size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-bold text-slate-200">Детальний Аудит</div>
                                    <div className="text-[10px] text-slate-500">Запустити агентів рівня 2</div>
                                </div>
                            </div>
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
};

export default AnalyticsView;
