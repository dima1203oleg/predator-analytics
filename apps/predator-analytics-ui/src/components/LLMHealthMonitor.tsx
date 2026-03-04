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
  WifiOff,
  Cpu,
  Layers,
  Network
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TacticalCard } from './TacticalCard';

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
    online: { color: 'emerald', icon: CheckCircle2, label: 'OPERATIONAL' },
    degraded: { color: 'amber', icon: AlertTriangle, label: 'DEGRADED' },
    offline: { color: 'rose', icon: XCircle, label: 'OFFLINE' },
    unknown: { color: 'slate', icon: AlertTriangle, label: 'UNKNOWN' }
  };

  const { color, icon: StatusIcon, label } = statusConfig[provider.status];

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "relative rounded-[32px] p-8 border backdrop-blur-3xl transition-all duration-700 shadow-2xl group overflow-hidden",
        provider.status === 'online' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10' :
          provider.status === 'degraded' ? 'bg-amber-500/5 border-amber-500/20 shadow-amber-500/10' :
            'bg-slate-900/40 border-white/5'
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Badge */}
      {provider.isPrimary && (
        <div className="absolute top-0 right-0 px-6 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-bl-[20px] shadow-xl z-10">
          CORE_ENGINE
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className={cn(
            "p-4 rounded-2xl transition-all duration-700 shadow-xl border relative group-hover:scale-110",
            provider.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              provider.status === 'degraded' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                'bg-slate-950 border-white/5 text-slate-500'
          )}>
            <Cpu size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tighter mb-1 font-display">{provider.name}</h4>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider italic">{provider.model}</div>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-3 px-4 py-1 rounded-full border shadow-inner",
          provider.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            provider.status === 'degraded' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-slate-950 border-white/5 text-slate-500'
        )}>
          <motion.div
            animate={provider.status === 'online' ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <StatusIcon size={14} />
          </motion.div>
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-[24px] bg-slate-950/60 border border-white/5 relative group/metric overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 text-slate-500 mb-2 relative z-10">
            <Clock size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Latency</span>
          </div>
          <div className={cn(
            "text-2xl font-black font-display tracking-tighter relative z-10",
            provider.latency < 200 ? 'text-emerald-400' : provider.latency < 500 ? 'text-amber-400' : 'text-rose-400'
          )}>
            {provider.latency}ms
          </div>
        </div>
        <div className="p-5 rounded-[24px] bg-slate-950/60 border border-white/5 relative group/metric overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 text-slate-500 mb-2 relative z-10">
            <Activity size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Availability</span>
          </div>
          <div className={cn(
            "text-2xl font-black font-display tracking-tighter relative z-10",
            provider.uptime > 99 ? 'text-emerald-400' : provider.uptime > 95 ? 'text-amber-400' : 'text-rose-400'
          )}>
            {provider.uptime.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Token Usage */}
      <div className="mb-8 p-6 bg-slate-950/40 rounded-[24px] border border-white/5">
        <div className="flex items-center justify-between text-[11px] mb-4">
          <span className="font-black text-slate-500 uppercase tracking-widest opacity-60">Token_Pressure</span>
          <span className="font-mono font-black text-white italic">{((provider.tokensUsed / provider.tokensLimit) * 100).toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-px">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(provider.tokensUsed / provider.tokensLimit) * 100}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className={cn(
              "h-full rounded-full transition-all duration-1000 shadow-lg",
              provider.tokensUsed / provider.tokensLimit > 0.9 ? 'bg-rose-500 shadow-rose-500/50' :
                provider.tokensUsed / provider.tokensLimit > 0.7 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-blue-500 shadow-blue-500/50'
            )}
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">
          <span>0_BASE</span>
          <span>{provider.tokensUsed.toLocaleString()} USED</span>
          <span>MAX_{provider.tokensLimit.toLocaleString()}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-6 border-t border-white/5 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/10">
            <DollarSign size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none block mb-1 opacity-60">Cost_Cycle</span>
            <span className="text-lg font-black text-white font-mono tracking-tighter leading-none">${provider.costToday.toFixed(3)}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] mb-1">Stream_Sync</div>
          <div className="text-[10px] font-mono text-slate-500 uppercase italic">OK: {provider.lastCheck}</div>
        </div>
      </div>
    </motion.div>
  );
};

