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
    'databases': { id: 'databases', name: 'Databases & Storage', icon: Database, color: 'emerald', gradient: 'from-emerald-500 to-teal-600', description: 'Persistence and State' },
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
    // 2.1 CI / CD / Delivery
    // -------------------------------------------------------------------------
    {
        id: 'argocd', name: 'ArgoCD', version: '2.9.6', license: 'Apache 2.0', category: 'cicd', layer: 'platform',
        description: 'GitOps Continuous Delivery', roles: ['gitops', 'sync'], required_for: ['deployment'], provides: ['app_sync'],
        used_in: [], status: { declared: true, deployed: true, used: true, health: 'healthy' } // Infrastructure Core
    },
    {
        id: 'github', name: 'GitHub', version: 'SaaS', license: 'Proprietary', category: 'cicd', layer: 'infrastructure',
        description: 'Source Code Management', roles: ['scm'], required_for: ['code_storage'], provides: ['git_repo'],
        used_in: [{ pipelineId: 'global', stageId: 'source' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'gitlab', name: 'GitLab', version: '16.8', license: 'MIT', category: 'cicd', layer: 'infrastructure',
        description: 'Self-hosted SCM', roles: ['scm', 'ci'], required_for: ['private_code'], provides: ['git_repo'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' } // Valid unused alternative
    },
    {
        id: 'argo_rollouts', name: 'Argo Rollouts', version: '1.6.4', license: 'Apache 2.0', category: 'cicd', layer: 'platform',
        description: 'Progressive Delivery', roles: ['canary', 'blue_green'], required_for: ['safe_deploy'], provides: ['traffic_split'],
        depends_on: ['argocd'], used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' } // REDUNDANT
    },
    {
        id: 'tekton', name: 'Tekton', version: '0.56.0', license: 'Apache 2.0', category: 'cicd', layer: 'platform',
        description: 'K8s-native Pipelines', roles: ['ci_runner'], required_for: ['builds'], provides: ['pipeline_crd'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'jenkins', name: 'Jenkins', version: '2.440', license: 'MIT', category: 'cicd', layer: 'platform',
        description: 'Legacy Automation Server', roles: ['automation'], required_for: ['legacy_jobs'], provides: ['build_executor'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'degraded' } // ZOMBIE
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
    {
        id: 'flux', name: 'Flux', version: '2.2.0', license: 'Apache 2.0', category: 'cicd', layer: 'platform',
        description: 'GitOps Operator', roles: ['gitops'], required_for: ['k8s_sync'], provides: ['helm_controller'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'gitea', name: 'Gitea', version: '1.21.0', license: 'MIT', category: 'cicd', layer: 'infrastructure',
        description: 'Lightweight Git Service', roles: ['scm'], required_for: ['internal_code'], provides: ['git_repo'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },

    // -------------------------------------------------------------------------
    // 2.2 Security
    // -------------------------------------------------------------------------
    {
        id: 'keycloak', name: 'Keycloak', version: '23.0.4', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'Identity & Access Management', roles: ['idp'], required_for: ['auth'], provides: ['oidc'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' } // Logic fills usage
    },
    {
        id: 'vault', name: 'Vault', version: '1.15.4', license: 'MPL 2.0', category: 'security', layer: 'infrastructure',
        description: 'Secret Management', roles: ['secrets'], required_for: ['config'], provides: ['kv_store'],
        used_in: [{ pipelineId: 'app_boot', stageId: 'secrets' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'trivy', name: 'Trivy', version: '0.49.0', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'Container Security Scanner', roles: ['vulnerability_scanner'], required_for: ['image_safety'], provides: ['cve_reports'],
        used_in: [{ pipelineId: 'ci_pipeline', stageId: 'scan' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'falco', name: 'Falco', version: '0.37.0', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'Runtime Security', roles: ['intrusion_detection'], required_for: ['audit'], provides: ['threat_alerts'],
        used_in: [{ pipelineId: 'runtime_guard', stageId: 'monitor' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'opa', name: 'OPA / Gatekeeper', version: '3.14.0', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'Policy Engine', roles: ['policy_enforcement'], required_for: ['governance'], provides: ['admission_control'],
        used_in: [{ pipelineId: 'k8s_admission', stageId: 'policy' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'wazuh', name: 'Wazuh', version: '4.7.2', license: 'GPLv2', category: 'security', layer: 'platform',
        description: 'XDR / SIEM', roles: ['endpoint_security'], required_for: ['compliance'], provides: ['log_analysis'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'external_secrets', name: 'External Secrets', version: '0.9.11', license: 'Apache 2.0', category: 'security', layer: 'infrastructure',
        description: 'Secret Sync', roles: ['secret_sync'], required_for: ['vault_k8s'], provides: ['k8s_secrets'],
        used_in: [{ pipelineId: 'inf-security', stageId: 'AUTH' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'kyverno', name: 'Kyverno', version: '1.11.0', license: 'Apache 2.0', category: 'security', layer: 'platform',
        description: 'K8s Policy Engine', roles: ['policy'], required_for: ['best_practices'], provides: ['validation'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'crowdsec', name: 'CrowdSec', version: '1.6.0', license: 'MIT', category: 'security', layer: 'infrastructure',
        description: 'Intrusion Prevention', roles: ['ips'], required_for: ['ddos_protection'], provides: ['blocklist'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },

    // -------------------------------------------------------------------------
    // 2.3 Observability
    // -------------------------------------------------------------------------
    {
        id: 'prometheus', name: 'Prometheus', version: '2.49.1', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Metrics Collection', roles: ['metrics'], required_for: ['monitoring'], provides: ['promql'],
        used_in: [{ pipelineId: 'telemetry', stageId: 'scrape' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'grafana', name: 'Grafana', version: '10.3.1', license: 'AGPLv3', category: 'observability', layer: 'interface',
        description: 'Visualization', roles: ['dashboards'], required_for: ['ops_view'], provides: ['ui'],
        used_in: [{ pipelineId: 'user', stageId: 'view' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'loki', name: 'Loki', version: '2.9.4', license: 'AGPLv3', category: 'observability', layer: 'platform',
        description: 'Log Aggregation', roles: ['logging'], required_for: ['troubleshooting'], provides: ['logql'],
        used_in: [{ pipelineId: 'logging', stageId: 'ingest' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'tempo', name: 'Tempo', version: '2.3.1', license: 'AGPLv3', category: 'observability', layer: 'platform',
        description: 'Distributed Tracing', roles: ['tracing'], required_for: ['perf_analysis'], provides: ['traceql'],
        used_in: [{ pipelineId: 'tracing', stageId: 'export' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'opentelemetry', name: 'OpenTelemetry', version: '0.94.0', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Telemetry Collector', roles: ['collector'], required_for: ['instrumentation'], provides: ['otlp'],
        used_in: [{ pipelineId: 'app_runtime', stageId: 'emit_telemetry' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'alertmanager', name: 'Alertmanager', version: '0.26.0', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Alert Routing', roles: ['alerting'], required_for: ['incident_response'], provides: ['notifications'],
        used_in: [{ pipelineId: 'telemetry', stageId: 'alert' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'victoriametrics', name: 'VictoriaMetrics', version: '1.97.0', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Long-term Metrics', roles: ['tsdb'], required_for: ['history'], provides: ['promql'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'jaeger', name: 'Jaeger', version: '1.53.0', license: 'Apache 2.0', category: 'observability', layer: 'platform',
        description: 'Tracing Backend', roles: ['tracing'], required_for: ['debug'], provides: ['trace_ui'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },

    // -------------------------------------------------------------------------
    // 2.4 ETL / Data Processing
    // -------------------------------------------------------------------------
    {
        id: 'airflow', name: 'Airflow', version: '2.8.1', license: 'Apache 2.0', category: 'etl', layer: 'platform',
        description: 'Workflow Orchestration', roles: ['orchestrator'], required_for: ['batch_jobs'], provides: ['dag_engine'],
        used_in: [{ pipelineId: 'nightly_etl', stageId: 'run' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'dagster', name: 'Dagster', version: '1.6.3', license: 'Apache 2.0', category: 'etl', layer: 'platform',
        description: 'Data Orchestrator', roles: ['orchestrator'], required_for: ['asset_management'], provides: ['asset_graph'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' } // DUPLICATE ROLE (Airflow vs Dagster)
    },
    {
        id: 'spark', name: 'Apache Spark', version: '3.5.0', license: 'Apache 2.0', category: 'etl', layer: 'data',
        description: 'Big Data Engine', roles: ['compute'], required_for: ['heavy_transform'], provides: ['distributed_sql'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'offline' }
    },
    {
        id: 'dbt', name: 'dbt', version: '1.7.6', license: 'Apache 2.0', category: 'etl', layer: 'data',
        description: 'Data Build Tool', roles: ['transformation'], required_for: ['sql_modeling'], provides: ['sql_runner'],
        used_in: [{ pipelineId: 'warehouse_update', stageId: 'transform_model' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'great_expectations', name: 'Great Expectations', version: '0.18.8', license: 'Apache 2.0', category: 'etl', layer: 'data',
        description: 'Data Quality', roles: ['dq'], required_for: ['data_trust'], provides: ['validation'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'flink', name: 'Apache Flink', version: '1.18.0', license: 'Apache 2.0', category: 'etl', layer: 'data',
        description: 'Stream Processing', roles: ['stream_compute'], required_for: ['realtime_analytics'], provides: ['cep'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'soda', name: 'Soda', version: '1.0.0', license: 'Apache 2.0', category: 'etl', layer: 'data',
        description: 'Data Observability', roles: ['dq_check'], required_for: ['data_reliability'], provides: ['health_checks'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },

    // -------------------------------------------------------------------------
    // 2.5 Databases
    // -------------------------------------------------------------------------
    {
        id: 'postgres', name: 'PostgreSQL', version: '16.1', license: 'PostgreSQL', category: 'databases', layer: 'data',
        description: 'Primary Relational DB', roles: ['rdbms'], required_for: ['persistence'], provides: ['sql'],
        used_in: [{ pipelineId: 'core', stageId: 'storage' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'timescaledb', name: 'TimescaleDB', version: '2.13.0', license: 'Apache 2.0', category: 'databases', layer: 'data',
        description: 'Time-series DB', roles: ['time_series'], required_for: ['iot_metrics'], provides: ['ts_sql'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'redis', name: 'Redis', version: '7.2.4', license: 'BSD', category: 'databases', layer: 'data',
        description: 'In-Memory Cache', roles: ['cache', 'message_broker'], required_for: ['performance'], provides: ['kv_fast'],
        used_in: [{ pipelineId: 'api_cache', stageId: 'caching' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'valkey', name: 'Valkey', version: '7.2.5', license: 'BSD', category: 'databases', layer: 'data',
        description: 'Redis Alternative', roles: ['cache'], required_for: ['licensing_freedom'], provides: ['kv_store'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'druid', name: 'Apache Druid', version: '28.0.1', license: 'Apache 2.0', category: 'databases', layer: 'data',
        description: 'Real-time Analytics DB', roles: ['olap'], required_for: ['fast_aggregations'], provides: ['sql'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'clickhouse', name: 'ClickHouse', version: '23.12', license: 'Apache 2.0', category: 'databases', layer: 'data',
        description: 'OLAP Database', roles: ['analytics_db'], required_for: ['fast_analytics'], provides: ['columnar_store'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'minio', name: 'MinIO', version: 'RELEASE.2024-01', license: 'AGPLv3', category: 'databases', layer: 'data',
        description: 'Object Storage', roles: ['s3'], required_for: ['blob_storage'], provides: ['s3_api'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'qdrant', name: 'Qdrant', version: '1.7.4', license: 'Apache 2.0', category: 'databases', layer: 'data',
        description: 'Vector Database', roles: ['vector_db'], required_for: ['rag'], provides: ['vector_search'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'opensearch', name: 'OpenSearch', version: '2.11.1', license: 'Apache 2.0', category: 'databases', layer: 'data',
        description: 'Search Engine', roles: ['search_engine'], required_for: ['fulltext'], provides: ['search_api'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'graphdb', name: 'Neo4j', version: '5.16.0', license: 'GPLv3', category: 'databases', layer: 'data',
        description: 'Graph Database', roles: ['graph_db'], required_for: ['relationships'], provides: ['cypher'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },

    // -------------------------------------------------------------------------
    // 2.6 AI / ML
    // -------------------------------------------------------------------------
    {
        id: 'ollama', name: 'Ollama', version: '0.1.25', license: 'MIT', category: 'ai_ml', layer: 'model',
        description: 'Local LLM Runner', roles: ['inference'], required_for: ['local_ai'], provides: ['llm_api'],
        used_in: [{ pipelineId: 'chat_bot', stageId: 'inference' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'vllm', name: 'vLLM', version: '0.3.0', license: 'Apache 2.0', category: 'ai_ml', layer: 'model',
        description: 'High-Performance Inference', roles: ['inference'], required_for: ['scale_ai'], provides: ['fast_inference'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'langchain', name: 'LangChain', version: '0.1.8', license: 'MIT', category: 'ai_ml', layer: 'application',
        description: 'AI Orchestration', roles: ['ai_logic'], required_for: ['agents'], provides: ['chains'],
        used_in: [{ pipelineId: 'autonomous_agent', stageId: 'logic' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'sentence_transformers', name: 'SentenceTransformers', version: '2.5.0', license: 'Apache 2.0', category: 'ai_ml', layer: 'model',
        description: 'Embedding Generation', roles: ['embedder'], required_for: ['rag'], provides: ['vectors'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'tesseract', name: 'Tesseract', version: '5.3.3', license: 'Apache 2.0', category: 'ai_ml', layer: 'model',
        description: 'OCR Engine', roles: ['ocr'], required_for: ['doc_scan'], provides: ['text_extract'],
        used_in: [], status: { declared: true, deployed: true, used: false, health: 'healthy' }
    },
    {
        id: 'milvus', name: 'Milvus', version: '2.3.9', license: 'Apache 2.0', category: 'ai_ml', layer: 'data',
        description: 'Vector DB', roles: ['vector_store'], required_for: ['scale_search'], provides: ['vector_index'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'langgraph', name: 'LangGraph', version: '0.0.2', license: 'MIT', category: 'ai_ml', layer: 'application',
        description: 'Agentic Workflows', roles: ['graph_agent'], required_for: ['complex_reasoning'], provides: ['stateful_agents'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'weaviate', name: 'Weaviate', version: '1.23.0', license: 'BSD', category: 'ai_ml', layer: 'data',
        description: 'Vector Search Engine', roles: ['vector_db'], required_for: ['knowledge_graph'], provides: ['hybrid_search'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' } // Alternative to Qdrant
    },

    // -------------------------------------------------------------------------
    // 2.7 Orchestration / Infra
    // -------------------------------------------------------------------------
    {
        id: 'k3s', name: 'K3s', version: '1.28.5', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'Lightweight Kubernetes', roles: ['k8s'], required_for: ['runtime'], provides: ['container_api'],
        used_in: [{ pipelineId: 'platform', stageId: 'runtime' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'istio', name: 'Istio', version: '1.20.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'Service Mesh', roles: ['mesh'], required_for: ['mtls'], provides: ['network_control'],
        used_in: [{ pipelineId: 'networking', stageId: 'traffic' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'traefik', name: 'Traefik', version: '2.10.7', license: 'MIT', category: 'orchestration', layer: 'infrastructure',
        description: 'Ingress Controller', roles: ['ingress'], required_for: ['external_access'], provides: ['http_routing'],
        used_in: [{ pipelineId: 'networking', stageId: 'ingress' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'cert_manager', name: 'Cert-Manager', version: '1.14.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'TLS Certificate Manager', roles: ['pki'], required_for: ['https'], provides: ['certificates'],
        used_in: [{ pipelineId: 'security', stageId: 'certs' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'keda', name: 'KEDA', version: '2.13.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'Event-driven Autoscaling', roles: ['autoscaler'], required_for: ['scaling'], provides: ['metrics_scaling'],
        used_in: [{ pipelineId: 'ops', stageId: 'scaling' }], status: { declared: true, deployed: true, used: true, health: 'healthy' }
    },
    {
        id: 'cilium', name: 'Cilium', version: '1.15.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'eBPF CNI', roles: ['cni', 'security'], required_for: ['advanced_net'], provides: ['network_policy'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
    },
    {
        id: 'karpenter', name: 'Karpenter', version: '0.34.0', license: 'Apache 2.0', category: 'orchestration', layer: 'infrastructure',
        description: 'Node Autoscaling', roles: ['node_scaler'], required_for: ['cost_opt'], provides: ['just_in_time_nodes'],
        used_in: [], status: { declared: true, deployed: false, used: false, health: 'offline' }
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
