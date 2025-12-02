
import React from 'react';

export enum TabView {
  DASHBOARD = 'dashboard',
  USER_PORTAL = 'user_portal', // Client UI
  INTEGRATION = 'integration', // API Keys & Sources
  DATA = 'data',        // Storage
  ETL = 'etl',          // Parsing
  AGENTS = 'agents',    // MAS
  SUPER_INTELLIGENCE = 'super_intelligence', // Evolution
  NAS = 'nas',          // NEW: Neural Architecture Search
  DEVOPS = 'devops',    // Deployment
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  LLM = 'llm',
  SECURITY = 'security',
  MONITORING = 'monitoring',
  SYSTEM_BRAIN = 'system_brain' 
}

// --- NAS & AUTOML TYPES ---
export type NasStrategy = 'EVOLUTIONARY' | 'REINFORCEMENT' | 'DARTS' | 'GRID_SEARCH';
export type TaskType = 'CLASSIFICATION' | 'REGRESSION' | 'ANOMALY_DETECTION' | 'FORECASTING';

export interface NasTournament {
    id: string;
    topicId: string;
    name: string;
    datasetId: string;
    strategy: NasStrategy;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    currentGeneration: number;
    maxGenerations: number;
    candidatesCount: number;
    bestScore: number;
    startTime: string;
    duration: string;
}

export interface ModelCandidate {
    id: string;
    tournamentId: string;
    architecture: string; // e.g., "Transformer-Encoder-L4-H256"
    generation: number;
    metrics: {
        accuracy: number;
        latency: number;
        f1: number;
        params: number;
    };
    status: 'TRAINING' | 'EVALUATING' | 'COMPLETED' | 'PRUNED';
    provider: string; // "mistral", "google", etc. used for training
}

export interface ProviderQuota {
    id: string;
    name: string;
    model: string;
    tier: 'FREE' | 'PAID' | 'ENTERPRISE';
    requestsUsed: number;
    requestsLimit: number;
    tokensUsed: number;
    tokensLimit: number;
    resetDate: string;
    status: 'OK' | 'WARNING' | 'EXHAUSTED';
    activeKeys: number;
}

// --- BRAIN & DEBATE TYPES ---
export interface BrainModel {
    id: string;
    name: string;
    provider: string;
    avatar: string; // e.g. "G", "C", "L"
    status: 'IDLE' | 'THINKING' | 'WAITING' | 'DEBATING' | 'FINALIZING';
    color: string;
    currentThought?: string;
}

export type DebatePhase = 'IDLE' | 'PROPOSING' | 'CROSS_CRITIQUE' | 'ARBITRATION' | 'NAS_IMPLEMENTATION' | 'DEPLOYMENT';

export interface DebateMessage {
    id: string;
    modelId: string;
    modelName: string;
    type: 'ARGUMENT' | 'CRITIQUE' | 'FINAL_VERDICT' | 'CONSENSUS';
    content: string;
    timestamp: Date;
    targetModelId?: string; // If critiquing specific model
}

// --- LLM ROUTER TYPES ---
export interface LLMProviderAccount {
    id: string;
    name: string;
    maskedKey: string;
    status: 'ACTIVE' | 'RATE_LIMITED' | 'EXPIRED';
    usage: number; // % of quota
}

export interface AdvancedLLMProvider {
    id: string;
    name: string; // e.g. "Google Gemini", "OpenAI"
    models: string[]; // ["gemini-1.5-pro", "gemini-flash"]
    accounts: LLMProviderAccount[];
    strategy: 'ROUND_ROBIN' | 'LEAST_USED' | 'PRIORITY';
}

export interface AgentModelMapping {
    agentId: string;
    agentName: string;
    mode: 'AUTO' | 'MANUAL';
    selectedModel?: string; // e.g. "gemini-1.5-pro"
}

