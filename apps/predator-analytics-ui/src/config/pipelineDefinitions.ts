
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
    CREATED: { id: 'CREATED', label: 'Ініц.', icon: Sparkles, color: '#64748b', description: 'Ініціалізація пайплайну' },
    AUTH: { id: 'AUTH', label: 'Авт.', icon: Key, color: '#f59e0b', description: 'Автентифікація та доступ' },
    FETCH: { id: 'FETCH', label: 'Отриман.', icon: Activity, color: '#3b82f6', description: 'Отримання зовнішніх даних' },
    UPLOAD: { id: 'UPLOAD', label: 'Завант.', icon: HardDrive, color: '#06b6d4', description: 'Завантаження у буфер' },
    STREAM: { id: 'STREAM', label: 'Потік', icon: Zap, color: '#06b6d4', description: 'Потокова передача даних' },
    CRAWL: { id: 'CRAWL', label: 'Парсинг', icon: Globe, color: '#a855f7', description: 'Веб-сканування та пошук' },

    // Phase 2: Processing
    CHECK_SOURCE: { id: 'CHECK_SOURCE', label: 'Перевірка', icon: AlertTriangle, color: '#f59e0b', description: 'Валідація джерела' },
    INGEST_MINIO: { id: 'INGEST_MINIO', label: 'MinIO', icon: HardDrive, color: '#06b6d4', description: 'Сире сховище' },
    DECODE: { id: 'DECODE', label: 'Декодув.', icon: FileIcon, color: '#06b6d4', description: 'Декодування медіа' },
    PARSE: { id: 'PARSE', label: 'Парсинг', icon: FileText, color: '#22d3ee', description: 'Вилучення структури' },
    EXTRACT_CONTENT: { id: 'EXTRACT_CONTENT', label: 'Вилучення', icon: Layers, color: '#22d3ee', description: 'Вилучення контенту' },
    OCR: { id: 'OCR', label: 'OCR', icon: Layers, color: '#22d3ee', description: ' озпізнавання тексту' },
    TRANSCRIPT: { id: 'TRANSCRIPT', label: 'Транскр.', icon: MessageSquare, color: '#ec4899', description: 'Транскрибація аудіо/відео' },
    CHUNK: { id: 'CHUNK', label: 'Чанкінг', icon: Layers, color: '#6366f1', description: 'Семантична сегментація' },

    // Phase 3: Validation & Transformation
    VALIDATE: { id: 'VALIDATE', label: 'Якість Д.', icon: Shield, color: '#eab308', description: 'Контроль якості даних' },
    TRANSFORM: { id: 'TRANSFORM', label: 'Трансф.', icon: RefreshCw, color: '#a855f7', description: 'Нормалізація схеми' },
    NORMALIZE: { id: 'NORMALIZE', label: 'Нормал.', icon: CheckCircle, color: '#10b981', description: 'Нормалізація даних' },
    RESOLVE_ENTITIES: { id: 'RESOLVE_ENTITIES', label: 'Об\'єкти', icon: Users, color: '#8b5cf6', description: 'Ідентифікація сутностей' },
    NLP_EXTRACTION: { id: 'NLP_EXTRACTION', label: 'NLP', icon: Brain, color: '#f59e0b', description: 'Extraction NLP' },

    // Phase 4: Storage & Indexing (The Pulse)
    RAW_STORAGE: { id: 'RAW_STORAGE', label: 'Сховище', icon: Database, color: '#eab308', description: 'Збереження сирих даних' },
    LOAD_SQL: { id: 'LOAD_SQL', label: 'PostgreSQL', icon: Database, color: '#22c55e', description: ' еляційне сховище' },
    BUILD_GRAPH: { id: 'BUILD_GRAPH', label: 'Neo4j', icon: Share2, color: '#ec4899', description: 'Зв\'язки та графи' },
    INDEX_SEARCH: { id: 'INDEX_SEARCH', label: 'OpenSearch', icon: Search, color: '#f97316', description: 'Повнотекстовий пошук' },
    VECTORIZE: { id: 'VECTORIZE', label: 'Qdrant', icon: Brain, color: '#6366f1', description: 'Векторне вбудовування' },
    ROUTING_SQL: { id: 'ROUTING_SQL', label: 'Маршр. SQL', icon: Database, color: '#22c55e', description: 'Маршрутизація в SQL' },
    ROUTING_GRAPH: { id: 'ROUTING_GRAPH', label: 'Маршр. Граф', icon: Share2, color: '#ec4899', description: 'Маршрутизація в Граф' },
    ROUTING_SEARCH: { id: 'ROUTING_SEARCH', label: 'Маршр. Пошук', icon: Search, color: '#f97316', description: 'Маршрутизація в Пошук' },
    ROUTING_VECTOR: { id: 'ROUTING_VECTOR', label: 'Маршр. Вектор', icon: Brain, color: '#6366f1', description: 'Маршрутизація у Вектор' },

    // Phase 5: Completion
    READY: { id: 'READY', label: 'Готово', icon: CheckCircle, color: '#10b981', description: 'Завершення пайплайну' },
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
    // 0. Customs Declarations (Default)
    'customs': {
        id: 'customs',
        label: 'реактор Митних Декларацій',
        stages: ['CREATED', 'UPLOAD', 'PARSE', 'VALIDATE', 'NORMALIZE', 'LOAD_SQL', 'BUILD_GRAPH', 'INDEX_SEARCH', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'quality', 'postgres', 'graphdb', 'opensearch', 'qdrant'],
        visualMode: 'REACTOR',
        accentColor: '#10b981'
    },
    // 1. Structured Data
    'excel': {
        id: 'excel',
        label: 'реактор Структурованих Даних',
        stages: ['CREATED', 'UPLOAD', 'PARSE', 'VALIDATE', 'NORMALIZE', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'postgres', 'opensearch'],
        visualMode: 'REACTOR',
        accentColor: '#10b981'
    },
    'csv': {
        id: 'csv',
        label: 'реактор CSV Даних',
        stages: ['CREATED', 'UPLOAD', 'PARSE', 'VALIDATE', 'NORMALIZE', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'postgres', 'opensearch'],
        visualMode: 'REACTOR',
        accentColor: '#10b981'
    },

    // 2. Intelligence & Knowledge Graphs
    'telegram': {
        id: 'telegram',
        label: 'Вузол  озвідки Telegram',
        stages: ['CREATED', 'AUTH', 'FETCH', 'RAW_STORAGE', 'NORMALIZE', 'NLP_EXTRACTION', 'ROUTING_SQL', 'ROUTING_GRAPH', 'ROUTING_SEARCH', 'ROUTING_VECTOR', 'READY'],
        dbNodes: ['postgres', 'graphdb', 'opensearch', 'qdrant'],
        visualMode: 'NEURAL_NET',
        accentColor: '#3b82f6'
    },
    'rss': {
        id: 'rss',
        label: 'Плазмовий Потік Новин',
        stages: ['CREATED', 'FETCH', 'PARSE', 'TRANSFORM', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['postgres', 'opensearch', 'qdrant'],
        visualMode: 'WAVE_SPECTRUM',
        accentColor: '#84cc16'
    },

    // 3. Unstructured Documents
    'pdf': {
        id: 'pdf',
        label: 'Квантовий Стек Документів',
        stages: ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'OCR', 'EXTRACT_CONTENT', 'CHUNK', 'VECTORIZE', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch'],
        visualMode: 'QUANTUM_STACK',
        accentColor: '#fbbf24'
    },
    'word': {
        id: 'word',
        label: 'Аналітичний Стек Текстів',
        stages: ['CREATED', 'UPLOAD', 'INGEST_MINIO', 'PARSE', 'CHUNK', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant'],
        visualMode: 'QUANTUM_STACK',
        accentColor: '#38bdf8'
    },
    'image': {
        id: 'image',
        label: 'Шар Візуального Аналізу',
        stages: ['CREATED', 'UPLOAD', 'OCR', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant', 'quality'],
        visualMode: 'QUANTUM_STACK',
        accentColor: '#f43f5e'
    },

    // 4. Web & OSINT
    'website': {
        id: 'website',
        label: 'Автономний Веб-Сонар',
        stages: ['CREATED', 'CRAWL', 'EXTRACT_CONTENT', 'VALIDATE', 'NORMALIZE', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['minio', 'quality', 'opensearch'],
        visualMode: 'SONAR',
        accentColor: '#3b82f6'
    },

    // 5. Media (Audio/Video)
    'audio': {
        id: 'audio',
        label: 'Акустична Обробка Сигналів',
        stages: ['CREATED', 'UPLOAD', 'DECODE', 'TRANSCRIPT', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch'],
        visualMode: 'WAVE_SPECTRUM',
        accentColor: '#ec4899'
    },
    'video': {
        id: 'video',
        label: 'Аналіз Візуальних Кадрів',
        stages: ['CREATED', 'UPLOAD', 'DECODE', 'OCR', 'TRANSCRIPT', 'VECTORIZE', 'READY'],
        dbNodes: ['minio', 'qdrant', 'opensearch', 'quality'],
        visualMode: 'WAVE_SPECTRUM',
        accentColor: '#ef4444'
    },

    // 6. External Connectivity
    'api': {
        id: 'api',
        label: 'Нейронна Синхронізація Потоку',
        stages: ['CREATED', 'AUTH', 'FETCH', 'VALIDATE', 'TRANSFORM', 'LOAD_SQL', 'INDEX_SEARCH', 'READY'],
        dbNodes: ['postgres', 'opensearch', 'quality'],
        visualMode: 'NEURAL_NET',
        accentColor: '#8b5cf6'
    },

    // Default
    'default': {
        id: 'default',
        label: 'Стандартний Потік',
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
    'minio': { name: 'Оригінал (MinIO)', icon: HardDrive, x: 15, y: 30, color: '#06b6d4' },
    'postgres': { name: 'Факти (SQL)', icon: Database, x: 85, y: 30, color: '#eab308' },
    'quality': { name: 'Redis (Стан)', icon: Zap, x: 50, y: 15, color: '#22c55e' },
    'graphdb': { name: 'Зв\'язки (Graph)', icon: Share2, x: 15, y: 70, color: '#a855f7' },
    'opensearch': { name: 'Пошук (Index)', icon: Search, x: 85, y: 70, color: '#0ea5e9' },
    'qdrant': { name: 'Семантика (Vector)', icon: Brain, x: 50, y: 85, color: '#14b8a6' },
};
