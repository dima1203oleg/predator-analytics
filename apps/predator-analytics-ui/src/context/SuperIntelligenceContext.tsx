
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SuperLoopStage, SIContextLog, BrainNodeState, UnifiedAgentState, ArbitrationScore, RAGArtifact, AgentGenome } from '../types';
import { api } from '../services/api';

interface SuperIntelligenceContextType {
    isActive: boolean;
    toggleLoop: () => void;
    vetoCycle: () => void; // Human Kill Switch
    injectScenario: (scenarioId: number) => void; // God Mode
    stage: SuperLoopStage;
    logs: SIContextLog[];
    brainNodes: BrainNodeState[];
    activeAgents: UnifiedAgentState[];
    agentGenomes: AgentGenome[]; // DNA of Agents
    nasDiff: string;
    cycleCount: number;
    currentScenario: any;
    availableScenarios: any[];
    arbitrationScores: ArbitrationScore[]; // Transparency Data
    ragArtifacts: RAGArtifact[]; // Evidence Data
}

// Initial Brain Configuration - Models participating in Debate
const INITIAL_BRAIN_NODES: BrainNodeState[] = [
    { id: 'gemini', name: 'Gemini 2.0 Flash', role: 'Архітектор', avatar: 'G', color: '#3b82f6', status: 'IDLE' },
    { id: 'deepseek', name: 'DeepSeek R1', role: 'Критик', avatar: 'D', color: '#a855f7', status: 'IDLE' },
    { id: 'mistral', name: 'Mistral Large', role: 'Безпека', avatar: 'M', color: '#eab308', status: 'IDLE' },
    { id: 'qwen', name: 'Qwen 2.5', role: 'Дані', avatar: 'Q', color: '#ef4444', status: 'IDLE' },
    { id: 'llama', name: 'Llama 3 (Local)', role: 'Приватність', avatar: 'L', color: '#22c55e', status: 'IDLE' },
    { id: 'arbiter', name: 'Gemini 3 Ultra', role: 'АРБІТР', avatar: 'A', color: '#ffffff', status: 'IDLE' }
];

// Initial Agents Configuration - Sensors and Executors
const INITIAL_AGENTS: UnifiedAgentState[] = [
    { id: 'MON-01', name: 'Аналізатор Логів', role: 'SCANNER', status: 'IDLE' },
    { id: 'PERF-01', name: 'Perf-Сканер', role: 'SCANNER', status: 'IDLE' },
    { id: 'SEC-01', name: 'Аудит Безпеки', role: 'SCANNER', status: 'IDLE' },
    { id: 'NAS-CODE', name: 'NAS Кодер', role: 'EXECUTOR', status: 'IDLE' },
    { id: 'QA-TEST', name: 'QA Раннер', role: 'TESTER', status: 'IDLE' },
    { id: 'DEVOPS-01', name: 'GitOps Sync', role: 'EXECUTOR', status: 'IDLE' },
];

const INITIAL_GENOMES: AgentGenome[] = [
    { agentId: 'MON-01', version: 'v1.0.4', generation: 4, capabilities: ['Log Pattern Recognition', 'Anomaly Detection'], evolutionStatus: 'STABLE' },
    { agentId: 'PERF-01', version: 'v2.1.0', generation: 12, capabilities: ['Latency Profiling', 'Resource Forecasting'], evolutionStatus: 'STABLE' },
    { agentId: 'SEC-01', version: 'v1.3.2', generation: 8, capabilities: ['Static Analysis', 'CVE Matching'], evolutionStatus: 'STABLE' },
    { agentId: 'NAS-CODE', version: 'v3.0.0', generation: 25, capabilities: ['Polyglot Coding', 'Refactoring'], evolutionStatus: 'STABLE' },
    { agentId: 'QA-TEST', version: 'v1.1.5', generation: 6, capabilities: ['E2E Testing', 'Fuzzing'], evolutionStatus: 'STABLE' },
    { agentId: 'DEVOPS-01', version: 'v1.0.1', generation: 2, capabilities: ['Helm Templating', 'GitOps Sync'], evolutionStatus: 'STABLE' },
];

