
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
    CREATED: { id: 'CREATED', label: 'Init', icon: Sparkles, color: '#64748b', description: 'Pipeline initialization' },
    AUTH: { id: 'AUTH', label: 'Auth', icon: Key, color: '#f59e0b', description: 'Authentication & Access' },
    FETCH: { id: 'FETCH', label: 'Fetch', icon: Activity, color: '#3b82f6', description: 'Fetching external data' },
    UPLOAD: { id: 'UPLOAD', label: 'Upload', icon: HardDrive, color: '#06b6d4', description: 'File upload to buffer' },
    STREAM: { id: 'STREAM', label: 'Stream', icon: Zap, color: '#06b6d4', description: 'Real-time data streaming' },
    CRAWL: { id: 'CRAWL', label: 'Crawl', icon: Globe, color: '#a855f7', description: 'Web crawling & discovery' },

    // Phase 2: Processing
    CHECK_SOURCE: { id: 'CHECK_SOURCE', label: 'Check', icon: AlertTriangle, color: '#f59e0b', description: 'Source validity check' },
    INGEST_MINIO: { id: 'INGEST_MINIO', label: 'MinIO', icon: HardDrive, color: '#06b6d4', description: 'Raw storage' },
    DECODE: { id: 'DECODE', label: 'Decode', icon: FileIcon, color: '#06b6d4', description: 'Media decoding' },
    PARSE: { id: 'PARSE', label: 'Parsing', icon: FileText, color: '#22d3ee', description: 'Structure extraction' },
    EXTRACT_CONTENT: { id: 'EXTRACT_CONTENT', label: 'Extract', icon: Layers, color: '#22d3ee', description: 'Content extraction' },
    OCR: { id: 'OCR', label: 'OCR', icon: Layers, color: '#22d3ee', description: 'Visual text recognition' },
    TRANSCRIPT: { id: 'TRANSCRIPT', label: 'Transcript', icon: MessageSquare, color: '#ec4899', description: 'Audio/Video transcription' },
    CHUNK: { id: 'CHUNK', label: 'Chunking', icon: Layers, color: '#6366f1', description: 'Semantic segmentation' },

    // Phase 3: Validation & Transformation
    VALIDATE: { id: 'VALIDATE', label: 'DQ Check', icon: Shield, color: '#eab308', description: 'Data quality assurance' },
    TRANSFORM: { id: 'TRANSFORM', label: 'Transform', icon: RefreshCw, color: '#a855f7', description: 'Schema normalization' },
    NORMALIZE: { id: 'NORMALIZE', label: 'Normalize', icon: CheckCircle, color: '#10b981', description: 'Data normalization' },
    RESOLVE_ENTITIES: { id: 'RESOLVE_ENTITIES', label: 'Entities', icon: Users, color: '#8b5cf6', description: 'Identity resolution' },

    // Phase 4: Storage & Indexing (The Pulse)
    LOAD_SQL: { id: 'LOAD_SQL', label: 'PostgreSQL', icon: Database, color: '#22c55e', description: 'Relational storage' },
    BUILD_GRAPH: { id: 'BUILD_GRAPH', label: 'Graph DB', icon: Share2, color: '#ec4899', description: 'Relationship mapping' },
    INDEX_SEARCH: { id: 'INDEX_SEARCH', label: 'OpenSearch', icon: Search, color: '#f97316', description: 'Full-text indexing' },
    VECTORIZE: { id: 'VECTORIZE', label: 'Qdrant', icon: Brain, color: '#6366f1', description: 'Vector embedding' },

    // Phase 5: Completion
    READY: { id: 'READY', label: 'Ready', icon: CheckCircle, color: '#10b981', description: 'Pipeline completion' },
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. PIPELINE DEFINITIONS (Recipes)
// ═══════════════════════════════════════════════════════════════════════════

export interface PipelineConfig {
    id: string;
    label: string;
    stages: string[]; // Ordered list of STAGE_LIBRARY keys
    dbNodes: string[]; // Active DB nodes for graph visualization
    visualMode: 'REACTOR' | 'NEURAL_NET' | 'QUANTUM_STACK' | 'SONAR' | 'WAVE_SPECTRUM' | 'PLASMA_STREAM';
    accentColor: string;
}

