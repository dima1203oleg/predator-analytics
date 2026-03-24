import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Landmark, Shield, User, Network, Target, ChevronRight, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';
import { apiClient } from '@/services/api/config';

interface PowerNode {
  id: string;
  name: string;
  role: string;
  power: number;
  status: string;
  edrpou: string;
  riskScore: number;
  totalValue: number;
  category: string;
  connections: number;
}

interface PowerStructureData {
  levels: {
    level1: { name: string; nodes: PowerNode[] };
    level2: { name: string; nodes: PowerNode[] };
    level3: { name: string; nodes: PowerNode[] };
  };
  insights: { question: string; answer: string; type: string }[];
  recentChanges: string[];
  summary: {
    totalNodes: number;
    highRiskCount: number;
    totalValue: number;
    avgRisk: number;
    topCategory: string;
  };
}

const PowerNodeComponent = ({ node, color }: { node: PowerNode; color: string }) => (
  <motion.div 
    whileHover={{ scale: 1.02, x: 5 }}
    className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all group cursor-pointer"
  >
    <div className={cn("p-3 rounded-lg bg-slate-800", color)}>
      <Landmark className="w-5 h-5 text-white" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-white font-bold leading-none">{node.name}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          {node.status}
        </span>
      </div>
      <p className="text-xs text-slate-500">{node.role}</p>
      <p className="text-[9px] text-slate-600">ЄДРПОУ: {node.edrpou} | Ризик: {node.riskScore}%</p>
      
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${node.power}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
          />
        </div>
        <span className="text-[10px] font-mono text-cyan-400">{node.power}% ВПЛИВУ</span>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-400 transition-colors" />
  </motion.div>
);

const PowerStructureView = () => {
  const [data, setData] = useState<PowerStructureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/power-structure');
      setData(res.data);
    } catch (err) {
      setError('Не вдалося завантажити дані структури впливу');
      console.error('Power structure error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Info className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-rose-500/20 bg-rose-500/5';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5';
      default: return 'border-cyan-500/20 bg-cyan-500/5';
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Landmark className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              МАПА <span className="text-cyan-500">ВПЛИВУ</span>
            </h1>
          </div>
          <p className="text-slate-400 max-w-xl">
            Хто під ким стоїть? Карта реального впливу, бенефіціарів та "акціонерів" українського ринку.
            Система аналізує зв'язки з чиновниками, афілійовані компанії та історичні патерни лобіювання.
          </p>
          {data?.summary && (
            <div className="flex gap-4 mt-3 text-[10px] font-mono text-slate-500">
              <span>Вузлів: {data.summary.totalNodes}</span>
              <span>Ризик: {data.summary.avgRisk}%</span>
              <span>Вартість: ${(data.summary.totalValue / 1000000).toFixed(1)}M</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            ОНОВИТИ
          </button>
          <button className="px-6 py-3 rounded-xl bg-cyan-600 text-white text-sm font-black hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)]">
            ФОРМУВАТИ ЗВІТ
          </button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400">
          {error}
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pyramid of Control */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Network className="w-32 h-32" />
             </div>
             
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 uppercase italic tracking-wider">
               <Shield className="w-5 h-5 text-cyan-500" />
               Вертикаль Контролю
             </h3>
             
             <div className="space-y-6">
                {data?.levels && (
                  <>
                    <div>
                      <div className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase mb-4">
                        Рівень 1: {data.levels.level1.name}
                      </div>
                      <div className="space-y-3">
                        {data.levels.level1.nodes.map((node) => (
                          <PowerNodeComponent 
                            key={node.id} 
                            node={node} 
                            color="shadow-[0_0_15px_rgba(6,182,212,0.4)]" 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="w-px h-8 bg-gradient-to-b from-cyan-500/50 to-transparent mx-12" />
                    
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-4">
                        Рівень 2: {data.levels.level2.name}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.levels.level2.nodes.map((node) => (
                          <PowerNodeComponent key={node.id} node={node} color="" />
                        ))}
                      </div>
                    </div>

                    <div className="w-px h-8 bg-gradient-to-b from-slate-700 to-transparent mx-12" />
                    
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-4">
                        Рівень 3: {data.levels.level3.name}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {data.levels.level3.nodes.map((node) => (
                          <div key={node.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                            <div className="text-xs font-bold text-white mb-1 uppercase truncate">{node.name}</div>
                            <div className="text-[9px] text-slate-600">Вплив: {node.power}%</div>
                            <div className="text-[9px] text-slate-600">Ризик: {node.riskScore}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
             </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/20">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
               <Target className="w-5 h-5 text-indigo-400" />
               КРИТИЧНІ ІНСАЙТИ
             </h3>
             <div className="space-y-4">
               {data?.insights?.map((insight, i) => (
                 <div key={i} className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}>
                   <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-mono uppercase mb-1">
                     {getInsightIcon(insight.type)}
                     {insight.question}
                   </div>
                   <div className="text-sm font-bold text-slate-200">{insight.answer}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
             <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest text-slate-400">Останні зміни в структурі</h3>
             <div className="space-y-3">
               {data?.recentChanges?.map((log, i) => (
                 <div key={i} className="flex gap-3 text-xs">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1 flex-shrink-0" />
                   <span className="text-slate-400">{log}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerStructureView;