// Initial scores for visual filler before first run
const INITIAL_SCORES: ArbitrationScore[] = [
    { modelId: 'gemini', modelName: 'Gemini 2.0', criteria: { safety: 0.8, performance: 0.7, cost: 0.9, logic: 0.8 }, totalScore: 0.8 },
    { modelId: 'deepseek', modelName: 'DeepSeek R1', criteria: { safety: 0.85, performance: 0.8, cost: 0.85, logic: 0.9 }, totalScore: 0.85 }
];

// Seed Logs so the Stream isn't empty - MASSIVELY EXPANDED FOR VISUAL FILL
const INITIAL_LOGS: SIContextLog[] = [
    { id: 'init-0', timestamp: '09:59:55', type: 'INFO', source: 'KERNEL', message: 'Booting Singularity Core v45.0...' },
    { id: 'init-1', timestamp: '10:00:01', type: 'INFO', source: 'SYSTEM', message: 'Neural Core Initialized. Quantum Links Established.' },
    { id: 'init-2', timestamp: '10:00:02', type: 'INFO', source: 'RAG', message: 'Vector Database Connected (Shard 0-5). Indexing 14.2M vectors.' },
    { id: 'init-3', timestamp: '10:00:05', type: 'DEBATE', source: 'GEMINI', message: 'Архітектура системи стабільна. Очікую нових векторів загроз для аналізу.' },
    { id: 'init-4', timestamp: '10:00:06', type: 'DEBATE', source: 'DEEPSEEK', message: 'Підтверджую. Рекомендую провести превентивний скан вразливостей в модулі ua-sources.' },
    { id: 'init-5', timestamp: '10:00:07', type: 'DEBATE', source: 'ARBITER', message: 'Пропозицію прийнято. Агент SEC-01 переведений в режим пасивного сканування.' },
    { id: 'init-6', timestamp: '10:00:10', type: 'INFO', source: 'NAS', message: 'AutoML Scheduler ready. 4 GPU workers idle.' },
    { id: 'init-7', timestamp: '10:00:12', type: 'INFO', source: 'NETWORK', message: 'Mesh topology synchronized. Latency < 2ms.' },
    { id: 'init-8', timestamp: '10:00:15', type: 'WARN', source: 'MEMORY', message: 'Garbage Collection hint: Heap fragmentation 12%.' },
];

const INITIAL_ARTIFACTS: RAGArtifact[] = [
    { id: 'sys-doc', type: 'DOC', source: 'SYSTEM_MANIFEST', preview: 'Primary Directive: Truth-Only Protocol v2... Safety rails engaged.', relevance: 1.0 },
    { id: 'sys-log-2', type: 'LOG', source: 'KERNEL_BOOT', preview: 'Memory initialized at 0x0000FFFF. Integrity check passed.', relevance: 0.8 },
    { id: 'sys-code-3', type: 'CODE', source: 'CORE_PY', preview: 'class PredatorEngine(BaseModel): def __init__(self): ...', relevance: 0.6 }
];

// Rich Boot Code for the Typewriter Effect
const INITIAL_NAS_BOOT_CODE = `
// KERNEL: SINGULARITY v45.0.1
// TARGET: OPTIMIZATION_MATRIX
// -----------------------------------
import torch
import neural_core as nc

class SuperIntelligence(nc.BaseModel):
    def __init__(self):
        self.modules = nc.load_modules(['RAG', 'NAS', 'DEBATE'])
        self.ethics_layer = nc.EthicsLayer(mode='STRICT')
        self.state = 'IDLE'

    async def optimize_loop(self):
        while True:
            metrics = await self.monitor_system()
            if metrics.anomaly > 0.05:
                # Trigger Auto-Correction
                patch = await self.nas.generate_fix(metrics)
                self.deploy(patch)

// MOUNT VOLUMES... OK
// VERIFY GPU LINKAGE... OK (96 Cores)
// ESTABLISH UPLINK... CONNECTED
`;

