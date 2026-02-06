
import {
    Activity,
    AlertTriangle,
    Brain,
    CheckCircle,
    Database,
    File as FileIcon,
    FileText,
    Globe,
    HardDrive,
    Key,
    Layers,
    LucideIcon,
    MessageSquare,
    RefreshCw,
    Search,
    Share2,
    Shield,
    Sparkles,
    Users,
    Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. STAGE DEFINITIONS (Building Blocks)
// ═══════════════════════════════════════════════════════════════════════════

export interface PipelineStageDef {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    description?: string;
}

export const STAGE_LIBRARY: Record<string, PipelineStageDef> = {
    // Phase 1: Ingestion
    CREATED: { id: 'CREATED', label: 'Init', icon: Sparkles, color: 'slate', description: 'Pipeline initialization' },
    AUTH: { id: 'AUTH', label: 'Auth', icon: Key, color: 'amber', description: 'Authentication & Access' },
    FETCH: { id: 'FETCH', label: 'Fetch', icon: Activity, color: 'blue', description: 'Fetching external data' },
    UPLOAD: { id: 'UPLOAD', label: 'Upload', icon: HardDrive, color: 'blue', description: 'File upload to buffer' },
    STREAM: { id: 'STREAM', label: 'Stream', icon: Zap, color: 'blue', description: 'Real-time data streaming' },
    CRAWL: { id: 'CRAWL', label: 'Crawl', icon: Globe, color: 'purple', description: 'Web crawling & discovery' },

    // Phase 2: Processing
    CHECK_SOURCE: { id: 'CHECK_SOURCE', label: 'Check', icon: AlertTriangle, color: 'amber', description: 'Source validity check' },
    INGEST_MINIO: { id: 'INGEST_MINIO', label: 'MinIO', icon: HardDrive, color: 'cyan', description: 'Raw storage' },
    DECODE: { id: 'DECODE', label: 'Decode', icon: FileIcon, color: 'cyan', description: 'Media decoding' },
    PARSE: { id: 'PARSE', label: 'Parsing', icon: FileText, color: 'cyan', description: 'Structure extraction' },
    EXTRACT_CONTENT: { id: 'EXTRACT_CONTENT', label: 'Extract', icon: Layers, color: 'cyan', description: 'Content extraction' },
    OCR: { id: 'OCR', label: 'OCR', icon: Layers, color: 'cyan', description: 'Visual text recognition' },
    TRANSCRIPT: { id: 'TRANSCRIPT', label: 'Transcript', icon: MessageSquare, color: 'pink', description: 'Audio/Video transcription' },
    CHUNK: { id: 'CHUNK', label: 'Chunking', icon: Layers, color: 'indigo', description: 'Semantic segmentation' },

    // Phase 3: Validation & Transformation
    VALIDATE: { id: 'VALIDATE', label: 'DQ Check', icon: Shield, color: 'yellow', description: 'Data quality assurance' },
    TRANSFORM: { id: 'TRANSFORM', label: 'Transform', icon: RefreshCw, color: 'purple', description: 'Schema normalization' },
    NORMALIZE: { id: 'NORMALIZE', label: 'Normalize', icon: CheckCircle, color: 'emerald', description: 'Data normalization' },
    RESOLVE_ENTITIES: { id: 'RESOLVE_ENTITIES', label: 'Entities', icon: Users, color: 'violet', description: 'Identity resolution' },

    // Infrastructure & System Stages
    BUILD: { id: 'BUILD', label: 'Build', icon: Layers, color: 'blue', description: 'Artifact construction' },
    TEST: { id: 'TEST', label: 'Test', icon: CheckCircle, color: 'green', description: 'Automated testing' },
    SCAN_CODE: { id: 'SCAN_CODE', label: 'Sec Scan', icon: Shield, color: 'red', description: 'Static analysis' },
    DEPLOY: { id: 'DEPLOY', label: 'Deploy', icon: RefreshCw, color: 'cyan', description: 'K8s deployment' },
    PROVISION: { id: 'PROVISION', label: 'Provision', icon: HardDrive, color: 'slate', description: 'IaC apply' },
    MONITOR: { id: 'MONITOR', label: 'Monitor', icon: Activity, color: 'amber', description: 'Health tracking' },
    ALERT: { id: 'ALERT', label: 'Alert', icon: AlertTriangle, color: 'orange', description: 'Incident triggering' },
    LOG: { id: 'LOG', label: 'Log', icon: FileText, color: 'slate', description: 'Log ingestion' },
    TRACE: { id: 'TRACE', label: 'Trace', icon: Activity, color: 'blue', description: 'Distributed tracing' },
    POLICY: { id: 'POLICY', label: 'Policy', icon: Shield, color: 'red', description: 'Governance check' },

    // Phase 4: Storage & Indexing
    LOAD_SQL: { id: 'LOAD_SQL', label: 'PostgreSQL', icon: Database, color: 'green', description: 'Relational storage' },
    BUILD_GRAPH: { id: 'BUILD_GRAPH', label: 'Graph DB', icon: Share2, color: 'pink', description: 'Relationship mapping' },
    INDEX_SEARCH: { id: 'INDEX_SEARCH', label: 'OpenSearch', icon: Search, color: 'orange', description: 'Full-text indexing' },
    VECTORIZE: { id: 'VECTORIZE', label: 'Qdrant', icon: Brain, color: 'indigo', description: 'Vector embedding' },

    // Phase 5: Completion
    READY: { id: 'READY', label: 'Ready', icon: CheckCircle, color: 'emerald', description: 'Pipeline completion' },
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. PIPELINE DEFINITIONS (Configurations)
// ═══════════════════════════════════════════════════════════════════════════

export interface PipelineConfig {
    id: string;
    stages: string[]; // Ordered list of STAGE_LIBRARY keys
    dbNodes: string[]; // Active DB nodes for graph visualization
}

export const PIPELINES: Record<string, PipelineConfig> = {
    // Standard Excel/CSV Pipeline
    'excel': {
        id: 'excel',
        stages: ['CREATED', 'UPLOAD', 'CHUNK', 'VALIDATE', 'PARSE', 'NORMALIZE', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'postgres', 'opensearch', 'qdrant']
    },
    'csv': {
        id: 'csv',
        stages: ['CREATED', 'UPLOAD', 'CHUNK', 'VALIDATE', 'PARSE', 'NORMALIZE', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'postgres', 'opensearch']
    },

    // Unstructured Document Pipeline (PDF, Word)
    'pdf': {
        id: 'pdf',
        stages: ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'OCR', 'EXTRACT_CONTENT', 'CHUNK', 'VECTORIZE', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch']
    },
    'word': {
        id: 'word',
        stages: ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'PARSE', 'CHUNK', 'VECTORIZE', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch']
    },

    // Social Media / Stream Pipeline
    'telegram': {
        id: 'telegram',
        stages: ['CREATED', 'AUTH', 'FETCH', 'PARSE', 'RESOLVE_ENTITIES', 'BUILD_GRAPH', 'VECTORIZE', 'READY'],
        dbNodes: ['graphdb', 'qdrant']
    },
    'rss': {
        id: 'rss',
        stages: ['CREATED', 'FETCH', 'PARSE', 'TRANSFORM', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['opensearch']
    },

    // Web Crawler Pipeline
    'website': {
        id: 'website',
        stages: ['CREATED', 'CRAWL', 'EXTRACT_CONTENT', 'VALIDATE', 'NORMALIZE', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'opensearch']
    },

    // API Source Pipeline
    'api': {
        id: 'api',
        stages: ['CREATED', 'FETCH', 'VALIDATE', 'TRANSFORM', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['postgres', 'opensearch']
    },

    // Media Pipelines (Audio/Video/Image)
    'image': {
        id: 'image',
        stages: ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'OCR', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant']
    },
    'audio': {
        id: 'audio',
        stages: ['CREATED', 'UPLOAD', 'DECODE', 'TRANSCRIPT', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant']
    },
    'video': {
        id: 'video',
        stages: ['CREATED', 'UPLOAD', 'DECODE', 'TRANSCRIPT', 'OCR', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch']
    },

    // Default Fallback
    'default': {
        id: 'default',
        stages: ['CREATED', 'UPLOAD', 'PARSE', 'VALIDATE', 'READY'],
        dbNodes: ['minio']
    },

    // ═══════════════════════════════════════════════════════════════════════════
    // SYSTEM PIPELINES (Infrastructure as Pipelines)
    // ═══════════════════════════════════════════════════════════════════════════

    'inf-ci-cd': {
        id: 'inf-ci-cd',
        stages: ['CHECK_SOURCE', 'BUILD', 'TEST', 'SCAN_CODE', 'DEPLOY'],
        dbNodes: []
    },
    'inf-observability': {
        id: 'inf-observability',
        stages: ['MONITOR', 'LOG', 'TRACE', 'ALERT'],
        dbNodes: ['opensearch']
    },
    'inf-security': {
        id: 'inf-security',
        stages: ['AUTH', 'POLICY', 'SCAN_CODE'],
        dbNodes: []
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. DB NODE VISUALIZATION CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

export const DB_NODE_CONFIGS: Record<string, { name: string, icon: LucideIcon, x: number, y: number, color: string }> = {
    'minio': { name: 'Raw Buffer', icon: HardDrive, x: 10, y: 15, color: '#3b82f6' },
    'quality': { name: 'DQ Core', icon: Shield, x: 30, y: 50, color: '#eab308' },
    'postgres': { name: 'Relational', icon: Database, x: 50, y: 15, color: '#22c55e' },
    'graphdb': { name: 'Neural Graph', icon: Share2, x: 70, y: 50, color: '#ec4899' },
    'opensearch': { name: 'Context Index', icon: Search, x: 90, y: 15, color: '#f97316' },
    'qdrant': { name: 'Vector Space', icon: Brain, x: 70, y: 85, color: '#6366f1' },
};
