/**
 * SuperIntelligence Dashboard v45.0
 *
 * Main dashboard for AI orchestration monitoring and control.
 * Features:
 * - Real-time agent status monitoring
 * - Self-healing status and controls
 * - AI query interface
 * - Performance metrics
 * - Self-improvement cycle control
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Agent {
  id: string;
  type: string;
  name: string;
  status: string;
  last_heartbeat: string;
  metrics: Record<string, number>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'recovering' | 'critical';
  checks: Record<string, boolean>;
  failed: string[];
  agents: Record<string, string>;
  metrics: Record<string, number>;
  timestamp: string;
}

interface AIMetrics {
  total_requests: number;
  successful_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  health_status: string;
  timestamp: string;
}

interface ThoughtTrace {
  step: number;
  agent: string;
  action: string;
  reasoning: string;
  confidence: number;
  duration_ms: number;
}

interface AIResponse {
  query: string;
  answer: string;
  mode: string;
  thoughts?: ThoughtTrace[];
  trace?: Array<Record<string, any>>;
  health: string;
  error?: string;
}

// API Functions - using api service
import { api } from '../../services/api';
import { AIActivityLogs } from './AIActivityLogs';
import { WorkflowControlPanel } from './WorkflowControlPanel';
import { SelfHealingStatus } from './SelfHealingStatus';

async function fetchAIHealth() {
  return api.ai.getHealth();
}

async function fetchAIAgents() {
  return api.ai.getAgents();
}

async function fetchAIMetrics() {
  return api.ai.getMetrics();
}

async function sendAIQuery(query: string, mode: string) {
  return api.ai.query(query, mode);
}

async function triggerSelfImprovement() {
  return api.ai.triggerSelfImprovement();
}

async function triggerSelfHealing(component: string) {
  return api.ai.healing.trigger(component);
}

// Component
export const SuperIntelligenceDashboard: React.FC = () => {
  // State
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<string>('auto');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'query' | 'logs' | 'workflows'>('dashboard');

  // Fetch data
  const refreshData = useCallback(async () => {
    try {
      const [healthData, agentsData, metricsData] = await Promise.all([
        fetchAIHealth(),
        fetchAIAgents(),
        fetchAIMetrics(),
      ]);
      setHealth(healthData);
      setAgents(agentsData.agents || []);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Handlers
  const handleQuery = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const result = await sendAIQuery(query, mode);
      setResponse(result);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfImprove = async () => {
    setIsImproving(true);
    try {
      await triggerSelfImprovement();
      await refreshData();
    } catch (error) {
      console.error('Self-improvement failed:', error);
    } finally {
      setIsImproving(false);
    }
  };

  const handleHealing = async (component: string) => {
    try {
      await triggerSelfHealing(component);
      await refreshData();
    } catch (error) {
      console.error('Healing failed:', error);
    }
  };

  // Health status color
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400';
      case 'degraded': return 'text-yellow-400';
      case 'recovering': return 'text-blue-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500/20 border-emerald-500/50';
      case 'degraded': return 'bg-yellow-500/20 border-yellow-500/50';
      case 'recovering': return 'bg-blue-500/20 border-blue-500/50';
      case 'critical': return 'bg-red-500/20 border-red-500/50';
      default: return 'bg-gray-500/20 border-gray-500/50';
    }
  };

  // Agent type icons
  const getAgentIcon = (type: string) => {
    const icons: Record<string, string> = {
      sigint: '📡',
      humint: '👤',
      techint: '⚙️',
      cybint: '🛡️',
      osint: '🌐',
      critic: '🔍',
      refiner: '✨',
      executor: '⚡',
    };
    return icons[type] || '🤖';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              �  SuperIntelligence Orchestrator
            </h1>
            <p className="text-slate-400 mt-1">Predator v45 | Neural Analytics— AI Command Center</p>
          </div>

          {/* Health Status Badge */}
          <motion.div
            className={`px-4 py-2 rounded-full border ${getHealthBg(health?.status || 'unknown')}`}
            animate={{ scale: health?.status === 'critical' ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: health?.status === 'critical' ? Infinity : 0, duration: 1 }}
          >
            <span className={`font-semibold ${getHealthColor(health?.status || 'unknown')}`}>
              {health?.status?.toUpperCase() || 'LOADING...'}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['dashboard', 'agents', 'query', 'logs', 'workflows'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            {tab === 'dashboard' && '📊 Dashboard'}
            {tab === 'agents' && '🤖 Agents'}
            {tab === 'query' && '💬 Query'}
            {tab === 'logs' && '📋 Logs'}
            {tab === 'workflows' && '⚙️ Workflows'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="Загальних запитів"
                value={metrics?.total_requests || 0}
                icon="📊"
                color="cyan"
              />
              <MetricCard
                title="Успішних"
                value={`${((metrics?.success_rate || 0) * 100).toFixed(1)}%`}
                icon="✅"
                color="emerald"
              />
              <MetricCard
                title="Avg Latency"
                value={`${(metrics?.avg_latency_ms || 0).toFixed(0)}ms`}
                icon="⚡"
                color="yellow"
              />
              <MetricCard
                title="Активних агентів"
                value={agents.length}
                icon="🤖"
                color="purple"
              />
            </div>

            {/* Health Checks */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🏥 Health Checks
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(health?.checks || {}).map(([name, status]) => (
                  <div
                    key={name}
                    className={`p-3 rounded-lg border ${
                      status
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{status ? '✅' : '❌'}</span>
                      <span className="capitalize">{name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                ⚡ Quick Actions
              </h2>
              <div className="flex flex-wrap gap-4">
                <ActionButton
                  onClick={handleSelfImprove}
                  loading={isImproving}
                  icon="🔄"
                  label="Self-Improvement Cycle"
                  color="cyan"
                />
                <ActionButton
                  onClick={() => handleHealing('all')}
                  icon="🏥"
                  label="Trigger Self-Healing"
                  color="emerald"
                />
                <ActionButton
                  onClick={refreshData}
                  icon="🔃"
                  label="Refresh Data"
                  color="purple"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <motion.div
            key="agents"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getAgentIcon(agent.type)}</span>
                      <div>
                        <h3 className="font-semibold text-lg">{agent.name}</h3>
                        <span className="text-slate-400 text-sm uppercase">{agent.type}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      agent.status === 'idle'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : agent.status === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    <div>ID: {agent.id}</div>
                    <div>Last heartbeat: {new Date(agent.last_heartbeat).toLocaleTimeString('uk-UA')}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Query Tab */}
        {activeTab === 'query' && (
          <motion.div
            key="query"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Query Input */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">💬 AI Query</h2>

              {/* Mode Selection */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['auto', 'fast', 'chat', 'deep', 'council', 'tactical'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      mode === m
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-700/50 border border-slate-600 text-slate-400 hover:bg-slate-600/50'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder="Введіть запит до SuperIntelligence..."
                  className="flex-1 bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleQuery}
                  disabled={isLoading || !query.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? '⏳' : '🚀'} Надіслати
                </button>
              </div>
            </div>

            {/* Response */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">📝 Відповідь</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getHealthBg(response.health)}`}>
                    {response.mode.toUpperCase()}
                  </span>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-200 whitespace-pre-wrap">{response.answer}</p>
                </div>

                {/* Thought Traces */}
                {response.thoughts && response.thoughts.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      �  Thought Trace (XAI)
                    </h4>
                    <div className="space-y-2">
                      {response.thoughts.map((thought, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <span className="bg-slate-700 rounded px-2 py-0.5">{thought.step}</span>
                          <div>
                            <span className="text-cyan-400">{thought.agent}</span>
                            <span className="text-slate-500 mx-2">→</span>
                            <span className="text-slate-300">{thought.action}</span>
                            <span className="text-slate-500 ml-2">({(thought.confidence * 100).toFixed(0)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-[600px]"
          >
            <AIActivityLogs maxLogs={200} autoScroll={true} />
          </motion.div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <motion.div
            key="workflows"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workflow Control Panel */}
              <WorkflowControlPanel />

              {/* Self Healing Status */}
              <SelfHealingStatus />
            </div>

            {/* Prometheus Metrics Preview */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                📈 Prometheus Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-slate-400 mb-1">Total Requests</div>
                  <div className="text-2xl font-bold text-cyan-400">{metrics?.total_requests || 0}</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-slate-400 mb-1">Success Rate</div>
                  <div className="text-2xl font-bold text-emerald-400">{((metrics?.success_rate || 0) * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-slate-400 mb-1">Avg Latency</div>
                  <div className="text-2xl font-bold text-yellow-400">{(metrics?.avg_latency_ms || 0).toFixed(0)}ms</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                  <div className="text-slate-400 mb-1">Active Agents</div>
                  <div className="text-2xl font-bold text-purple-400">{agents.length}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500">
                Metrics available at: <code className="bg-slate-900 px-2 py-1 rounded">/api/v45/metrics</code>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'cyan' | 'emerald' | 'yellow' | 'purple' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  const colors = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-slate-400 mt-2 text-sm">{title}</p>
    </motion.div>
  );
};

interface ActionButtonProps {
  onClick: () => void;
  icon: string;
  label: string;
  color: 'cyan' | 'emerald' | 'purple';
  loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, label, color, loading }) => {
  const colors = {
    cyan: 'bg-cyan-500/20 border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400',
    purple: 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 text-purple-400',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={loading}
      className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${colors[color]} disabled:opacity-50`}
    >
      {loading ? '⏳' : icon} {label}
    </motion.button>
  );
};

export default SuperIntelligenceDashboard;
