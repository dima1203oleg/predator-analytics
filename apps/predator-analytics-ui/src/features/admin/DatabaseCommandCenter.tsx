import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Activity, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Zap, Server, HardDrive, Network, BrainCircuit,
  Terminal, Play, Loader2, ChevronRight, Shield,
  BarChart3, Layers, Search, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBackendStatus } from '@/hooks/useBackendStatus';

// ─── Типи ─────────────────────────────────────────────────────────────────────

interface DbHealth {
  status: 'ok' | 'degraded' | 'offline' | 'error' | 'unknown';
  duration_seconds?: number;
  details?: Record<string, unknown>;
  error?: string;
}

interface DbContract {
  id: string;
  role: string;
  nickname: string;
  purpose: string;
  rules: string[];
}

interface RouterDecision {
  target: string;
  confidence: number;
  reason: string;
  fallback: string | null;
}

interface RouterStats {
  total_decisions: number;
  fallback_count: number;
  fallback_rate: number;
  per_target: Record<string, number>;
}

// ─── Конфігурація 8 БД ────────────────────────────────────────────────────────

const DB_META: Record<string, { icon: React.ElementType; color: string; port: number }> = {
  postgresql: { icon: Database, color: 'from-blue-500 to-blue-600', port: 5432 },
  clickhouse: { icon: BarChart3, color: 'from-amber-500 to-orange-600', port: 8123 },
  neo4j: { icon: Network, color: 'from-emerald-500 to-teal-600', port: 7687 },
  opensearch: { icon: Search, color: 'from-sky-500 to-cyan-600', port: 9200 },
  qdrant: { icon: BrainCircuit, color: 'from-violet-500 to-purple-600', port: 6333 },
  redis: { icon: Zap, color: 'from-rose-500 to-pink-600', port: 6379 },
  minio: { icon: HardDrive, color: 'from-slate-400 to-slate-600', port: 9000 },
  kafka: { icon: Radio, color: 'from-indigo-500 to-blue-600', port: 9092 },
};

const statusConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  ok: { icon: CheckCircle2, label: 'В НОРМІ', className: 'text-emerald-400' },
  degraded: { icon: AlertTriangle, label: 'ДЕГРАДОВАНО', className: 'text-amber-400' },
  offline: { icon: XCircle, label: 'ПОЗА КОНТУРОМ', className: 'text-slate-500' },
  error: { icon: XCircle, label: 'КРИТИЧНО', className: 'text-rose-500' },
  unknown: { icon: AlertTriangle, label: 'НЕВІДОМО', className: 'text-slate-500' },
};