// --- EXISTING TYPES (Keep for compatibility) ---
export type ToastType = 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
export interface ToastMessage { id: string; type: ToastType; title: string; message: string; duration?: number; }
export interface MetricCardProps { title: string; value: string | number; trend?: string; trendUp?: boolean; icon: React.ReactNode; alert?: boolean; }
export interface LogEntry { id: string; timestamp: string; user: string; action: string; ip: string; status: 'SUCCESS' | 'FAILURE' | 'WARNING'; }
export interface Agent { id: string; name: string; clan: string; type: string; status: string; efficiency: number; lastAction: string; }
export type CyclePhase = 'IDLE' | 'SCANNING' | 'PLANNING' | 'CODING' | 'TESTING' | 'SKEPTIC_REVIEW' | 'ARBITRATION' | 'PR_REVIEW' | 'CI_CD' | 'DEPLOYED';
export interface AgentPR { id: number; title: string; author: string; status: 'OPEN' | 'MERGED' | 'CLOSED'; checks: 'PASSING' | 'RUNNING' | 'FAILED'; diffStats: string; description: string; changes: any[]; riskLevel: string; aiReasoning?: string; }
export interface UAConnector { id: string; name: string; category: string; authType: string; status: string; rpm: number; latency: number; endpoint: string; }
export interface DatabaseTable { id: string; name: string; type: string; records: number; size: string; lastUpdated: string; status: string; }
export interface EtlJob { id: string; pipeline: string; status: string; records: number; duration: string; timestamp: string; }
export interface ServiceStatus { name: string; status: string; uptime: string; latency: number; }
export interface Pod { id: string; name: string; namespace: string; status: string; restarts: number; age: string; cpu: string; mem: string; type: string; gpu?: boolean; ready?: string; }
export interface ClusterNode { name: string; role: string; status: string; cpuUsage: number; memUsage: number; gpuUsage?: number; pods: Pod[]; features?: string[]; }
export interface CommandLog { id: string; command: string; output: React.ReactNode; timestamp: string; }
export interface SearchResult { entity: string; type: string; risk: string; relevance: number; verified: boolean; source: string; vault_key: string; }
export interface UnifiedAgentState { id: string; name: string; role: 'SCANNER' | 'EXECUTOR' | 'TESTER' | 'MONITOR'; status: 'IDLE' | 'SCANNING' | 'TRANSMITTING' | 'CODING' | 'TESTING' | 'DEPLOYING'; }
export interface DataSourceUser { id: string; name: string; description: string; versions: { id: string; version: number; rows: number; status: string }[]; }
export interface SqlTrainingPair { id: string; question: string; generatedSql: string; schema: string; confidence: number; status: 'PENDING' | 'VERIFIED' | 'REJECTED'; timestamp: string; }
export interface AgentConfig { id: string; name: string; role: string; model: string; permission: 'FULL_ACCESS' | 'READ_ONLY' | 'PROPOSE_PR' | 'AUTO_MERGE'; dailyBudgetUsd: number; currentSpendUsd: number; status: 'ACTIVE' | 'PAUSED'; }
export interface IntegrationSecret { id: string; name: string; category: 'INFRA' | 'GOV' | 'LLM' | 'BOT' | 'CYBER'; keyName: string; status: 'ACTIVE' | 'MISSING' | 'INVALID' | 'SYNCING'; lastChecked: string; description: string; vaultPath: string; isCritical?: boolean; requiresFile?: boolean; }
export interface SagaStep { id: string; service: string; action: string; status: 'COMPLETED' | 'FAILED' | 'COMPENSATED'; logs: string; compensatingAction?: string; }
export interface SagaTransaction { id: string; traceId: string; name: string; status: 'COMPLETED' | 'COMPENSATED' | 'FAILED' | 'ACTIVE'; startTime: string; steps: SagaStep[]; }
export interface DSPyOptimization { id: string; moduleName: string; targetMetric: string; startingScore: number; currentScore: number; iterations: number; status: 'OPTIMIZING' | 'CONVERGED'; bestPromptSnippet: string; lastImprovement: string; }
export interface EvolutionEvent { id: string; version: string; type: 'BUGFIX' | 'FEATURE' | 'OPTIMIZATION' | 'SECURITY'; description: string; timestamp: string; status: 'SUCCESS' | 'FAILED'; metrics_impact: string; }
export interface RiskForecast { day: string; risk: number; confidence: number; }
export type EvolutionPhase = 'IDLE' | 'DETECTION' | 'BRAIN_DEBATE' | 'NAS_CODING' | 'VERIFICATION' | 'DEPLOYMENT' | 'COMPLETED';
export interface DataSourceFile { id: string; name: string; format: 'CSV' | 'EXCEL' | 'PDF' | 'JSON' | 'PARQUET'; category: DataSector; size: string; status: 'INDEXED' | 'PROCESSING' | 'ERROR'; flags: { minio: boolean; openSearch: boolean; qdrant: boolean }; lastSync?: string; }
export interface DataSourceWeb { id: string; name: string; url: string; type: 'TELEGRAM' | 'WEBSITE' | 'RSS'; parser: 'Telethon' | 'Playwright' | 'Scrapy'; schedule: string; status: 'ACTIVE' | 'PAUSED' | 'ERROR'; category: DataSector; lastSync?: string; itemsCount?: number; }
export interface DataSourceAPI { id: string; name: string; baseUrl: string; authType: 'API_KEY' | 'OAUTH' | 'EDS' | 'NONE'; vaultSecret: string; status: 'ONLINE' | 'OFFLINE'; category: DataSector; lastSync?: string; }
export interface TelegramBotConfig { id: string; name: string; username: string; description: string; vaultTokenRef: string; webhookUrl: string; whitelist: string[]; roles: string[]; status: 'ACTIVE' | 'PAUSED'; permissions: { clusterControl: boolean; healthAnalytics: boolean; osintAccess: boolean }; llmMode: 'MANUAL' | 'AUTO'; }
export interface LLMProvider { id: string; name: string; type: 'CLOUD' | 'LOCAL' | 'FALLBACK'; model: string; vaultRef: string; priority: number; status: 'ACTIVE' | 'STANDBY'; accountsCount: number; rotationStrategy: 'ROUND_ROBIN' | 'FAILOVER'; currentLoad: number; }
export interface LLMConfig { mode: 'MANUAL' | 'AUTO' | 'ROBUST_FALLBACK'; providers: LLMProvider[]; arbiter: any; }
export interface OpponentResponse { answer: string; sources: { type: string; name: string; details: string; relevance: number }[]; model: { mode: string; name: string; confidence: number; executionTimeMs: number }; }
export interface DataCatalogItem { id: string; name: string; description: string; category: DataSector; type: 'REGISTRY' | 'DATASET' | 'STREAM'; status: 'LIVE' | 'STALE' | 'OFFLINE'; records: number; lastUpdate: string; qualityScore: number; layer: 'BRONZE' | 'SILVER' | 'GOLD'; owner: string; pipelines?: string[]; }
export interface UserDatasetTemplate { id: string; name: string; fileType: string; size: string; sector: DataSector; isTemplate: boolean; autoGenEnabled: boolean; lastSync: string; rows: number; description?: string; }
export interface AutoGeneratedDataset { id: string; name: string; sourceTemplateId: string; templateName?: string; rows: number; status: 'READY' | 'BUILDING' | 'FAILED'; nextUpdate: string; usedInGazette: boolean; sector: DataSector; updateFrequency: string; }
export interface WizardData { type?: any; subType?: string; name?: string; connection?: { url?: string; method?: string; authType?: string; secretRef?: string; file?: File | null; }; schema?: { mappings: { source: string; target: string; type: string }[]; }; classification?: { sector: DataSector; isCritical: boolean; forTraining: boolean; }; schedule?: { mode: 'CRON' | 'MANUAL' | 'STREAM'; cronExpression?: string; }; }
export interface DeploymentPod { id: string; name: string; status: string; ready: string; restarts: number; cpu: string; mem: string; gpu?: boolean; }
export interface DeploymentEnvironment { id: string; name: string; machineName: string; clusterInfo: string; ip: string; arch: 'amd64' | 'arm64'; type: 'DEV' | 'PROD' | 'CLOUD'; status: 'ONLINE' | 'OFFLINE' | 'DEGRADED'; gitStatus: 'SYNCED' | 'DRIFTING' | 'SYNCING'; version: string; targetVersion: string; lastSync: string; progress: number; pods: DeploymentPod[]; logs: string[]; }
export interface PipelineStep { name: string; status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'SKIPPED'; duration?: string; }
export interface PipelineRun { id: string; status: 'SUCCESS' | 'FAILED' | 'RUNNING'; commitMessage: string; branch: string; author: string; timestamp: string; duration: string; type: 'FULL_DEPLOY' | 'TEST_ONLY'; environments: { mac: boolean; nvidia: boolean; oracle: boolean }; steps: PipelineStep[]; }
export interface GazetteArticle { id: number; category: string; title: string; summary: string; fullText: string; time: string; color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'; impactLevel?: 'HIGH' | 'MED' | 'LOW'; }
export type SuperLoopStage = 'IDLE' | 'DISCOVERY' | 'DEBATE' | 'ARBITRATION' | 'NAS_IMPLEMENTATION' | 'VERIFICATION' | 'DEPLOYMENT' | 'COMPLETED';
export interface BrainNodeState { id: string; name: string; role: string; avatar: string; color: string; status: 'IDLE' | 'THINKING' | 'TALKING' | 'VOTING' | 'WAITING'; }
export interface SIContextLog { id: string; timestamp: string; type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'BRAIN' | 'NAS' | 'AGENT'; source: string; message: string; }
export interface ArbitrationScore { modelId: string; modelName: string; criteria: { safety: number; performance: number; cost: number; logic: number; }; totalScore: number; }
export interface RAGArtifact { id: string; type: 'DOC' | 'LOG' | 'VECTOR' | 'CODE'; source: string; preview: string; relevance: number; }
export interface AgentGenome { agentId: string; version: string; generation: number; capabilities: string[]; evolutionStatus: 'STABLE' | 'EVOLVING' | 'PROMOTED'; }
export type DataSector = 'GOV' | 'BIZ' | 'MED' | 'SCI' | 'OSINT' | 'GENERAL';
export type SourceType = 'FILE' | 'WEB' | 'API' | 'REGISTRY';
