
import React, { useState, useEffect, useRef } from 'react';
import { TacticalCard } from '../components/TacticalCard';
import { ViewHeader } from '../components/ViewHeader';
import { 
  Trophy, Activity, Zap, Server, Settings, Play, Database, 
  GitBranch, RefreshCw, BarChart3, Box, TrendingUp, CheckCircle2,
  AlertTriangle, DollarSign, Cloud, Cpu, Plus, X, MonitorPlay, Sparkles
} from 'lucide-react';
import { NasTournament, ProviderQuota, ModelCandidate } from '../types';
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  Tooltip, Legend, CartesianGrid, AreaChart, Area 
} from 'recharts';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useSuperIntelligence } from '../context/SuperIntelligenceContext';

// --- MOCK DATA ---
const INITIAL_TOURNAMENTS: NasTournament[] = [
    { id: 't1', topicId: 'fraud_detection', name: 'Anomaly Detection v4', datasetId: 'swift_transactions_q3', strategy: 'EVOLUTIONARY', status: 'RUNNING', currentGeneration: 4, maxGenerations: 10, candidatesCount: 150, bestScore: 0.89, startTime: '10:00', duration: '45m' },
    { id: 't2', topicId: 'sales_forecast', name: 'Sales Prediction 2024', datasetId: 'sales_2023_full', strategy: 'REINFORCEMENT', status: 'COMPLETED', currentGeneration: 20, maxGenerations: 20, candidatesCount: 500, bestScore: 0.94, startTime: 'Yesterday', duration: '4h 20m' },
];

const INITIAL_PROVIDERS: ProviderQuota[] = [
    { id: 'p1', name: 'Mistral AI', model: 'mistral-large', tier: 'ENTERPRISE', requestsUsed: 4500, requestsLimit: 10000, tokensUsed: 1200000, tokensLimit: 5000000, resetDate: '01.12', status: 'OK', activeKeys: 3 },
    { id: 'p2', name: 'Google Vertex', model: 'gemini-1.5-pro', tier: 'PAID', requestsUsed: 8900, requestsLimit: 10000, tokensUsed: 2100000, tokensLimit: 2500000, resetDate: '01.12', status: 'WARNING', activeKeys: 2 },
    { id: 'p3', name: 'OpenAI', model: 'gpt-4-turbo', tier: 'PAID', requestsUsed: 1200, requestsLimit: 5000, tokensUsed: 450000, tokensLimit: 1000000, resetDate: '01.12', status: 'OK', activeKeys: 1 },
];

const INITIAL_MODELS: ModelCandidate[] = Array.from({length: 20}, (_, i) => ({
    id: `m-${i}`,
    tournamentId: 't1',
    architecture: i % 2 === 0 ? `Transformer-L${4+i}-H${128+i*16}` : `LSTM-Stacked-x${i+1}`,
    generation: Math.floor(i / 5) + 1,
    metrics: {
        accuracy: 0.7 + (Math.random() * 0.25),
        latency: 10 + (Math.random() * 50),
        f1: 0.65 + (Math.random() * 0.3),
        params: 1000000 + (Math.random() * 5000000)
    },
    status: i > 15 ? 'TRAINING' : 'COMPLETED',
    provider: i % 3 === 0 ? 'mistral' : i % 3 === 1 ? 'google' : 'openai'
}));