export const PIPELINES: Record<string, PipelineConfig> = {
    // 1. Structured Data
    'excel': {
        id: 'excel',
        label: 'Structured Data Reactor',
        stages: ['CREATED', 'UPLOAD', 'VALIDATE', 'PARSE', 'NORMALIZE', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'postgres', 'opensearch'],
        visualMode: 'REACTOR',
        accentColor: '#10b981'
    },
    'csv': {
        id: 'csv',
        label: 'CSV Data Reactor',
        stages: ['CREATED', 'UPLOAD', 'PARSE', 'LOAD_SQL', 'READY'],
        dbNodes: ['minio', 'postgres'],
        visualMode: 'REACTOR',
        accentColor: '#06b6d4'
    },

    // 2. Intelligence & Knowledge Graphs
    'telegram': {
        id: 'telegram',
        label: 'Neural Intelligence Web',
        stages: ['CREATED', 'AUTH', 'FETCH', 'DECODE', 'PARSE', 'RESOLVE_ENTITIES', 'BUILD_GRAPH', 'VECTORIZE', 'READY'],
        dbNodes: ['graphdb', 'qdrant', 'quality'],
        visualMode: 'NEURAL_NET',
        accentColor: '#a855f7'
    },
    'rss': {
        id: 'rss',
        label: 'Plasma News Stream',
        stages: ['CREATED', 'FETCH', 'PARSE', 'TRANSFORM', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['opensearch', 'postgres'],
        visualMode: 'PLASMA_STREAM',
        accentColor: '#f97316'
    },

    // 3. Unstructured Documents
    'pdf': {
        id: 'pdf',
        label: 'Quantum Document Stack',
        stages: ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'OCR', 'EXTRACT_CONTENT', 'CHUNK', 'VECTORIZE', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch'],
        visualMode: 'QUANTUM_STACK',
        accentColor: '#fbbf24'
    },
    'word': {
        id: 'word',
        label: 'Text Analysis Stack',
        stages: ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'PARSE', 'CHUNK', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant'],
        visualMode: 'QUANTUM_STACK',
        accentColor: '#38bdf8'
    },
    'image': {
        id: 'image',
        label: 'Vision Analysis Layer',
        stages: ['CREATED', 'UPLOAD', 'OCR', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant', 'quality'],
        visualMode: 'QUANTUM_STACK',
        accentColor: '#f43f5e'
    },

    // 4. Web & OSINT
    'website': {
        id: 'website',
        label: 'Autonomous Web Sonar',
        stages: ['CREATED', 'CRAWL', 'EXTRACT_CONTENT', 'VALIDATE', 'NORMALIZE', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'opensearch'],
        visualMode: 'SONAR',
        accentColor: '#3b82f6'
    },

    // 5. Media (Audio/Video)
    'audio': {
        id: 'audio',
        label: 'Acoustic Signal Processing',
        stages: ['CREATED', 'UPLOAD', 'DECODE', 'TRANSCRIPT', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch'],
        visualMode: 'WAVE_SPECTRUM',
        accentColor: '#ec4899'
    },
    'video': {
        id: 'video',
        label: 'Visual Frame Analysis',
        stages: ['CREATED', 'UPLOAD', 'DECODE', 'OCR', 'TRANSCRIPT', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch', 'quality'],
        visualMode: 'WAVE_SPECTRUM',
        accentColor: '#ef4444'
    },

    // 6. External Connectivity
    'api': {
        id: 'api',
        label: 'Neural Stream Sync',
        stages: ['CREATED', 'AUTH', 'FETCH', 'VALIDATE', 'TRANSFORM', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['postgres', 'opensearch', 'quality'],
        visualMode: 'NEURAL_NET',
        accentColor: '#8b5cf6'
    },

    // Default
    'default': {
        id: 'default',
        label: 'Standard Flow',
        stages: ['CREATED', 'UPLOAD', 'PARSE', 'VALIDATE', 'READY'],
        dbNodes: ['minio'],
        visualMode: 'REACTOR',
        accentColor: '#64748b'
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. DB NODE VISUALIZATION CONFIGS (REACTOR LAYOUT)
// ═══════════════════════════════════════════════════════════════════════════

export const DB_NODE_CONFIGS: Record<string, { name: string, icon: LucideIcon, x: number, y: number, color: string }> = {
    'minio': { name: 'Original (MinIO)', icon: HardDrive, x: 15, y: 30, color: '#06b6d4' },
    'postgres': { name: 'Facts (SQL)', icon: Database, x: 85, y: 30, color: '#eab308' },
    'quality': { name: 'Redis (State)', icon: Zap, x: 50, y: 15, color: '#22c55e' },
    'graphdb': { name: 'Relations (Graph)', icon: Share2, x: 15, y: 70, color: '#a855f7' },
    'opensearch': { name: 'Search (Index)', icon: Search, x: 85, y: 70, color: '#0ea5e9' },
    'qdrant': { name: 'Semantic (Vector)', icon: Brain, x: 50, y: 85, color: '#14b8a6' },
};
