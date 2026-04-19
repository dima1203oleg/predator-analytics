import { Activity, Brain, Database, GitBranch, Globe, Layers, Server, Shield, Terminal, Zap } from 'lucide-react';
import { PIPELINES } from './pipelineDefinitions';

// --- Types ---

export interface PipelineUsage {
    pipelineId: string;
    stageId: string;
}

export interface ComponentStatus {
    declared: boolean;
    deployed: boolean;
    used: boolean; // Vital metric: declared && deployed && used
    health: 'healthy' | 'degraded' | 'offline' | 'unknown';
}

export interface PredatorComponent {
    id: string; // Unique slug (e.g., 'qdrant', 'postgres')
    name: string;
    version: string;
    license: string;
    category: 'cicd' | 'security' | 'observability' | 'etl' | 'databases' | 'ai_ml' | 'orchestration' | 'frontend' | 'cli' | 'autonomy';
    layer: 'infrastructure' | 'platform' | 'data' | 'model' | 'application' | 'interface';
    description: string;
    roles: string[]; // Specific roles this component fulfills
    required_for: string[]; // High-level capabilities dependent on this
    provides: string[]; // Technical capabilities provided
    depends_on?: string[]; // IDs of other components
    used_in: PipelineUsage[]; // The "Proof of Life"
    status: ComponentStatus;
    icon?: any; // LucideIcon
}

export interface ComponentCategory {
    id: string;
    name: string;
    icon: any;
    color: string;
    gradient: string;
    description: string;
}

export const CATEGORIES: Record<string, ComponentCategory> = {
    'orchestration': { id: 'orchestration', name: 'Infrastructure & Orchestration', icon: Server, color: 'blue', gradient: 'from-blue-500 to-indigo-600', description: 'Core compute and networking layer' },
    'ai_ml': { id: 'ai_ml', name: 'AI/ML & Cognitive Layer', icon: Brain, color: 'purple', gradient: 'from-purple-500 to-fuchsia-600', description: 'LLMs, Vectors, and Inference' },
    'databases': { id: 'databases', name: 'Databases & Storage', icon: Database, color: 'rose', gradient: 'from-rose-500 to-rose-700', description: 'Persistence and State' },
    'etl': { id: 'etl', name: 'ETL & Data Pipelines', icon: Layers, color: 'cyan', gradient: 'from-cyan-500 to-sky-600', description: 'Data movement and transformation' },
    'observability': { id: 'observability', name: 'Observability & Monitoring', icon: Activity, color: 'amber', gradient: 'from-amber-500 to-orange-600', description: 'Metrics, Logs, Traces' },
    'security': { id: 'security', name: 'Security & Integrity', icon: Shield, color: 'rose', gradient: 'from-rose-500 to-red-600', description: 'Identity, Policy, Secrets' },
    'cicd': { id: 'cicd', name: 'CI/CD & Delivery', icon: GitBranch, color: 'orange', gradient: 'from-orange-500 to-amber-600', description: 'Software delivery lifecycle' },
    'frontend': { id: 'frontend', name: 'Frontend Ecosystem', icon: Globe, color: 'indigo', gradient: 'from-indigo-500 to-violet-600', description: 'User interfaces and experience' },
    'cli': { id: 'cli', name: 'Terminal Tools', icon: Terminal, color: 'slate', gradient: 'from-slate-500 to-gray-600', description: 'Command line utilities' },
    'autonomy': { id: 'autonomy', name: 'Autonomy Core', icon: Zap, color: 'pink', gradient: 'from-pink-500 to-rose-600', description: 'Self-improvement engine' }
};

// --- CU-PIE (Component Utilization & Pipeline Integrity Engine) Data ---

// Mappings from Abstract Pipeline Concepts to Concrete Components
const STAGE_TO_COMPONENT_MAP: Record<string, string[]> = {
    'AUTH': ['keycloak', 'f_auth_service'],
    'VALIDATE': ['great_expectations', 'soda'],
    'OCR': ['tesseract', 'paddle_ocr'],
    'VECTORIZE': ['qdrant', 'sentence_transformers', 'bge_m3'],
    'INDEX_SEARCH': ['opensearch', 'elasticsearch'],
    'LOAD_SQL': ['postgres', 'timescaledb'],
    'BUILD_GRAPH': ['graphdb', 'neo4j'],
    'INGEST_MINIO': ['minio'],
    'PARSE': ['unstructured_io', 'langchain'],
    'TRANSFORM': ['dbt', 'spark'],
    'CRAWL': ['scrapy', 'colly'],

    // System Stage Mappings
    'CHECK_SOURCE': ['github', 'gitlab'],
    'BUILD': ['tekton', 'jenkins'],
    'SCAN_CODE': ['trivy'],
    'DEPLOY': ['argocd', 'argo_rollouts'],
    'PROVISION': ['open_tofu'],
    'MONITOR': ['prometheus', 'falco', 'opentelemetry'],
    'ALERT': ['alertmanager'],
    'LOG': ['loki', 'wazuh'],
    'TRACE': ['tempo'],
    'POLICY': ['opa']
};

