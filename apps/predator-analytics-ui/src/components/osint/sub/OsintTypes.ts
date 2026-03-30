/**
 * Конфігурація й типи командного OSINT-центру.
 * Усі тексти — українською (HR-03/HR-04).
 */

import { 
    Building2, Receipt, Shield, Scale, Ban,
    ShoppingCart, Home, Banknote, Skull, Bot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface OsintTool {
    id: string;
    name: string;
    category: string;
    status: 'СКАНУЄ' | 'ОНЛАЙН' | 'ОФЛАЙН';
    findings: number;
    lastScan: string;
    color: string;
    description?: string;
    accuracy?: number;
}

export interface RegistryCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    count: number;
    registries: {
        id: string;
        name: string;
        status: string;
        records: number;
        lastSync: string;
        api: string;
    }[];
}

export interface FeedItem {
    id: string;
    source: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    target: string;
    finding: string;
    timestamp: string;
    category: string;
}

export interface OsintStats {
    totalFindings: number;
    criticalAlerts: number;
    activeScans: number;
    toolsOnline: number;
    toolsTotal: number;
    registriesConnected: number;
    registriesTotal: number;
    findingsByCategory: { category: string; count: number; pct: number; color: string }[];
    riskHeatmap: { source: string; risk: number; count: number }[];
    timeline: { hour: string; findings: number; critical: number }[];
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    EDR: Building2,
    TAX: Receipt,
    CUSTOMS: Shield,
    COURT: Scale,
    SANCTIONS: Ban,
    PROCUREMENT: ShoppingCart,
    PROPERTY: Home,
    FINANCIAL: Banknote,
    DARKWEB: Skull,
    OPENDATABOT: Bot,
};

export const SEVERITY_CONFIG: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    CRITICAL: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-red-500/20' },
    HIGH: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
    MEDIUM: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    LOW: { bg: 'bg-slate-500/15', border: 'border-slate-500/30', text: 'text-slate-400', glow: '' },
};
