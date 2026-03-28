import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  RefreshCw, 
  Key, 
  Sliders, 
  Target,
  BarChart3,
  Server,
  Cloud,
  Layers,
  Terminal,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AIControlPlane: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'llm' | 'security'>('orchestrator');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Glassmorphism */}
      <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 shadow-2xl">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-gradient-to-br from-amber-500 to-rose-700 rounded-3xl shadow-xl shadow-amber-500/20">
              <Zap size={36} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-white tracking-tight uppercase">AI Control Plane</h1>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded-lg border border-amber-500/30 tracking-[0.2em]">NEXUS ENGINE v55.1</span>
              </div>
              <p className="text-slate-500 text-lg font-medium mt-1 uppercase tracking-widest opacity-80">Центральна нервова система автономного аналізу</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-6 py-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System Load</span>
              <span className="text-2xl font-black text-amber-500">42%</span>
            </div>
            <div className="px-6 py-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Agents</span>
              <span className="text-2xl font-black text-indigo-400">12</span>
            </div>
          </div>
        </div>
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Sidebar for the Control Plane */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-4 flex flex-col gap-2">
            {[
              { id: 'orchestrator', label: 'Оркестратор', icon: Server },
              { id: 'llm', label: 'LLM Studio', icon: Brain },
              { id: 'security', label: 'AI Безпека', icon: Key },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group",
                  activeTab === tab.id 
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/5" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={20} className={cn("transition-colors", activeTab === tab.id ? "text-amber-500" : "group-hover:text-amber-400")} />
                <span className="font-bold text-sm uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Live Traffic</h3>
              <Activity size={14} className="text-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>API Calls / min</span>
                <span className="text-white">1,240</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Avg Latency</span>
                <span className="text-emerald-400">12ms</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Error Rate</span>
                <span className="text-rose-400">0.02%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[32px] p-10 min-h-[600px] shadow-inner shadow-white/5 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10">
                <RefreshCw size={48} className="text-slate-600 animate-spin-slow opacity-20" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4">Module Initialization</h2>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Секція <span className="text-amber-500 uppercase">{activeTab}</span> знаходиться в процесі інтеграції з ядром Predator v56.1. 
                Всі системи моніторингу активні та перебувають в режимі очікування даних.
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