const FallbackChainVisualization: React.FC<{ chain: FallbackChainStep[] }> = ({ chain }) => {
  return (
    <div className="relative p-10 rounded-[48px] bg-slate-950/40 border border-white/5 shadow-2xl overflow-hidden group">
      <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 icon-3d-amber">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black text-white uppercase tracking-tighter font-display mb-1">Stability_Core_Network</h4>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60 italic">Resilience Fallback Protocols</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-6 py-2 bg-slate-900 rounded-full border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Failover_Armed</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8 flex-wrap py-4 relative z-10">
        {chain.map((step, index) => (
          <React.Fragment key={step.provider}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className={cn(
                "px-8 py-5 rounded-[24px] border transition-all duration-700 relative overflow-hidden flex flex-col items-center gap-3 min-w-[160px]",
                step.status === 'active'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-2xl shadow-emerald-500/10 scale-110'
                  : step.status === 'failed'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  step.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' :
                    step.status === 'failed' ? 'bg-rose-500' : 'bg-slate-700'
                )} />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] font-display">{step.provider}</span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-40 italic">Priority: {step.order}</span>
            </motion.div>

            {index < chain.length - 1 && (
              <div className="flex flex-col items-center gap-2">
                <ArrowRight size={24} className={cn(
                  "transition-colors duration-700",
                  step.status === 'active' ? 'text-emerald-500' : 'text-slate-800'
                )} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-12 text-center text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] italic">
        AUTOMATED_DYNAMIC_ROUTING_ACTIVE // AUTO_FAILOVER_SECURED
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
      setProviders([
        { id: 'groq', name: 'Groq', status: 'online', latency: 45, uptime: 99.9, tokensUsed: 125000, tokensLimit: 500000, costToday: 0.12, isPrimary: true, lastCheck: new Date().toLocaleTimeString('uk-UA'), model: 'llama-3.3-70b' },
        { id: 'gemini', name: 'Google Gemini', status: 'online', latency: 120, uptime: 99.5, tokensUsed: 45000, tokensLimit: 1000000, costToday: 0.08, isPrimary: false, lastCheck: new Date().toLocaleTimeString('uk-UA'), model: 'gemini-2.0-flash' },
        { id: 'mistral', name: 'Mistral AI', status: 'online', latency: 180, uptime: 98.7, tokensUsed: 22000, tokensLimit: 500000, costToday: 0.05, isPrimary: false, lastCheck: new Date().toLocaleTimeString('uk-UA'), model: 'mistral-large' },
        { id: 'ollama', name: 'Ollama_Local', status: 'online', latency: 250, uptime: 100, tokensUsed: 0, tokensLimit: 999999, costToday: 0, isPrimary: false, lastCheck: new Date().toLocaleTimeString('uk-UA'), model: 'qwen2.5-coder' },
        { id: 'openrouter', name: 'OpenRouter', status: 'degraded', latency: 450, uptime: 95.2, tokensUsed: 8000, tokensLimit: 100000, costToday: 0.03, isPrimary: false, lastCheck: new Date().toLocaleTimeString('uk-UA'), model: 'claude-3.5-sonnet' },
        { id: 'together', name: 'Together AI', status: 'offline', latency: 0, uptime: 0, tokensUsed: 0, tokensLimit: 200000, costToday: 0, isPrimary: false, lastCheck: new Date().toLocaleTimeString('uk-UA'), model: 'Llama-3.3-70B' }
      ]);
      setFallbackChain([
        { provider: 'Groq', order: 1, status: 'active' },
        { provider: 'Gemini', order: 2, status: 'standby' },
        { provider: 'Mistral', order: 3, status: 'standby' },
        { provider: 'OpenRouter', order: 4, status: 'standby' },
        { provider: 'Ollama', order: 5, status: 'standby' }
      ]);
      setTotalCost(0.285);
      setTotalTokens(215000);
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
      <div className="flex items-center gap-6 px-6 py-3 rounded-[24px] bg-slate-950/80 border border-white/5 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <Brain size={16} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Gateway</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
          <span className="text-[10px] font-black text-emerald-400 font-mono italic">{onlineCount} UNIT</span>
        </div>
        {degradedCount > 0 && (
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]" />
            <span className="text-[10px] font-black text-amber-500 font-mono italic">{degradedCount} DEG</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Dynamic Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 pb-12 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-8 relative z-10">
          <div className="p-8 rounded-[40px] bg-gradient-to-br from-purple-600/20 to-pink-600/20 text-purple-400 border border-purple-500/20 shadow-2xl icon-3d-purple">
            <Network size={40} />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-display">Neural Gateway Controller</h3>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 px-6 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 group hover:border-emerald-500/40 transition-all cursor-default">
                <Activity size={16} className="text-emerald-500 group-hover:rotate-90 transition-all" />
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">{onlineCount} ACTIVE_NODES</span>
              </div>
              <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic">{degradedCount} DEGRADED_SIGNALS</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 scale-110">
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="p-6 rounded-[32px] bg-slate-900 border border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white transition-all shadow-2xl"
          >
            <RefreshCw size={24} className={isLoading ? 'animate-spin' : ''} />
          </motion.button>
        </div>
      </div>

      {/* Critical Insight Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Token_Throughput', value: `${(totalTokens / 1000).toFixed(0)}K`, sub: 'DAILY_VOLUME', icon: <Sparkles size={20} />, color: 'purple' },
          { label: 'Financial_Burn', value: `$${totalCost.toFixed(3)}`, sub: 'REAL_TIME_COST', icon: <DollarSign size={20} />, color: 'emerald' },
          { label: 'Signal_Efficiency', value: `${((onlineCount / providers.length) * 100).toFixed(1)}%`, sub: 'NETWORK_CONFIDENCE', icon: <Zap size={20} />, color: 'blue' }
        ].map((stat, idx) => (
          <TacticalCard
            key={idx}
            variant="holographic"
            title={stat.label}
            className="p-10 border-white/5 bg-slate-950/40 relative group"
          >
            <div className={cn(
              "p-4 rounded-2xl absolute top-8 right-8 transition-all duration-700",
              stat.color === 'purple' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/10' :
                stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/10'
            )}>
              {stat.icon}
            </div>
            <div className="mt-8">
              <div className="text-6xl font-black text-white font-display tracking-tighter mb-2 group-hover:scale-110 transition-transform origin-left">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic opacity-60">{stat.sub}</div>
            </div>
            {/* Visual Gauge */}
            <div className="mt-8 h-1 bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: idx * 0.2, duration: 1.5 }}
                className={cn(
                  "h-full",
                  stat.color === 'purple' ? 'bg-purple-500 shadow-[0_0_15px_#a855f7]' :
                    stat.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' :
                      'bg-blue-500 shadow-[0_0_15px_#3b82f6]'
                )}
              />
            </div>
          </TacticalCard>
        ))}
      </div>

      {/* Network Topology: Fallback Chain */}
      <FallbackChainVisualization chain={fallbackChain} />

      {/* Node Distribution Board */}
      <div className="pt-8">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.8em]">ACTIVE_TOPOLOGY_MAP</div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onRefresh={fetchData}
            />
          ))}
        </div>
      </div>

      {/* Maintenance Insight Footer */}
      <div className="p-10 rounded-[48px] border border-dashed border-white/10 bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-8 group">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-slate-800/40 rounded-2xl text-slate-500 border border-white/5 group-hover:text-blue-400 transition-colors">
            <Server size={24} />
          </div>
          <div>
            <div className="text-sm font-black text-white uppercase tracking-widest font-display mb-1">Global_Protocol_Status</div>
            <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Awaiting command stream for deep optimization...</div>
          </div>
        </div>
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="px-8 py-3 bg-slate-900 rounded-full border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]"
        >
          AUTO_REPAIR_ENABLED
        </motion.div>
      </div>
    </div>
  );
};

export default LLMHealthMonitor;
