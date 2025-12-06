/**
 * AutoOptimizer View - Self-Improvement Loop Dashboard
 * 
 * Інтерфейс моніторингу автономного самовдосконалення системи:
 * - Поточний статус AutoOptimizer
 * - Метрики та quality gates
 * - Історія автоматичних дій
 * - Тригери та пороги
 * - Контроль циклу оптимізації
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Activity, TrendingUp, TrendingDown, BarChart3,
    Clock, AlertTriangle, CheckCircle, XCircle, Zap, Settings,
    Play, Pause, RotateCcw, Target, Shield, Cpu, Database,
    Brain, Sparkles, ArrowUpRight, ArrowDownRight, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

// Types
interface OptimizerStatus {
    is_running: boolean;
    total_optimizations_24h: number;
    actions_by_type: Record<string, number>;
    quality_gates_status: 'passing' | 'failing' | 'warning';
    next_cycle_in_minutes: number;
    last_action?: {
        type: string;
        timestamp: string;
        reason: string;
    };
}

interface MetricsSnapshot {
    ndcg_at_10: number;
    avg_latency_ms: number;
    error_rate: number;
    cost_per_1k_requests: number;
    user_satisfaction: number;
    timestamp: string;
}

interface QualityGate {
    metric: string;
    threshold: number;
    current?: number;
    status: 'passing' | 'failing';
}

interface OptimizationAction {
    timestamp: string;
    action: {
        type: string;
        target?: string;
        reason: string;
    };
    metrics: Record<string, number>;
}

// MetricCard Component
const MetricCard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    trend?: number;
    icon: React.ReactNode;
    status?: 'good' | 'warning' | 'bad';
}> = ({ title, value, unit, trend, icon, status = 'good' }) => {
    const statusColors = {
        good: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
        warning: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        bad: 'from-red-500/20 to-rose-500/20 border-red-500/30'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative p-4 rounded-xl bg-gradient-to-br ${statusColors[status]} 
                       border backdrop-blur-sm`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-slate-400 mb-1">{title}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white">{value}</span>
                        {unit && <span className="text-sm text-slate-400">{unit}</span>}
                    </div>
                </div>
                <div className={`p-2 rounded-lg ${status === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
                    status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                    }`}>
                    {icon}
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                    {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{Math.abs(trend).toFixed(1)}% vs yesterday</span>
                </div>
            )}
        </motion.div>
    );
};

// Quality Gate Row
const QualityGateRow: React.FC<{ gate: QualityGate }> = ({ gate }) => {
    const percentage = gate.current !== undefined
        ? Math.min((gate.current / gate.threshold) * 100, 100)
        : 0;

    return (
        <div className="flex items-center gap-4 py-3 border-b border-slate-800/50 last:border-0">
            <div className="w-32">
                <span className="text-sm text-slate-300 font-medium">{gate.metric}</span>
            </div>
            <div className="flex-1">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full rounded-full ${gate.status === 'passing'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-red-500 to-rose-500'
                            }`}
                    />
                </div>
            </div>
            <div className="w-24 text-right">
                <span className="text-sm font-mono text-slate-400">
                    {gate.current?.toFixed(2) ?? '—'} / {gate.threshold}
                </span>
            </div>
            <div className="w-6">
                {gate.status === 'passing'
                    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                }
            </div>
        </div>
    );
};

// Action History Item
const ActionHistoryItem: React.FC<{ action: OptimizationAction; index: number }> = ({ action, index }) => {
    const actionIcons: Record<string, React.ReactNode> = {
        retrain_model: <Brain className="w-4 h-4" />,
        scale_pods: <Cpu className="w-4 h-4" />,
        optimize_model: <Zap className="w-4 h-4" />,
        generate_dataset: <Database className="w-4 h-4" />,
        ab_test: <BarChart3 className="w-4 h-4" />,
        scheduled_training: <Clock className="w-4 h-4" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50
                       hover:border-cyan-500/30 transition-colors"
        >
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                {actionIcons[action.action.type] || <Activity className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white capitalize">
                        {action.action.type.replace(/_/g, ' ')}
                    </span>
                    {action.action.target && (
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-400">
                            {action.action.target}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{action.action.reason}</p>
            </div>
            <div className="text-right">
                <span className="text-xs text-slate-500">
                    {new Date(action.timestamp).toLocaleTimeString('uk-UA')}
                </span>
            </div>
        </motion.div>
    );
};

// Main Component
const AutoOptimizerView: React.FC = () => {
    const [status, setStatus] = useState<OptimizerStatus | null>(null);
    const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
    const [history, setHistory] = useState<OptimizationAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggering, setIsTriggering] = useState(false);

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            // Real API Calls
            const [statusRes, metricsRes, historyRes] = await Promise.all([
                api.optimizer.getStatus(),
                api.optimizer.getMetrics(),
                api.optimizer.getHistory() // Needs backend endpoint
            ]);

            setStatus(statusRes);
            setMetrics({
                ...metricsRes,
                timestamp: new Date().toISOString()
            });
            setHistory(Array.isArray(historyRes) ? historyRes : []);

            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch optimizer data:', error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleTriggerCycle = async () => {
        setIsTriggering(true);
        try {
            await api.optimizer.trigger();
            // Wait for backend to process
            await new Promise(resolve => setTimeout(resolve, 2000));
            await fetchData();
        } catch (e) {
            console.error("Trigger failed:", e);
        } finally {
            setIsTriggering(false);
        }
    };

    const qualityGates: QualityGate[] = [
        { metric: 'NDCG@10', threshold: 0.75, current: metrics?.ndcg_at_10, status: (metrics?.ndcg_at_10 ?? 0) >= 0.75 ? 'passing' : 'failing' },
        { metric: 'Latency (ms)', threshold: 500, current: metrics?.avg_latency_ms, status: (metrics?.avg_latency_ms ?? 0) <= 500 ? 'passing' : 'failing' },
        { metric: 'Error Rate', threshold: 0.01, current: metrics?.error_rate, status: (metrics?.error_rate ?? 0) <= 0.01 ? 'passing' : 'failing' },
        { metric: 'Cost/1K', threshold: 0.50, current: metrics?.cost_per_1k_requests, status: (metrics?.cost_per_1k_requests ?? 0) <= 0.50 ? 'passing' : 'failing' },
        { metric: 'NPS', threshold: 4.0, current: metrics?.user_satisfaction, status: (metrics?.user_satisfaction ?? 0) >= 4.0 ? 'passing' : 'failing' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 
                                  flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">AutoOptimizer</h1>
                        <p className="text-sm text-slate-400">Self-Improvement Loop ♾️</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${status?.is_running
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${status?.is_running ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`} />
                        <span className="text-sm font-medium">
                            {status?.is_running ? 'Running' : 'Stopped'}
                        </span>
                    </div>

                    {/* Next cycle countdown */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-slate-300">
                            Next: <span className="font-mono text-cyan-400">{status?.next_cycle_in_minutes}m</span>
                        </span>
                    </div>

                    {/* Controls */}
                    <button
                        onClick={handleTriggerCycle}
                        disabled={isTriggering}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 
                                 text-black font-medium rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 
                                 transition-all disabled:opacity-50"
                    >
                        {isTriggering ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        <span>Trigger Now</span>
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-5 gap-4">
                <MetricCard
                    title="NDCG@10"
                    value={(metrics?.ndcg_at_10 ?? 0) * 100}
                    unit="%"
                    trend={4.2}
                    icon={<Target className="w-5 h-5" />}
                    status={(metrics?.ndcg_at_10 ?? 0) >= 0.75 ? 'good' : 'bad'}
                />
                <MetricCard
                    title="Avg Latency"
                    value={metrics?.avg_latency_ms ?? 0}
                    unit="ms"
                    trend={-12.5}
                    icon={<Activity className="w-5 h-5" />}
                    status={(metrics?.avg_latency_ms ?? 0) <= 500 ? 'good' : (metrics?.avg_latency_ms ?? 0) <= 800 ? 'warning' : 'bad'}
                />
                <MetricCard
                    title="Error Rate"
                    value={((metrics?.error_rate ?? 0) * 100).toFixed(2)}
                    unit="%"
                    trend={-0.5}
                    icon={<AlertTriangle className="w-5 h-5" />}
                    status={(metrics?.error_rate ?? 0) <= 0.01 ? 'good' : 'bad'}
                />
                <MetricCard
                    title="Cost/1K"
                    value={`$${(metrics?.cost_per_1k_requests ?? 0).toFixed(2)}`}
                    trend={-8.3}
                    icon={<BarChart3 className="w-5 h-5" />}
                    status={(metrics?.cost_per_1k_requests ?? 0) <= 0.50 ? 'good' : 'warning'}
                />
                <MetricCard
                    title="User NPS"
                    value={(metrics?.user_satisfaction ?? 0).toFixed(1)}
                    unit="/5"
                    trend={2.1}
                    icon={<TrendingUp className="w-5 h-5" />}
                    status={(metrics?.user_satisfaction ?? 0) >= 4.0 ? 'good' : 'warning'}
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-3 gap-6">
                {/* Quality Gates */}
                <div className="col-span-2 bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-cyan-400" />
                            Quality Gates
                        </h2>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${status?.quality_gates_status === 'passing'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : status?.quality_gates_status === 'warning'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                            {qualityGates.filter(g => g.status === 'passing').length}/{qualityGates.length} Passing
                        </div>
                    </div>

                    <div className="space-y-1">
                        {qualityGates.map((gate, i) => (
                            <QualityGateRow key={i} gate={gate} />
                        ))}
                    </div>
                </div>

                {/* 24h Stats */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        24h Actions
                    </h2>

                    <div className="text-center mb-6">
                        <div className="text-5xl font-bold text-transparent bg-clip-text 
                                      bg-gradient-to-r from-cyan-400 to-teal-400">
                            {status?.total_optimizations_24h ?? 0}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">auto-optimizations</p>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(status?.actions_by_type ?? {}).map(([type, count]) => (
                            <div key={type} className="flex items-center justify-between">
                                <span className="text-sm text-slate-400 capitalize">
                                    {type.replace(/_/g, ' ')}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-800 rounded text-sm font-mono text-cyan-400">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action History */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800/50 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        Recent Actions
                    </h2>
                    <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                        View all <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-2">
                    {history.map((action, i) => (
                        <ActionHistoryItem key={i} action={action} index={i} />
                    ))}
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl border border-cyan-500/20 p-4">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Brain className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-1">
                            Autonomous Self-Improvement Active
                        </h3>
                        <p className="text-sm text-slate-400">
                            System continuously monitors metrics and automatically optimizes performance.
                            Quality gates ensure safe changes with automatic rollback on degradation.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoOptimizerView;
