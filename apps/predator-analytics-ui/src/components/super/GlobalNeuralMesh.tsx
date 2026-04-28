import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Zap, Activity, ShieldCheck, Globe, Cpu, MoreHorizontal, Link as LinkIcon, Maximize2, Shield, Hexagon } from 'lucide-react';
import Nvidia3DVisualizer from './Nvidia3DVisualizer';
import { useBackendStatus } from '@/hooks/useBackendStatus';

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
  const { nodes: clusterNodes, activeFailover } = useBackendStatus();
  const [nodes, setNodes] = useState<NeuralNode[]>([]);

  useEffect(() => {
    const nvidia = clusterNodes.find(n => n.id === 'nvidia');
    const colab = clusterNodes.find(n => n.id === 'colab');

    setNodes([
      { 
        id: 'NODE-NV-MASTER', 
        name: 'NVIDIA H100 MASTER', 
        type: 'nvidia-server', 
        status: nvidia?.status === 'online' ? (activeFailover ? 'busy' : 'online') : 'offline', 
        load: status?.realtime_metrics?.cpu_percent || 42, 
        gpu_temp: status?.realtime_metrics?.gpu_temp || 62,
        latency: 12, 
        region: 'KYIV-MESH' 
      },
      { 
        id: 'NODE-CL-MIRROR', 
        name: 'COLAB CLOUD MIRROR', 
        type: 'cloud-instance', 
        status: colab?.status === 'online' ? (activeFailover ? 'online' : 'syncing') : 'offline', 
        load: activeFailover ? 85 : 5, 
        latency: 120, 
        region: 'GLOBAL-NORTH' 
      },
      { id: 'NODE-ED-04', name: 'Edge Oracle Elite', type: 'edge-node', status: 'online', load: 15, latency: 8, region: 'GATEWAY-01' },
      { id: 'NODE-ED-05', name: 'Sovereign Guard', type: 'edge-node', status: 'online', load: 22, latency: 6, region: 'GATEWAY-02' },
    ]);
  }, [clusterNodes, activeFailover, status]);

  return (
    <div className="p-8 bg-slate-950/40 backdrop-blur-3xl border border-rose-500/10 rounded-[40px] shadow-2xl relative overflow-hidden group h-full flex flex-col">
      {/* Background Grid Decoration */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #e11d48 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-500/20 rounded-2xl border border-rose-500/30">
              <Globe className="text-rose-500 animate-spin-slow" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase italic uppercase">ГЛОБАЛЬНА НЕЙ ОННА МЕ ЕЖА</h2>
              <p className="text-[10px] text-rose-600/60 font-black font-mono uppercase tracking-[0.3em]">Distributed Intelligence v58.2-WRAITH</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="px-5 py-2 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-black text-rose-500 font-mono uppercase tracking-widest">
              Active Nodes: 12.4k
            </div>
          </div>
        </div>

        {/* 🚀 Dynamic 3D Overview Section */}
        <div className="mb-8 h-[280px] w-full rounded-[32px] overflow-hidden border border-rose-500/10 shadow-3xl relative">
            <div className="absolute top-6 left-6 z-40 px-4 py-1.5 bg-rose-500 text-black text-[10px] font-black rounded-xl uppercase tracking-[0.2em] shadow-lg">
                SOVEREIGN_VISUAL_CORE
            </div>
            <Nvidia3DVisualizer load={status?.realtime_metrics?.gpu_utilization || 56} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <AnimatePresence>
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4, border: '1px solid rgba(225,29,72,0.3)' }}
                className="group relative p-6 bg-black/60 border border-white/5 rounded-3xl transition-all overflow-hidden"
              >
                {/* Node Status Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 blur-[50px] opacity-15 transition-opacity ${
                  node.status === 'online' ? 'bg-emerald-500' :
                  node.status === 'busy' ? 'bg-rose-500' : 'bg-rose-500'
                }`} />

                <div className="flex items-center justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 shadow-inner group-hover:bg-slate-850 transition-colors">
                      {node.type === 'nvidia-server' ? <Cpu className="text-rose-500" size={20} /> :
                       node.type === 'edge-node' ? <Hexagon className="text-rose-400" size={20} /> :
                       <Server className="text-rose-600" size={20} />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white italic tracking-wide">{node.name}</div>
                      <div className="text-[9px] text-slate-500 font-black font-mono uppercase tracking-[0.2em]">{node.id}</div>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    node.status === 'online' ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' :
                    node.status === 'busy' ? 'bg-rose-400 animate-ping shadow-[0_0_10px_#f43f5e]' :
                    'bg-rose-400'
                  }`} />
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                    <span className="text-slate-500">Node Load</span>
                    <span className={node.load > 80 ? 'text-rose-400' : 'text-rose-500'}>{node.load}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${node.load}%` }}
                      className={`h-full bg-gradient-to-r ${
                        node.load > 80 ? 'from-rose-600 to-rose-400' : 'from-rose-600 to-rose-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-5 py-3 border-t border-white/5">
                    <div className="flex gap-6">
                       <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Region</span>
                          <span className="text-[10px] text-slate-200 font-black italic tracking-tight">{node.region}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Ping</span>
                          <span className="text-[10px] text-emerald-400 font-black tabular-nums">{node.latency}ms</span>
                       </div>
                    </div>
                    {node.gpu_temp && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Temp</span>
                        <span className="text-[10px] text-rose-500 font-black tabular-nums">{node.gpu_temp}°C</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button className="w-full mt-8 py-5 bg-rose-500/5 hover:bg-rose-500/10 rounded-3xl border border-rose-500/20 text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all group hover:tracking-[0.5em]">
          <LinkIcon size={16} className="group-hover:rotate-45 transition-transform" /> 
          ЗАК ІПИТИ НОВИЙ ВУЗОЛ WRAITH
        </button>
      </div>
    </div>
  );
};

export default GlobalNeuralMesh;