const NasView: React.FC = () => {
    const toast = useToast();
    const { isActive: isGodMode, stage: godStage, currentScenario } = useSuperIntelligence();
    
    const [activeTab, setActiveTab] = useState<'ARENA' | 'LEADERBOARD' | 'DATASETS' | 'PROVIDERS'>('ARENA');
    const [tournaments, setTournaments] = useState(INITIAL_TOURNAMENTS);
    const [providers, setProviders] = useState(INITIAL_PROVIDERS);
    const [models, setModels] = useState(INITIAL_MODELS);
    
    // Live Chart Data
    const [candidatesData, setCandidatesData] = useState<any[]>(
        INITIAL_MODELS.filter(m => m.status === 'COMPLETED').map(m => ({
            x: m.metrics.latency,
            y: m.metrics.accuracy * 100,
            z: m.metrics.params / 1000000, 
            name: m.architecture,
            generation: m.generation
        }))
    );
    
    // Create Tournament Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTournament, setNewTournament] = useState({ name: '', dataset: '', strategy: 'EVOLUTIONARY' });

    const isMounted = useRef(false);

    // --- SYNC WITH GOD MODE ---
    useEffect(() => {
        if (isGodMode && godStage === 'NAS_IMPLEMENTATION' && currentScenario) {
            const godId = `god-${currentScenario.id}`;
            setTournaments(prev => {
                if (prev.some(t => t.id === godId)) return prev;
                
                const godTournament: NasTournament = {
                    id: godId,
                    topicId: 'GOD_MODE',
                    name: `⚡ ${currentScenario.name} (Auto-Fix)`,
                    datasetId: 'live_system_metrics',
                    strategy: 'DARTS',
                    status: 'RUNNING',
                    currentGeneration: 1,
                    maxGenerations: 5,
                    candidatesCount: 0,
                    bestScore: 0,
                    startTime: 'NOW',
                    duration: 'Running...'
                };
                return [godTournament, ...prev];
            });
        }
    }, [isGodMode, godStage, currentScenario]);

    useEffect(() => {
        isMounted.current = true;
        
        const interval = setInterval(() => {
            if (!isMounted.current) return;
            
            // Simulate live training progress
            setTournaments(prev => prev.map(t => {
                if (t.status === 'RUNNING') {
                    // Accelerate for God Mode
                    const speed = t.topicId === 'GOD_MODE' ? 5 : 1;
                    const newScore = Math.min(0.999, t.bestScore + (0.001 * speed));
                    return { 
                        ...t, 
                        candidatesCount: t.candidatesCount + speed, 
                        bestScore: newScore,
                        currentGeneration: Math.min(t.maxGenerations, t.currentGeneration + (Math.random() > 0.8 ? 1 : 0))
                    };
                }
                return t;
            }));

            // Simulate new candidate appearing on chart
            if (Math.random() > 0.7) {
                setCandidatesData(prev => [
                    ...prev, 
                    { 
                        x: 10 + Math.random() * 40, 
                        y: 75 + Math.random() * 20, 
                        z: 1 + Math.random() * 5, 
                        name: `Auto-Gen-${Date.now()}`,
                        generation: 5 
                    }
                ].slice(-50)); // Keep only last 50 points to prevent chart lag
            }

        }, 2000);

        return () => { 
            isMounted.current = false; 
            clearInterval(interval);
        };
    }, []);

    const handleCreate = () => {
        setIsCreateOpen(false);
        toast.success('Турнір Створено', `NAS запущено для "${newTournament.name}". Провайдери активовані.`);
        
        const newT: NasTournament = {
            id: `t-${Date.now()}`,
            topicId: 'custom',
            name: newTournament.name,
            datasetId: newTournament.dataset,
            strategy: newTournament.strategy as any,
            status: 'RUNNING',
            currentGeneration: 1,
            maxGenerations: 20,
            candidatesCount: 0,
            bestScore: 0,
            startTime: 'Just now',
            duration: '0s'
        };
        setTournaments([newT, ...tournaments]);
    };

    const renderArena = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-2 space-y-6">
                <TacticalCard title="Pareto Frontier (Accuracy vs Latency)" className="h-[400px] panel-3d">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" dataKey="x" name="Latency (ms)" unit="ms" stroke="#64748b" />
                            <YAxis type="number" dataKey="y" name="Accuracy (%)" unit="%" stroke="#64748b" domain={[60, 100]} />
                            <ZAxis type="number" dataKey="z" range={[50, 400]} name="Params (M)" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} />
                            <Legend />
                            <Scatter name="Architectures" data={candidatesData} fill="#3b82f6" shape="circle" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </TacticalCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tournaments.map(t => (
                        <div key={t.id} className={`bg-slate-900 border p-4 rounded-lg relative overflow-hidden group panel-3d transition-all ${
                            t.topicId === 'GOD_MODE' ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'border-slate-800'
                        }`}>
                            {t.status === 'RUNNING' && <div className={`absolute top-0 left-0 w-full h-0.5 animate-progress ${t.topicId === 'GOD_MODE' ? 'bg-purple-500' : 'bg-green-500'}`}></div>}
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded ${
                                        t.topicId === 'GOD_MODE' ? 'bg-purple-900/20 text-purple-500 animate-pulse' :
                                        t.status === 'RUNNING' ? 'bg-green-900/20 text-green-500 animate-pulse' : 
                                        'bg-slate-800 text-slate-500'
                                    }`}>
                                        {t.topicId === 'GOD_MODE' ? <Sparkles size={20} /> : <Trophy size={20} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-200">{t.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{t.strategy} • Gen {t.currentGeneration}/{t.maxGenerations}</div>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    t.topicId === 'GOD_MODE' ? 'bg-purple-900/20 text-purple-500 border-purple-900/50' :
                                    t.status === 'RUNNING' ? 'bg-green-900/20 text-green-500 border-green-900/50' : 
                                    'bg-slate-800 text-slate-500 border-slate-700'
                                }`}>
                                    {t.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <div className="text-[9px] text-slate-500 uppercase">Best Score</div>
                                    <div className={`text-sm font-bold ${t.topicId === 'GOD_MODE' ? 'text-purple-400' : 'text-blue-400'}`}>{(t.bestScore * 100).toFixed(1)}%</div>
                                </div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <div className="text-[9px] text-slate-500 uppercase">Candidates</div>
                                    <div className="text-sm font-bold text-slate-300">{t.candidatesCount}</div>
                                </div>
                                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                                    <div className="text-[9px] text-slate-500 uppercase">Duration</div>
                                    <div className="text-sm font-bold text-slate-300">{t.duration}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <TacticalCard title="Live Training Stream" className="h-[600px] flex flex-col panel-3d">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {models.map(m => (
                            <div key={m.id} className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between group hover:border-slate-600 transition-colors">
                                <div>
                                    <div className="text-[10px] font-bold text-slate-300 flex items-center gap-2">
                                        <Cpu size={12} className="text-slate-500" />
                                        {m.architecture}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-0.5 flex gap-2">
                                        <span>Gen {m.generation}</span>
                                        <span className={m.provider === 'mistral' ? 'text-yellow-500' : m.provider === 'google' ? 'text-blue-500' : 'text-green-500'}>
                                            via {m.provider}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {m.status === 'TRAINING' ? (
                                        <span className="text-[9px] text-blue-400 animate-pulse flex items-center gap-1 justify-end">
                                            <RefreshCw size={10} className="animate-spin" /> TRAIN
                                        </span>
                                    ) : (
                                        <div className="text-xs font-bold text-green-500">{(m.metrics.accuracy * 100).toFixed(1)}%</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </TacticalCard>
            </div>
        </div>
    );

    const renderProviders = () => (
        <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-300">
            <TacticalCard title="AI Provider Router (Limits & Costs)" className="panel-3d">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {providers.map(p => {
                        const usagePercent = (p.requestsUsed / p.requestsLimit) * 100;
                        return (
                            <div key={p.id} className={`p-4 rounded-lg border relative overflow-hidden group hover:shadow-lg transition-all ${
                                p.status === 'WARNING' ? 'bg-yellow-900/10 border-yellow-500/50' :
                                p.status === 'EXHAUSTED' ? 'bg-red-900/10 border-red-500/50' :
                                'bg-slate-900 border-slate-800'
                            }`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                                            {p.name.includes('Google') ? <span className="font-bold text-blue-500">G</span> : 
                                             p.name.includes('OpenAI') ? <span className="font-bold text-green-500">O</span> : 
                                             <span className="font-bold text-yellow-500">M</span>}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-200">{p.name}</h4>
                                            <div className="text-[10px] text-slate-500 uppercase">{p.tier} Plan</div>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                        p.status === 'OK' ? 'bg-green-900/20 text-green-500 border-green-900/50' :
                                        'bg-yellow-900/20 text-yellow-500 border-yellow-900/50'
                                    }`}>{p.status}</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                            <span>Requests (RPM)</span>
                                            <span>{p.requestsUsed} / {p.requestsLimit}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                                style={{ width: `${usagePercent}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                                        <div className="text-[10px] text-slate-500">
                                            Reset: <span className="text-slate-300 font-mono">{p.resetDate}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            Keys: <span className="text-slate-300 font-mono">{p.activeKeys}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </TacticalCard>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-24 w-full max-w-[1600px] mx-auto">
            
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Новий NAS Турнір"
                icon={<Trophy size={20} className="text-yellow-500 icon-3d-amber"/>}
            >
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Назва Турніру</label>
                        <input 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200"
                            value={newTournament.name}
                            onChange={(e) => setNewTournament({...newTournament, name: e.target.value})}
                            placeholder="e.g. Sales Forecast Q4"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Датасет</label>
                        <select 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200"
                            value={newTournament.dataset}
                            onChange={(e) => setNewTournament({...newTournament, dataset: e.target.value})}
                        >
                            <option value="">Оберіть датасет...</option>
                            <option value="swift_transactions">SWIFT Transactions (Clean)</option>
                            <option value="prozorro_tenders">Prozorro Tenders 2023</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Стратегія Пошуку</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['EVOLUTIONARY', 'REINFORCEMENT', 'DARTS', 'GRID_SEARCH'].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setNewTournament({...newTournament, strategy: s})}
                                    className={`p-2 rounded border text-xs font-bold transition-all ${
                                        newTournament.strategy === s 
                                        ? 'bg-primary-900/20 border-primary-500 text-primary-400' 
                                        : 'bg-slate-900 border-slate-700 text-slate-500'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={handleCreate}
                            disabled={!newTournament.name || !newTournament.dataset}
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded font-bold shadow-lg disabled:opacity-50 btn-3d"
                        >
                            Запустити NAS
                        </button>
                    </div>
                </div>
            </Modal>

            <ViewHeader 
                title="NAS Orchestrator & AutoML"
                icon={<Trophy size={20} className="icon-3d-amber"/>}
                breadcrumbs={['INTELLIGENCE', 'NAS TOURNAMENT']}
                stats={[
                    { label: 'Active Tournaments', value: String(tournaments.filter(t => t.status === 'RUNNING').length), icon: <Activity size={14}/>, color: 'success', animate: true },
                    { label: 'GPU Hours', value: '1,420h', icon: <Zap size={14}/>, color: 'primary' },
                    { label: 'Cost Savings', value: '$450/mo', icon: <DollarSign size={14}/>, color: 'green' },
                ]}
                actions={
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs font-bold flex items-center gap-2 shadow-lg btn-3d btn-3d-amber"
                    >
                        <Plus size={16} /> New Tournament
                    </button>
                }
            />

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/30 rounded-t overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setActiveTab('ARENA')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'ARENA' ? 'border-primary-500 text-primary-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Trophy size={16} /> Active Arena
                </button>
                <button 
                    onClick={() => setActiveTab('LEADERBOARD')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'LEADERBOARD' ? 'border-yellow-500 text-yellow-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <BarChart3 size={16} /> Leaderboard
                </button>
                <button 
                    onClick={() => setActiveTab('PROVIDERS')}
                    className={`flex-1 min-w-[120px] py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'PROVIDERS' ? 'border-green-500 text-green-400 bg-slate-800/30' : 'border-transparent text-slate-500 hover:bg-slate-800/30'}`}
                >
                    <Cloud size={16} /> Providers & Quotas
                </button>
            </div>

            <div className="min-h-[400px]">
                {activeTab === 'ARENA' && renderArena()}
                {activeTab === 'PROVIDERS' && renderProviders()}
                {activeTab === 'LEADERBOARD' && (
                    <TacticalCard title="Global Leaderboard (Champions)">
                        <div className="p-8 text-center text-slate-500">
                            <Trophy size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Global leaderboard placeholder.</p>
                        </div>
                    </TacticalCard>
                )}
            </div>
        </div>
    );
};

export default NasView;