const SCENARIOS = [
    {
        id: 0,
        name: "Вразливість SQL Injection",
        type: 'SECURITY',
        triggerAgent: 'SEC-01',
        triggerMsg: "Виявлено неекронований ввід користувача у функції `search_tenders()`.",
        ragDocs: [
            { id: 'd1', type: 'CODE', source: 'ua-sources/backend/api.py:142', preview: 'query = f"SELECT * FROM tenders WHERE id = {input_id}"', relevance: 0.99 },
            { id: 'd2', type: 'LOG', source: 'waf-access.log', preview: '403 Forbidden: SELECT * FROM users...', relevance: 0.85 },
            { id: 'd3', type: 'DOC', source: 'OWASP_Top_10.md', preview: 'Injection flaws, such as SQL, NoSQL, OS...', relevance: 0.60 }
        ],
        debate: [
            { id: 'gemini', msg: "Ми повинні негайно параметризувати цей запит." },
            { id: 'deepseek', msg: "Також додайте валідацію довжини вводу, щоб уникнути переповнення буфера." },
            { id: 'mistral', msg: "Я пропоную використати SQLAlchemy ORM для абстракції \"raw\" SQL." },
            { id: 'llama', msg: "Згоден. Я згенерую патч, використовуючи патерни ORM для безпеки." }
        ],
        scores: [
            { modelId: 'gemini', modelName: 'Gemini 2.0', criteria: { safety: 0.9, performance: 0.8, cost: 0.9, logic: 0.85 }, totalScore: 0.88 },
            { modelId: 'mistral', modelName: 'Mistral Large', criteria: { safety: 0.95, performance: 0.7, cost: 0.8, logic: 0.9 }, totalScore: 0.89 },
            { modelId: 'llama', modelName: 'Llama 3', criteria: { safety: 0.8, performance: 0.9, cost: 1.0, logic: 0.8 }, totalScore: 0.85 }
        ],
        verdict: "ЗАТВЕРДЖЕНО: Переписати `search_tenders` використовуючи SQLAlchemy ORM.",
        nas_action: "Рефакторинг `ua-sources/backend/api.py`...",
        diff: `+ query = db.select(Tender).where(Tender.id == input_id)\n- query = f"SELECT * FROM tenders WHERE id = {input_id}"`
    },
    {
        id: 1,
        name: "Сплеск Затримки ETL",
        type: 'PERFORMANCE',
        triggerAgent: 'PERF-01',
        triggerMsg: "Затримка пайплайну синхронізації митниці перевищила поріг 5000мс.",
        ragDocs: [
            { id: 'd4', type: 'LOG', source: 'etl-worker.log', preview: 'Process timed out after 5002ms', relevance: 0.95 },
            { id: 'd5', type: 'CODE', source: 'customs.py:regex', preview: 're.findall(r"(.*?)", content)', relevance: 0.92 }
        ],
        debate: [
            { id: 'qwen', msg: "Регулярний вираз парсингу має експоненціальний бектрекінг." },
            { id: 'gemini', msg: "Давайте замінимо його на скомпільований патерн (pre-compiled)." },
            { id: 'deepseek', msg: "Або перейдемо на потоковий парсер типу `lxml` для великих XML." },
            { id: 'arbiter', msg: "Потокова обробка краща для пам'яті. Використовуємо `lxml`." }
        ],
        scores: [
            { modelId: 'qwen', modelName: 'Qwen 2.5', criteria: { safety: 0.8, performance: 0.95, cost: 0.9, logic: 0.9 }, totalScore: 0.89 },
            { modelId: 'deepseek', modelName: 'DeepSeek R1', criteria: { safety: 0.85, performance: 0.98, cost: 0.8, logic: 0.95 }, totalScore: 0.92 }
        ],
        verdict: "ОПТИМІЗАЦІЯ: Перехід на потоковий XML парсер.",
        nas_action: "Оновлення `ua-sources/etl/customs.py`...",
        diff: `+ context = etree.iterparse(source, events=('end',))\n- doc = etree.parse(source)`
    },
    {
        id: 2,
        name: "Оптимізація Docker Образу",
        type: 'DEVOPS',
        triggerAgent: 'DEVOPS-01',
        triggerMsg: "Розмір образу `predator-backend` перевищив 2.1 GB. Час завантаження pod > 45s.",
        ragDocs: [
            { id: 'd6', type: 'LOG', source: 'k8s-events.log', preview: 'Failed to pull image "predator-backend:latest": rpc error: code = Unknown desc = context deadline exceeded', relevance: 0.98 },
            { id: 'd7', type: 'CODE', source: 'Dockerfile', preview: 'FROM python:3.11-full\nRUN pip install -r requirements.txt', relevance: 0.95 }
        ],
        debate: [
            { id: 'mistral', msg: "Базовий образ `python:3.11-full` занадто великий. Переходимо на `python:3.11-slim`." },
            { id: 'gemini', msg: "Цього недостатньо. Пропоную Multi-stage build для видалення кешу pip та build-dependencies." },
            { id: 'deepseek', msg: "Для максимальної безпеки та мінімізації розміру варто використати `gcr.io/distroless/python3`." },
            { id: 'llama', msg: "Distroless ускладнить дебагінг (немає shell). Пропоную `slim` + multi-stage як компроміс." },
            { id: 'arbiter', msg: "Безпека пріоритетна. Distroless зменшує поверхню атаки. Приймаємо Distroless + Multi-stage." }
        ],
        scores: [
            { modelId: 'mistral', modelName: 'Mistral Large', criteria: { safety: 0.7, performance: 0.8, cost: 0.9, logic: 0.8 }, totalScore: 0.8 },
            { modelId: 'deepseek', modelName: 'DeepSeek R1', criteria: { safety: 0.99, performance: 0.95, cost: 0.9, logic: 0.9 }, totalScore: 0.935 },
            { modelId: 'llama', modelName: 'Llama 3', criteria: { safety: 0.85, performance: 0.9, cost: 0.9, logic: 0.85 }, totalScore: 0.875 }
        ],
        verdict: "АРХІТЕКТУРА: Впровадження Distroless Multi-stage Build.",
        nas_action: "Переписати `Dockerfile` для `predator-backend`...",
        diff: `+ FROM python:3.11-slim AS builder\n+ ...\n+ FROM gcr.io/distroless/python3\n- FROM python:3.11-full`
    },
    {
        id: 3,
        name: "META: Еволюція Агента Безпеки",
        type: 'META_IMPROVEMENT',
        triggerAgent: 'SEC-01',
        triggerMsg: "Агент SEC-01 дав 15% хибнопозитивних спрацювань на безпечний код (False Positive).",
        ragDocs: [
            { id: 'd8', type: 'LOG', source: 'agent-audit.log', preview: 'SEC-01 flagged `user_id` as PII leak in public API response (Incorrect)', relevance: 0.99 },
            { id: 'd9', type: 'DOC', source: 'agent_manifest.yaml', preview: 'system_prompt: "Aggressively flag any potential data leak..."', relevance: 0.95 }
        ],
        debate: [
            { id: 'deepseek', msg: "Системний промпт SEC-01 занадто агресивний. Він не розрізняє публічні ID та PII." },
            { id: 'qwen', msg: "Агент потребує кращого контекстного розуміння схеми даних." },
            { id: 'gemini', msg: "Пропоную оновити `system_prompt` SEC-01, додавши винятки для публічних ключів." },
            { id: 'arbiter', msg: "Згоден. Ініціюю еволюцію агента SEC-01 до версії v1.3.3." }
        ],
        scores: [
            { modelId: 'gemini', modelName: 'Gemini 2.0', criteria: { safety: 0.9, performance: 0.9, cost: 0.9, logic: 0.95 }, totalScore: 0.91 },
            { modelId: 'deepseek', modelName: 'DeepSeek R1', criteria: { safety: 0.8, performance: 0.95, cost: 0.8, logic: 0.9 }, totalScore: 0.86 }
        ],
        verdict: "META-LEARNING: Оновлення ДНК агента SEC-01 (Fine-tuning Prompt).",
        nas_action: "Deployment: SEC-01 v1.3.3...",
        diff: `+ "Context-aware PII detection"\n- "Aggressive PII detection"`
    }
];

