
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SuperLoopStage, SIContextLog, BrainNodeState, UnifiedAgentState, ArbitrationScore, RAGArtifact, AgentGenome } from '../types';

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
    const [logs, setLogs] = useState<SIContextLog[]>([]);
    const [brainNodes, setBrainNodes] = useState<BrainNodeState[]>(INITIAL_BRAIN_NODES);
    const [activeAgents, setActiveAgents] = useState<UnifiedAgentState[]>(INITIAL_AGENTS);
    const [agentGenomes, setAgentGenomes] = useState<AgentGenome[]>(INITIAL_GENOMES);
    const [nasDiff, setNasDiff] = useState('');
    const [cycleCount, setCycleCount] = useState(1042);
    const [currentScenario, setCurrentScenario] = useState<any>(null);
    const [arbitrationScores, setArbitrationScores] = useState<ArbitrationScore[]>(INITIAL_SCORES);
    const [ragArtifacts, setRagArtifacts] = useState<RAGArtifact[]>([]);
    
    // Manual Trigger Override
    const [manualScenarioId, setManualScenarioId] = useState<number | null>(null);
    
    const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isActiveRef = useRef(false); // Keeps latest state inside async loop

    const resetToIdle = () => {
        setStage('IDLE');
        setActiveAgents(prev => prev.map(a => ({ ...a, status: 'IDLE' })));
        setBrainNodes(prev => prev.map(n => ({ ...n, status: 'IDLE' })));
    };

    const guardActive = () => {
        if (!isActiveRef.current) {
            resetToIdle();
            return true;
        }
        return false;
    };

    const addLog = (type: SIContextLog['type'], source: string, message: string) => {
        setLogs(prev => [...prev, {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString(),
            type,
            source,
            message
        }].slice(-50)); // Keep last 50 logs
    };

    const runLoop = async () => {
        if (!isActiveRef.current) return;

        // 1. SELECT SCENARIO
        const nextScenario = manualScenarioId !== null 
            ? SCENARIOS.find(s => s.id === manualScenarioId) || SCENARIOS[0]
            : SCENARIOS[cycleCount % SCENARIOS.length];
        
        setCurrentScenario(nextScenario);
        setManualScenarioId(null); // Reset manual trigger
        setCycleCount(prev => prev + 1);
        setNasDiff('');
        setRagArtifacts([]); // Clear previous evidence

        // --- STAGE 1: DISCOVERY ---
        setStage('DISCOVERY');
        addLog('INFO', 'СИСТЕМА', `Розпочато Цикл Еволюції #${cycleCount + 1} (${nextScenario.type}).`);
        
        // Activate Scanner Agent
        setActiveAgents(prev => prev.map(a => a.id === nextScenario.triggerAgent ? { ...a, status: 'SCANNING' } : a));
        await new Promise(r => setTimeout(r, 2000));
        if (guardActive()) return;
        addLog('AGENT', nextScenario.triggerAgent, nextScenario.triggerMsg);
        
        // Show RAG Evidence
        if (nextScenario.ragDocs) {
            setRagArtifacts(nextScenario.ragDocs);
            addLog('INFO', 'RAG', `Завантажено ${nextScenario.ragDocs.length} контекстних артефактів з Vector DB.`);
        }

        setActiveAgents(prev => prev.map(a => a.id === nextScenario.triggerAgent ? { ...a, status: 'TRANSMITTING' } : a));
        await new Promise(r => setTimeout(r, 1000));
        if (guardActive()) return;
        setActiveAgents(prev => prev.map(a => a.id === nextScenario.triggerAgent ? { ...a, status: 'IDLE' } : a));

        // --- STAGE 2: DEBATE ---
        setStage('DEBATE');
        addLog('BRAIN', 'SYSTEM', 'Ініціалізація нейро-дебатів. Завантаження контексту...');
        
        for (const turn of nextScenario.debate) {
            setBrainNodes(prev => prev.map(n => n.id === turn.id ? { ...n, status: 'TALKING' } : { ...n, status: 'IDLE' }));
            addLog('BRAIN', turn.id.toUpperCase(), turn.msg);
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
            if (guardActive()) return;
        }
        setBrainNodes(prev => prev.map(n => ({ ...n, status: 'IDLE' })));

        // --- STAGE 3: ARBITRATION ---
        setStage('ARBITRATION');
        setBrainNodes(prev => prev.map(n => n.id === 'arbiter' ? { ...n, status: 'TALKING' } : n));
        addLog('BRAIN', 'АРБІТР', 'Аналіз аргументів. Розрахунок матриці ризиків...');
        await new Promise(r => setTimeout(r, 2000));
        if (guardActive()) return;
        
        // Update Transparency Matrix
        if (nextScenario.scores) {
            setArbitrationScores(nextScenario.scores);
        }

        addLog('SUCCESS', 'АРБІТР', nextScenario.verdict);
        
        // Meta-Learning Hook: Evolve Agent
        if (nextScenario.type === 'META_IMPROVEMENT') {
            setAgentGenomes(prev => prev.map(g => g.agentId === nextScenario.triggerAgent ? { 
                ...g, 
                version: 'v' + (parseFloat(g.version.substring(1)) + 0.01).toFixed(3),
                generation: g.generation + 1,
                evolutionStatus: 'EVOLVING'
            } : g));
            addLog('INFO', 'GENOME', `Ген агента ${nextScenario.triggerAgent} мутовано для кращої точності.`);
        }

        setBrainNodes(prev => prev.map(n => ({ ...n, status: 'IDLE' })));

        // --- STAGE 4: NAS IMPLEMENTATION ---
        setStage('NAS_IMPLEMENTATION');
        addLog('NAS', 'AUTOCODER', nextScenario.nas_action);
        setActiveAgents(prev => prev.map(a => a.id === 'NAS-CODE' ? { ...a, status: 'CODING' } : a));
        
        // Stream Diff
        const lines = nextScenario.diff.split('\n');
        let currentDiff = '';
        for (const line of lines) {
            currentDiff += line + '\n';
            setNasDiff(currentDiff);
            await new Promise(r => setTimeout(r, 500));
            if (guardActive()) return;
        }
        await new Promise(r => setTimeout(r, 1000));
        if (guardActive()) return;
        setActiveAgents(prev => prev.map(a => a.id === 'NAS-CODE' ? { ...a, status: 'IDLE' } : a));

        // --- STAGE 5: DEPLOYMENT ---
        setStage('DEPLOYMENT');
        setActiveAgents(prev => prev.map(a => a.role === 'TESTER' || a.id === 'DEVOPS-01' ? { ...a, status: 'DEPLOYING' } : a));
        addLog('INFO', 'GITOPS', 'Запуск ArgoCD синхронізації...');
        await new Promise(r => setTimeout(r, 2000));
        if (guardActive()) return;
        
        // Reset Agent Evolution Status
        if (nextScenario.type === 'META_IMPROVEMENT') {
             setAgentGenomes(prev => prev.map(g => ({ ...g, evolutionStatus: 'STABLE' })));
        }

        addLog('SUCCESS', 'SYSTEM', `Цикл #${cycleCount + 1} успішно завершено. Патч впроваджено.`);
        setActiveAgents(prev => prev.map(a => ({ ...a, status: 'IDLE' })));
        setStage('IDLE');

        // Loop Continuation
        if (isActive) {
            loopTimeoutRef.current = setTimeout(() => {
                runLoop();
            }, 3000);
        }
    };

    // Effect to start/stop loop
    useEffect(() => {
        isActiveRef.current = isActive;
        if (isActive) {
            runLoop();
        } else {
            if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
            resetToIdle();
        }
        return () => {
            if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
        };
    }, [isActive]); // Dependency on isActive only to trigger start/stop

    const toggleLoop = () => setIsActive(!isActive);
    
    const vetoCycle = () => {
        setIsActive(false);
        if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
        setStage('IDLE');
        addLog('ERROR', 'USER', 'АВАРІЙНЕ ВЕТО! Цикл еволюції примусово зупинено оператором.');
        setActiveAgents(prev => prev.map(a => ({ ...a, status: 'IDLE' })));
        setBrainNodes(prev => prev.map(n => ({ ...n, status: 'IDLE' })));
    };

    const injectScenario = (id: number) => {
        setManualScenarioId(id);
        addLog('INFO', 'USER', `Ін'єкція сценарію ID:${id}. Запуск пріоритетного циклу...`);
        if (!isActive) setIsActive(true); // Auto start if idle
    };

    return (
        <SuperIntelligenceContext.Provider value={{
            isActive,
            toggleLoop,
            vetoCycle,
            injectScenario,
            stage,
            logs,
            brainNodes,
            activeAgents,
            agentGenomes,
            nasDiff,
            cycleCount,
            currentScenario,
            availableScenarios: SCENARIOS,
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
        throw new Error('useSuperIntelligence must be used within a SuperIntelligenceProvider');
    }
    return context;
};
