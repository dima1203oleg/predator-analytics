/* ─────────────────────────────────────────────────────────
 * 📊 PREDATOR Data Types — Strict Production Types
 * Суворо типізовані контракти для Graph, Documents, KPI.
 * Жодних `any`. Жодних placeholder.
 * ───────────────────────────────────────────────────────── */

// ── Graph ──────────────────────────────────────────────

export type NodeType = 'company' | 'person' | 'document' | 'event' | 'asset' | 'transaction';

export interface GraphNode {
    id: string;
    label: string;
    type: NodeType;
    /** Рівень ризику: 0.0 (безпечний) → 1.0 (критичний) */
    riskScore: number;
    /** Візуальна вага вузла (розмір) */
    value: number;
    /** Координати, заповнюються d3-force worker */
    x?: number;
    y?: number;
    z?: number;
    /** Довільні властивості, але strict-typed */
    metadata: Record<string, string | number | boolean>;
}

export type EdgeType = 'OWNER' | 'DIRECTOR' | 'LINKED' | 'TRANSFER' | 'NETWORK' | 'SANCTION';

export interface GraphEdge {
    source: string;
    target: string;
    type: EdgeType;
    /** Ступінь довіри зв'язку: 0.0 → 1.0 */
    confidence: number;
    /** Вага зв'язку (товщина лінії) */
    weight: number;
    metadata: Record<string, string | number | boolean>;
}

// ── Documents ──────────────────────────────────────────

export type DocumentType = 'pdf' | 'excel' | 'report' | 'declaration' | 'sanction-list';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IntelligenceDocument {
    id: string;
    title: string;
    content: string;
    type: DocumentType;
    riskLevel: RiskLevel;
    /** ISO timestamp */
    timestamp: string;
    /** Кількість сторінок або рядків */
    size: number;
    /** Теги для фільтрації */
    tags: string[];
}

// ── Timeline ───────────────────────────────────────────

export interface TimelineEvent {
    id: string;
    /** ISO date string */
    date: string;
    description: string;
    /** Вплив: -1.0 (негативний) → 1.0 (позитивний) */
    impact: number;
    /** Пов'язані вузли графу */
    relatedNodeIds: string[];
    category: 'financial' | 'legal' | 'customs' | 'sanction' | 'network';
}

// ── KPI ────────────────────────────────────────────────

export interface KPIMetric {
    id: string;
    label: string;
    value: number;
    unit: string;
    /** Тренд: delta від попереднього значення */
    trend: number;
    /** Статус відносно порогів */
    status: 'normal' | 'warning' | 'critical';
}

// ── System Metrics ─────────────────────────────────────

export interface SystemMetrics {
    cpuUsage: number;
    gpuUsage: number;
    memoryUsedGB: number;
    memoryTotalGB: number;
    vramUsedGB: number;
    vramTotalGB: number;
    activeSessions: number;
    requestsPerSecond: number;
}

// ── ETL Pipeline ───────────────────────────────────────

export type ETLStatus = 'running' | 'completed' | 'failed' | 'pending' | 'paused';

export interface ETLJob {
    id: string;
    name: string;
    status: ETLStatus;
    lastRun: string;
    duration: string;
    recordsProcessed: number;
    errorCount: number;
}

// ── Audit ──────────────────────────────────────────────

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'VIEW_DOCUMENT'
    | 'EXPORT_DATA'
    | 'ETL_SYNC_COMPLETE'
    | 'ETL_SYNC_FAILED'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'PERMISSION_CHANGED'
    | 'GRAPH_QUERY'
    | 'AI_ANALYSIS';

export interface AuditEntry {
    id: string;
    /** ISO timestamp */
    timestamp: string;
    userId: string;
    userName: string;
    action: AuditAction;
    target: string;
    details: string;
    ipAddress: string;
}

// ── RBAC ───────────────────────────────────────────────

export type UserRole = 'admin' | 'analyst' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface PredatorUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    lastLogin: string;
    sessionsActive: number;
    permissions: string[];
}

// ── Service Health ─────────────────────────────────────

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'maintenance';

export interface ServiceInfo {
    name: string;
    status: ServiceStatus;
    latencyMs: number;
    uptimePercent: number;
    errorRate: number;
    lastCheck: string;
}