const SuperIntelligenceContext = createContext<SuperIntelligenceContextType | undefined>(undefined);

export const SuperIntelligenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [stage, setStage] = useState<SuperLoopStage>('IDLE');
    const [logs, setLogs] = useState<SIContextLog[]>([
        { id: 'boot', timestamp: new Date().toLocaleTimeString(), type: 'INFO', source: 'KERNEL', message: 'Connected to Predator v45 | Neural Analytics. Waiting for stream...' }
    ]);
    const [brainNodes, setBrainNodes] = useState<BrainNodeState[]>(INITIAL_BRAIN_NODES);
    const [activeAgents, setActiveAgents] = useState<UnifiedAgentState[]>(INITIAL_AGENTS);
    const [agentGenomes, setAgentGenomes] = useState<AgentGenome[]>(INITIAL_GENOMES);
    const [nasDiff, setNasDiff] = useState('');
    const [cycleCount, setCycleCount] = useState(0);
    const [currentScenario, setCurrentScenario] = useState<any>(null);
    const [availableScenarios, setAvailableScenarios] = useState<any[]>(SCENARIOS); // Keep for fallbacks/demos if needed
    const [arbitrationScores, setArbitrationScores] = useState<ArbitrationScore[]>(INITIAL_SCORES);
    const [ragArtifacts, setRagArtifacts] = useState<RAGArtifact[]>([]);

    // Manual Trigger: In real mode, this might trigger a backend job
    const injectScenario = async (id: number) => {
        // In real mode, we might want to trigger a specific test or analysis
        api.v45.trinity.process("Run manual analysis scenario " + id);
        setIsActive(true);
    };

    const toggleLoop = () => setIsActive(!isActive);
    const vetoCycle = () => {
        setIsActive(false);
        api.v45.runSystemRollback(); // Real veto
    };

    // Real Data Polling
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchData = async () => {
            try {
                // 0. Fetch Real Stage
                try {
                    const realStage = await api.v45.getSystemStage();
                    setStage(realStage);
                } catch (e) { }

                // 1. Fetch Real Logs (Trinity)
                const realLogs = await api.v45.trinity.getLogs(20);
                if (realLogs && realLogs.length > 0) {
                    const mappedLogs = realLogs.map((l: any) => ({
                        id: l.id,
                        timestamp: new Date(l.created_at).toLocaleTimeString(),
                        type: (l.status === 'verified' ? 'SUCCESS' : l.status === 'error' ? 'ERROR' : 'INFO') as any,
                        source: 'TRINITY',
                        message: `${l.intent}: ${l.request_text}`
                    }));
                    // Merge avoiding duplicates (simple way: just replace or append new)
                    // For simplicity in this stream view, we just show latest 20
                    setLogs(mappedLogs.reverse());

                    // Check for Code Generation in latest log to populate NAS Diff
                    const latestLog = realLogs[0]; // Assuming sorted desc by backend
                    if (latestLog && (latestLog.mistral_output || latestLog.gemini_plan)) {
                        const content = latestLog.mistral_output || latestLog.gemini_plan;
                        if (content && content.length > 20 && content !== nasDiff) {
                            setNasDiff(content.substring(0, 1000) + (content.length > 1000 ? '...' : ''));
                        }
                    }
                }

                // 2. Fetch Council History for "Debate" visualization
                const history = await api.getCouncilHistory(1);
                if (history && history.length > 0) {
                    const latestSession = history[0];
                    // Map session to "Scenario" visualization
                    if (latestSession.id !== currentScenario?.id) {
                        setCurrentScenario({
                            id: latestSession.id,
                            name: "Strategic Analysis (Real)",
                            type: 'STRATEGY',
                            triggerAgent: 'COUNCIL',
                            triggerMsg: latestSession.query,
                            verdict: latestSession.final_answer,
                            debate: [], // Could parse from peer_reviews
                            scores: [] // Could parse from participants
                        });

                        // Update Arbitration Scores from real data if possible
                        // (Mapping logic simplified here)
                    }
                }

                // 3. Map Real LLM Providers to Brain Nodes
                const providers = await api.getNasProviders();
                const sysMetrics = await api.v45.getRealtimeMetrics().catch(() => null);

                if (providers && providers.length > 0) {
                    const realBrainNodes: BrainNodeState[] = providers.map((p: any, idx: number) => ({
                        id: p.id,
                        name: p.name,
                        role: idx === 0 ? 'АРБІТР' : 'ЕКСПЕРТ',
                        avatar: p.name[0],
                        color: p.id === 'google' ? '#3b82f6' : p.id === 'openai' ? '#10b981' : '#a855f7',
                        status: 'IDLE',
                        load: sysMetrics ? (idx === 0 ? sysMetrics.cpu_usage : Math.max(10, sysMetrics.cpu_usage - 15)) : 0
                    }));
                    // Ensure we have at least one Arbiter
                    if (!realBrainNodes.find(n => n.role === 'АРБІТР')) {
                        if (realBrainNodes.length > 0) realBrainNodes[0].role = 'АРБІТР';
                    }
                    setBrainNodes(realBrainNodes);
                }

                // 4. Map Real Infra to Agents
                const infra = await api.getClusterStatus() as any;
                if (infra && infra.nodes) {
                    const realAgents: UnifiedAgentState[] = [];

                    infra.nodes.forEach((node: any) => {
                        // 1. Try to map Pods (Kubernetes mode)
                        if (node.pods && node.pods.length > 0) {
                            node.pods.forEach((pod: any) => {
                                let role: UnifiedAgentState['role'] = 'EXECUTOR';
                                if (pod.type === 'db') role = 'MONITOR';
                                if (pod.type === 'search') role = 'SCANNER';

                                realAgents.push({
                                    id: pod.name.toUpperCase(),
                                    name: `${pod.name} svc`,
                                    role: role,
                                    status: pod.status === 'Running' ? 'IDLE' : 'IDLE'
                                });
                            });
                        }
                        // 2. Fallback: Map the Node itself (Monolith/Docker Compose mode)
                        else {
                            // api.ts returns "nodes" as components in Truth Mode
                            realAgents.push({
                                id: node.name.toUpperCase(),
                                name: node.name,
                                role: 'MONITOR',
                                status: node.status === 'Ready' ? 'IDLE' : 'IDLE'
                            });
                        }
                    });

                    if (realAgents.length > 0) setActiveAgents(realAgents);
                }

                // 5. Fetch Real Arbitration Scores
                try {
                    const scores = await api.v45.ml.getArbitrationScores();
                    if (scores && scores.length > 0) {
                        setArbitrationScores(scores);
                    }
                } catch (e) {
                    console.warn("Could not fetch arbitration scores");
                }

            } catch (e) {
                console.error("Polling error", e);
            }
        };

        if (isActive) {
            fetchData();
            interval = setInterval(fetchData, 3000);
        }

        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <SuperIntelligenceContext.Provider value={{
            isActive,
            toggleLoop,
            vetoCycle,
            injectScenario,
            stage, // Real stage mapping implemented via api.v45.getSystemStage()
            logs,
            brainNodes,
            activeAgents,
            agentGenomes,
            nasDiff,
            cycleCount,
            currentScenario,
            availableScenarios,
            arbitrationScores,
            ragArtifacts
        }}>
            {children}
        </SuperIntelligenceContext.Provider>
    );
};

export const useSuperIntelligence = () => {
    const context = useContext(SuperIntelligenceContext);
    if (context === undefined) {
        console.warn('useSuperIntelligence used outside of SuperIntelligenceProvider - returning defaults');
        return {
            isActive: false,
            toggleLoop: () => { },
            vetoCycle: () => { },
            injectScenario: () => { },
            stage: 'IDLE' as SuperLoopStage,
            logs: [],
            brainNodes: INITIAL_BRAIN_NODES,
            activeAgents: INITIAL_AGENTS,
            agentGenomes: INITIAL_GENOMES,
            nasDiff: '',
            cycleCount: 0,
            currentScenario: null,
            availableScenarios: SCENARIOS,
            arbitrationScores: INITIAL_SCORES,
            ragArtifacts: []
        };
    }
    return context;
};
