import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Zap, Activity, ShieldCheck, Globe, Cpu, MoreHorizontal, Link as LinkIcon, Maximize2 } from 'lucide-react';
import Nvidia3DVisualizer from './Nvidia3DVisualizer';

interface NeuralNode {
  id: string;
  name: string;
  type: 'nvidia-server' | 'edge-node' | 'cloud-instance';
  status: 'online' | 'busy' | 'offline' | 'syncing';
  load: number;
  gpu_temp?: number;
  latency: number;
  region: string;
}

interface GlobalNeuralMeshProps {
  status?: any;
}

const GlobalNeuralMesh: React.FC<GlobalNeuralMeshProps> = ({ status }) => {
  const [nodes, setNodes] = useState<NeuralNode[]>([
    { id: 'NODE-NV-01', name: 'NVIDIA H100 Cluster', type: 'nvidia-server', status: 'online', load: 42, gpu_temp: 68, latency: 12, region: 'EU-CENTRAL' },
    { id: 'NODE-NV-02', name: 'NVIDIA A100 Node', type: 'nvidia-server', status: 'busy', load: 89, gpu_temp: 74, latency: 45, region: 'US-EAST' },
    { id: 'NODE-ED-04', name: 'Edge Oracle V3', type: 'edge-node', status: 'online', load: 15, latency: 8, region: 'LOCAL-MESH' },
    { id: 'NODE-CL-09', name: 'Predator Shadow Cloud', type: 'cloud-instance', status: 'syncing', load: 0, latency: 120, region: 'GLOBAL' },
  ]);

  useEffect(() => {
    if (status?.realtime_metrics) {
        setNodes(curr => {
            const next = [...curr];
            // Simulate load on primary cluster
            next[0].load = status.realtime_metrics.cpu_load || status.realtime_metrics.cpu_percent || 42;
            next[0].status = status.health_score > 90 ? 'online' : status.health_score > 70 ? 'busy' : 'offline';
            return next;
        });
    }
  }, [status]);

  return (
    <div className="p-8 bg-slate-950/60 backdrop-blur-2xl border border-blue-500/20 rounded-[40px] shadow-2xl relative overflow-hidden group">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Globe className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase italic">ГЛОБАЛЬНА НЕЙРОННА МЕРЕЖА</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Distributed Intelligence v47.1</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="px-4 py-1 bg-black/40 border border-white/10 rounded-full text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">
              Active Clusters: 4
            </div>
            <Maximize2 size={18} className="text-slate-500 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>

        {/* 🚀 Dynamic 3D Overview Section */}
        <div className="mb-6 h-[250px] w-full rounded-[24px] overflow-hidden border border-white/5 shadow-2xl relative">
            <div className="absolute top-4 left-4 z-40 px-3 py-1 bg-emerald-500 text-black text-[9px] font-black rounded-lg uppercase tracking-widest">
                Real-Time Render
            </div>
            <Nvidia3DVisualizer load={56} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all overflow-hidden"
              >
                {/* Node Status Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] opacity-10 transition-opacity ${
                  node.status === 'online' ? 'bg-emerald-500' :
                  node.status === 'busy' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 shadow-inner">
                      {node.type === 'nvidia-server' ? <Cpu className="text-emerald-400" size={18} /> :
                       node.type === 'edge-node' ? <Zap className="text-amber-400" size={18} /> :
                       <Server className="text-blue-400" size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">{node.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">{node.id}</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    node.status === 'online' ? 'bg-emerald-400 animate-pulse' :
                    node.status === 'busy' ? 'bg-amber-400 animate-ping' :
                    'bg-blue-400'
                  }`} />
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-slate-500">Compute Load</span>
                    <span className={node.load > 80 ? 'text-amber-400' : 'text-blue-400'}>{node.load}%</span>
                  </div>
                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${node.load}%` }}
                      className={`h-full bg-gradient-to-r ${
                        node.load > 80 ? 'from-amber-600 to-orange-400' : 'from-blue-600 to-indigo-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4 py-2 border-t border-white/5">
                    <div className="flex gap-4">
                       <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-mono">Region</span>
                          <span className="text-[9px] text-slate-300 font-bold tracking-tighter">{node.region}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-mono">Lat</span>
                          <span className="text-[9px] text-slate-300 font-bold tracking-tighter">{node.latency}ms</span>
                       </div>
                    </div>
                    {node.gpu_temp && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-500 uppercase font-mono">GPU Temp</span>
                        <span className="text-[9px] text-amber-500 font-bold tracking-tighter">{node.gpu_temp}°C</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button className="w-full mt-6 py-4 bg-blue-500/5 hover:bg-blue-500/10 rounded-2xl border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-all group">
          <MoreHorizontal size={14} className="group-hover:rotate-90 transition-transform" /> Додати Новий Вузол / NVIDIA Воркер
        </button>
      </div>
    </div>
  );
};

export default GlobalNeuralMesh;
