/**
 * LLMHealthMonitor - Статус всіх LLM провайдерів
 *
 * Відображає:
 * - Статус кожного провайдера (Groq, Gemini, Mistral, Ollama, etc.)
 * - Latency та availability
 * - Token usage та costs
 * - Fallback chain visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Clock,
  DollarSign,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  logo?: string;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  latency: number;
  uptime: number;
  tokensUsed: number;
  tokensLimit: number;
  costToday: number;
  isPrimary: boolean;
  lastCheck: string;
  model: string;
}

interface FallbackChainStep {
  provider: string;
  order: number;
  status: 'active' | 'standby' | 'failed';
}

const ProviderCard: React.FC<{ provider: LLMProvider; onRefresh: () => void }> = ({ provider, onRefresh }) => {
  const statusConfig = {
    online: { color: 'emerald', icon: CheckCircle2, label: 'ONLINE' },
    degraded: { color: 'amber', icon: AlertTriangle, label: 'DEGRADED' },
    offline: { color: 'rose', icon: XCircle, label: 'OFFLINE' },
    unknown: { color: 'slate', icon: AlertTriangle, label: 'UNKNOWN' }
  };

  const { color, icon: StatusIcon, label } = statusConfig[provider.status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative  rounded-2xl p-5
        bg-gradient-to-br from-slate-900/90 to-slate-950/95
        border ${provider.isPrimary ? `border-${color}-500/50` : 'border-white/10'}
        backdrop-blur-xl
        group hover:border-${color}-500/30 transition-all duration-300
      `}
    >
      {/* Primary Badge */}
      {provider.isPrimary && (
        <div className={`absolute top-0 right-0 px-2 py-1 bg-${color}-500 text-white text-[8px] font-black uppercase tracking-wider rounded-bl-xl`}>
          PRIMARY
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400`}>
            <Brain size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">{provider.name}</h4>
            <div className="text-[10px] text-slate-500 font-mono">{provider.model}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-${color}-400`}>
          <motion.div
            animate={provider.status === 'online' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <StatusIcon size={16} />
          </motion.div>
          <span className="text-[10px] font-black uppercase">{label}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-800/50">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Clock size={12} />
            <span className="text-[9px] uppercase tracking-wider">Latency</span>
          </div>
          <div className={`text-lg font-black ${provider.latency < 200 ? 'text-emerald-400' : provider.latency < 500 ? 'text-amber-400' : 'text-rose-400'}`}>
            {provider.latency}ms
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/50">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Activity size={12} />
            <span className="text-[9px] uppercase tracking-wider">Uptime</span>
          </div>
          <div className={`text-lg font-black ${provider.uptime > 99 ? 'text-emerald-400' : provider.uptime > 95 ? 'text-amber-400' : 'text-rose-400'}`}>
            {provider.uptime.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Token Usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
          <span>Токенів сьогодні</span>
          <span>{provider.tokensUsed.toLocaleString()} / {provider.tokensLimit.toLocaleString()}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full ">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(provider.tokensUsed / provider.tokensLimit) * 100}%` }}
            className={`h-full rounded-full ${
              provider.tokensUsed / provider.tokensLimit > 0.9 ? 'bg-rose-500' :
              provider.tokensUsed / provider.tokensLimit > 0.7 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Cost */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-slate-500">
          <DollarSign size={12} />
          <span className="text-[10px]">Витрати сьогодні</span>
        </div>
        <span className="text-sm font-bold text-white">${provider.costToday.toFixed(2)}</span>
      </div>

      {/* Last Check */}
      <div className="mt-2 text-[9px] text-slate-600 text-right">
        Перевірено: {provider.lastCheck}
      </div>
    </motion.div>
  );
};

const FallbackChainVisualization: React.FC<{ chain: FallbackChainStep[] }> = ({ chain }) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-amber-400" />
        <span className="text-sm font-bold text-white uppercase tracking-wider">Fallback Chain</span>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {chain.map((step, index) => (
          <React.Fragment key={step.provider}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                px-4 py-2 rounded-xl border
                ${step.status === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : step.status === 'failed'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  step.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                  step.status === 'failed' ? 'bg-rose-500' : 'bg-slate-500'
                }`} />
                <span className="text-xs font-bold uppercase">{step.provider}</span>
              </div>
            </motion.div>

            {index < chain.length - 1 && (
              <ArrowRight size={16} className="text-slate-600" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 text-center text-[10px] text-slate-500">
        Автоматичне перемикання при відмові основного провайдера
      </div>
    </div>
  );
};

export const LLMHealthMonitor: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [fallbackChain, setFallbackChain] = useState<FallbackChainStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/llm/status');
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
        setFallbackChain(data.fallbackChain || []);
        setTotalCost(data.totalCost || 0);
        setTotalTokens(data.totalTokens || 0);
      }
    } catch (error) {
      // Use mock data
      setProviders([
        {
          id: 'groq',
          name: 'Groq',
          status: 'online',
          latency: 45,
          uptime: 99.9,
          tokensUsed: 125000,
          tokensLimit: 500000,
          costToday: 0.12,
          isPrimary: true,
          lastCheck: new Date().toLocaleTimeString('uk-UA'),
          model: 'llama-3.3-70b-versatile'
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          status: 'online',
          latency: 120,
          uptime: 99.5,
          tokensUsed: 45000,
          tokensLimit: 1000000,
          costToday: 0.08,
          isPrimary: false,
          lastCheck: new Date().toLocaleTimeString('uk-UA'),
          model: 'gemini-2.0-flash-exp'
        },
        {
          id: 'mistral',
          name: 'Mistral AI',
          status: 'online',
          latency: 180,
          uptime: 98.7,
          tokensUsed: 22000,
          tokensLimit: 500000,
          costToday: 0.05,
          isPrimary: false,
          lastCheck: new Date().toLocaleTimeString('uk-UA'),
          model: 'mistral-large-latest'
        },
        {
          id: 'ollama',
          name: 'Ollama (Local)',
          status: 'online',
          latency: 250,
          uptime: 100,
          tokensUsed: 0,
          tokensLimit: 999999,
          costToday: 0,
          isPrimary: false,
          lastCheck: new Date().toLocaleTimeString('uk-UA'),
          model: 'qwen2.5-coder:7b'
        },
        {
          id: 'openrouter',
          name: 'OpenRouter',
          status: 'degraded',
          latency: 450,
          uptime: 95.2,
          tokensUsed: 8000,
          tokensLimit: 100000,
          costToday: 0.03,
          isPrimary: false,
          lastCheck: new Date().toLocaleTimeString('uk-UA'),
          model: 'anthropic/claude-3.5-sonnet'
        },
        {
          id: 'together',
          name: 'Together AI',
          status: 'offline',
          latency: 0,
          uptime: 0,
          tokensUsed: 0,
          tokensLimit: 200000,
          costToday: 0,
          isPrimary: false,
          lastCheck: new Date().toLocaleTimeString('uk-UA'),
          model: 'meta-llama/Llama-3.3-70B-Instruct'
        }
      ]);

      setFallbackChain([
        { provider: 'Groq', order: 1, status: 'active' },
        { provider: 'Gemini', order: 2, status: 'standby' },
        { provider: 'Mistral', order: 3, status: 'standby' },
        { provider: 'OpenRouter', order: 4, status: 'standby' },
        { provider: 'Ollama', order: 5, status: 'standby' }
      ]);

      setTotalCost(0.28);
      setTotalTokens(200000);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onlineCount = providers.filter(p => p.status === 'online').length;
  const degradedCount = providers.filter(p => p.status === 'degraded').length;

  if (compact) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/5">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-purple-400" />
          <span className="text-xs font-bold text-white">LLM</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-300">{onlineCount} online</span>
        </div>
        {degradedCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-slate-300">{degradedCount} degraded</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Brain size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight">LLM Router</h3>
            <div className="text-xs text-slate-500">
              {onlineCount} онлайн • {degradedCount} деградовано
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchData}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Sparkles size={16} />
            <span className="text-xs font-bold uppercase">Токенів</span>
          </div>
          <div className="text-2xl font-black text-white">{(totalTokens / 1000).toFixed(0)}K</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <DollarSign size={16} />
            <span className="text-xs font-bold uppercase">Витрати</span>
          </div>
          <div className="text-2xl font-black text-white">${totalCost.toFixed(2)}</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Server size={16} />
            <span className="text-xs font-bold uppercase">Провайдерів</span>
          </div>
          <div className="text-2xl font-black text-white">{providers.length}</div>
        </div>
      </div>

      {/* Fallback Chain */}
      <FallbackChainVisualization chain={fallbackChain} />

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onRefresh={fetchData}
          />
        ))}
      </div>
    </div>
  );
};

export default LLMHealthMonitor;