const NODE_TO_COMPONENT_MAP: Record<string, string> = {
    'quality': 'great_expectations',
    'minio': 'minio',
    'postgres': 'postgres',
    'graphdb': 'graphdb',
    'opensearch': 'opensearch',
    'qdrant': 'qdrant'
};

// Advanced Proof of Life Logic
const getPipelineUsage = (componentId: string): PipelineUsage[] => {
    const usages: PipelineUsage[] = [];
    Object.values(PIPELINES).forEach(pipeline => {
        // 1. Check Explicit Database Nodes
        if (pipeline.dbNodes.some(node => NODE_TO_COMPONENT_MAP[node] === componentId)) {
            usages.push({ pipelineId: pipeline.id, stageId: 'storage_node' });
        }

        // 2. Check Pipeline Stages (Indirect Usage)
        pipeline.stages.forEach(stage => {
            if (STAGE_TO_COMPONENT_MAP[stage]?.includes(componentId)) {
                usages.push({ pipelineId: pipeline.id, stageId: stage });
            }
        });
    });
    return usages;
};

// --- MASSIVE COMPONENT REGISTRY (Based on ~30 Photos System Truth) ---
const RAW_REGISTRY: PredatorComponent[] = [
    // -------------------------------------------------------------------------
    // 2.1 CI / CD / Delivery (CLEANED)
    // -------------------------------------------------------------------------
    {
        id: 'argocd', name: 'ArgoCD', version: '2.9.6', license: 'Apache 2.0', category: 'cicd', layer: 'platform',
        description: 'GitOps Continuous Delivery', roles: ['gitops', 'sync'], required_for: ['deployment'], provides: ['app_sync'],
        used_in: [], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'github', name: 'GitHub', version: 'SaaS', license: 'Proprietary', category: 'cicd', layer: 'infrastructure',
        description: 'Source Code Management', roles: ['scm'], required_for: ['code_storage'], provides: ['git_repo'],
        used_in: [{ pipelineId: 'global', stageId: 'source' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'renovate', name: 'Renovate', version: '37.165', license: 'AGPLv3', category: 'cicd', layer: 'platform',
        description: 'Dependency Update Bot', roles: ['dependency_manager'], required_for: ['security_updates'], provides: ['auto_pr'],
        used_in: [{ pipelineId: 'maintenance', stageId: 'deps_update' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'open_tofu', name: 'OpenTofu', version: '1.6.1', license: 'MPL 2.0', category: 'cicd', layer: 'infrastructure',
        description: 'Infrastructure as Code', roles: ['iac'], required_for: ['provisioning'], provides: ['state_management'],
        used_in: [{ pipelineId: 'infra_provision', stageId: 'apply' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },

    // -------------------------------------------------------------------------
    // 2.2 Security (ACTIVE ONLY)
    // -------------------------------------------------------------------------
    {
        id: 'vault', name: 'Vault', version: '1.15.4', license: 'MPL 2.0', category: 'security', layer: 'infrastructure',
        description: 'Secret Management', roles: ['secrets'], required_for: ['config'], provides: ['kv_store'],
        used_in: [{ pipelineId: 'app_boot', stageId: 'secrets' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'trivy', name: 'Trivy', version: '0.49.0', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'Vulnerability Scanner', roles: ['scanner'], required_for: ['safety'], provides: ['reports'],
        used_in: [{ pipelineId: 'ci_pipeline', stageId: 'scan' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'falco', name: 'Falco', version: '0.37.0', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'Runtime Security', roles: ['ids'], required_for: ['audit'], provides: ['alerts'],
        used_in: [{ pipelineId: 'runtime_guard', stageId: 'monitor' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'opa', name: 'OPA', version: '3.14.0', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'Policy Engine', roles: ['policy'], required_for: ['governance'], provides: ['admission'],
        used_in: [{ pipelineId: 'k8s_admission', stageId: 'policy' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'external_secrets', name: 'External Secrets', version: '0.9.11', license: 'Apache 2.0', category: 'security', layer: 'infrastructure',
        description: 'Secret Sync', roles: ['sync'], required_for: ['k8s'], provides: ['secrets'],
        used_in: [{ pipelineId: 'inf-security', stageId: 'AUTH' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },

    // -------------------------------------------------------------------------
    // 2.3 Observability (CORE STACK)
    // -------------------------------------------------------------------------
    {
        id: 'prometheus', name: 'Prometheus', version: '2.49.1', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Metrics Collection', roles: ['metrics'], required_for: ['monitoring'], provides: ['promql'],
        used_in: [{ pipelineId: 'telemetry', stageId: 'scrape' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'grafana', name: 'Grafana', version: '10.3.1', license: 'AGPLv3', category: 'observability', layer: 'interface',
        description: 'Visualization', roles: ['ui'], required_for: ['ops'], provides: ['dashboards'],
        used_in: [{ pipelineId: 'user', stageId: 'view' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'loki', name: 'Loki', version: '2.9.4', license: 'AGPLv3', category: 'observability', layer: 'platform',
        description: 'Log Aggregation', roles: ['logs'], required_for: ['debug'], provides: ['logql'],
        used_in: [{ pipelineId: 'logging', stageId: 'ingest' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'tempo', name: 'Tempo', version: '2.3.1', license: 'AGPLv3', category: 'observability', layer: 'platform',
        description: 'Tracing', roles: ['traces'], required_for: ['performance'], provides: ['traceql'],
        used_in: [{ pipelineId: 'tracing', stageId: 'export' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'opentelemetry', name: 'OpenTelemetry', version: '0.94.0', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Telemetry Collector', roles: ['collector'], required_for: ['traces'], provides: ['otlp'],
        used_in: [{ pipelineId: 'app_runtime', stageId: 'emit_telemetry' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'alertmanager', name: 'Alertmanager', version: '0.26.0', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Alert Routing', roles: ['alerts'], required_for: ['incidents'], provides: ['notifications'],
        used_in: [{ pipelineId: 'telemetry', stageId: 'alert' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },

    // -------------------------------------------------------------------------
    // 2.4 ETL / Data Processing (REDUCED)
    // -------------------------------------------------------------------------
    {
        id: 'airflow', name: 'Airflow', version: '2.8.1', license: 'Apache 2.0', category: 'etl', layer: 'platform',
        description: 'Orchestration', roles: ['dag'], required_for: ['etl'], provides: ['scheduler'],
        used_in: [{ pipelineId: 'nightly_etl', stageId: 'run' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'dbt', name: 'dbt', version: '1.7.6', license: 'Apache 2.0', category: 'etl', layer: 'data',
        description: 'SQL Modeling', roles: ['transform'], required_for: ['warehouse'], provides: ['models'],
        used_in: [{ pipelineId: 'warehouse_update', stageId: 'transform_model' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },

    // -------------------------------------------------------------------------
    // 2.5 Databases (TRUE LAKES)
    // -------------------------------------------------------------------------
    {
        id: 'postgres', name: 'PostgreSQL', version: '16.1', license: 'PostgreSQL', category: 'databases', layer: 'data',
        description: 'Relational DB', roles: ['sql'], required_for: ['apps'], provides: ['persistence'],
        used_in: [{ pipelineId: 'core', stageId: 'storage' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'redis', name: 'Redis', version: '7.2.4', license: 'BSD', category: 'databases', layer: 'data',
        description: 'Cache', roles: ['kv'], required_for: ['speed'], provides: ['caching'],
        used_in: [{ pipelineId: 'api_cache', stageId: 'caching' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'minio', name: 'MinIO', version: 'RELEASE.2024-01', license: 'AGPLv3', category: 'databases', layer: 'data',
        description: 'Object Storage', roles: ['s3'], required_for: ['files'], provides: ['blobs'],
        used_in: [{ pipelineId: 'global', stageId: 'INGEST_MINIO' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'qdrant', name: 'Qdrant', version: '1.7.4', license: 'Apache 2.0', category: 'databases', layer: 'data',
        description: 'Vector DB', roles: ['vector'], required_for: ['ai'], provides: ['search'],
        used_in: [{ pipelineId: 'global', stageId: 'VECTORIZE' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'opensearch', name: 'OpenSearch', version: '2.11.1', license: 'Apache 2.0', category: 'databases', layer: 'data',
        description: 'Search Engine', roles: ['fulltext'], required_for: ['search'], provides: ['indexing'],
        used_in: [{ pipelineId: 'global', stageId: 'INDEX_SEARCH' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'graphdb', name: 'Neo4j', version: '5.16.0', license: 'GPLv3', category: 'databases', layer: 'data',
        description: 'Graph DB', roles: ['graph'], required_for: ['relations'], provides: ['cypher'],
        used_in: [{ pipelineId: 'global', stageId: 'BUILD_GRAPH' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },

    // -------------------------------------------------------------------------
    // 2.6 AI / ML (INTELLIGENCE CORE)
    // -------------------------------------------------------------------------
    {
        id: 'ollama', name: 'Ollama', version: '0.1.25', license: 'MIT', category: 'ai_ml', layer: 'model',
        description: 'LLM Runner', roles: ['inference'], required_for: ['chat'], provides: ['models'],
        used_in: [{ pipelineId: 'chat_bot', stageId: 'inference' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'langchain', name: 'LangChain', version: '0.1.8', license: 'MIT', category: 'ai_ml', layer: 'application',
        description: 'AI Orchestration', roles: ['logic'], required_for: ['agents'], provides: ['chains'],
        used_in: [{ pipelineId: 'autonomous_agent', stageId: 'logic' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'sentence_transformers', name: 'SentenceTransformers', version: '2.5.0', license: 'Apache 2.0', category: 'ai_ml', layer: 'model',
        description: 'Embedders', roles: ['vectors'], required_for: ['rag'], provides: ['embeddings'],
        used_in: [{ pipelineId: 'global', stageId: 'VECTORIZE' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'tesseract', name: 'Tesseract', version: '5.3.3', license: 'Apache 2.0', category: 'ai_ml', layer: 'model',
        description: 'OCR', roles: ['vision'], required_for: ['docs'], provides: ['text'],
        used_in: [{ pipelineId: 'global', stageId: 'OCR' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },

    // -------------------------------------------------------------------------
    // 2.7 Orchestration (RUNTIME)
    // -------------------------------------------------------------------------
    {
        id: 'k3s', name: 'K3s', version: '1.28.5', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'Kubernetes', roles: ['k8s'], required_for: ['apps'], provides: ['runtime'],
        used_in: [{ pipelineId: 'platform', stageId: 'runtime' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'istio', name: 'Istio', version: '1.20.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'Service Mesh', roles: ['mesh'], required_for: ['mtls'], provides: ['traffic'],
        used_in: [{ pipelineId: 'networking', stageId: 'traffic' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'traefik', name: 'Traefik', version: '2.10.7', license: 'MIT', category: 'orchestration', layer: 'infrastructure',
        description: 'Ingress', roles: ['proxy'], required_for: ['web'], provides: ['routing'],
        used_in: [{ pipelineId: 'networking', stageId: 'ingress' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'cert_manager', name: 'Cert-Manager', version: '1.14.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'PKI', roles: ['certs'], required_for: ['ssl'], provides: ['tls'],
        used_in: [{ pipelineId: 'security', stageId: 'certs' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'keda', name: 'KEDA', version: '2.13.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'Autoscaling', roles: ['scaling'], required_for: ['load'], provides: ['hpa'],
        used_in: [{ pipelineId: 'ops', stageId: 'scaling' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    }
];

// CALCULATE FINAL REGISTRY WITH USAGE
export const COMPONENT_REGISTRY = RAW_REGISTRY.map(comp => {
    // 1. Calculate automated pipeline usage (from config)
    const automatedUsage = getPipelineUsage(comp.id);

    // 2. Combine with manual usage (for infrastructure components not in data pipelines)
    const totalUsage = [...comp.used_in, ...automatedUsage];

    // 3. Remove duplicates
    const uniqueUsage = totalUsage.filter((v, i, a) => a.findIndex(t => (t.pipelineId === v.pipelineId && t.stageId === v.stageId)) === i);

    return {
        ...comp,
        used_in: uniqueUsage,
        status: {
            ...comp.status,
            used: uniqueUsage.length > 0 || comp.status.used // Keep manual 'used' override if true
        }
    };
});

// Calculation of System Stats
export const SYSTEM_STATS = {
    total: COMPONENT_REGISTRY.length,
    active: COMPONENT_REGISTRY.filter(c => c.status.used).length,
    unused: COMPONENT_REGISTRY.filter(c => !c.status.used).length,
    health: Math.round((COMPONENT_REGISTRY.filter(c => c.status.health === 'healthy').length / COMPONENT_REGISTRY.length) * 100)
};
