import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Database, HardDrive, Thermometer, Box } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GpuGauge } from './GpuGauge';

interface ResourceMetrics {
  used: number;
  total: number;
  unit: string;
}

interface GpuMetrics {
  model: string;
  vram_used: number;
  vram_total: number;
  temp: number;
}

export interface NodeHardwareProps {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'degraded';
  cpu: ResourceMetrics;
  ram: ResourceMetrics;
  disk: ResourceMetrics;
  gpu: GpuMetrics[];
  location: string;
  uptime: string;
}

export function ResourceNodeCard({ node, onClick }: { node: NodeHardwareProps, onClick?: () => void }) {
  const isOnline = node.status === 'online';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group transition-all duration-300",
        onClick && "cursor-pointer hover:border-white/20 hover:bg-black/50 shadow-lg hover:shadow-white/5",
        !isOnline && "opacity-50 grayscale"
      )}
    >
      <div className="absolute top-0 right-0 p-4">
        <div className={cn(
          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
          isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-500"
        )}>
          {node.status === 'online' ? 'В МЕРЕЖІ' : node.status === 'offline' ? 'ОФЛАЙН' : 'ДЕГРАДОВАНО'}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={cn(
          "p-3 rounded-xl bg-white/5",
          node.type === 'SERVER' ? "text-cyan-400" : node.type === 'LAPTOP' ? "text-rose-400" : "text-violet-400"
        )}>
          {node.type === 'SERVER' ? <Box className="w-6 h-6" /> : <LaptopIcon className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">{node.name}</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{node.location} • {node.uptime}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <ResourceMiniStat 
          icon={Cpu} 
          label="ЦП" 
          value={`${node.cpu.used}${node.cpu.unit}`} 
          percent={(node.cpu.used / node.cpu.total) * 100}
          color="cyan"
        />
        <ResourceMiniStat 
          icon={Database} 
          label="ОЗП" 
          value={`${node.ram.used}/${node.ram.total} ${node.ram.unit}`} 
          percent={(node.ram.used / node.ram.total) * 100}
          color="violet"
        />
        <ResourceMiniStat 
          icon={HardDrive} 
          label="ДИСК" 
          value={`${node.disk.used}/${node.disk.total} ${node.disk.unit}`} 
          percent={(node.disk.used / node.disk.total) * 100}
          color="emerald"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ГРАФІЧНІ ПРИСКОРЮВАЧІ (NVIDIA)</span>
          <span className="text-[10px] text-slate-600 font-mono">{node.gpu.length} ОДИН.</span>
        </div>
        
        {node.gpu.map((g, i) => (
          <div key={i} className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-300 font-bold">{g.model}</span>
              <div className="flex items-center gap-2 text-slate-500">
                <Thermometer className="w-3 h-3 text-rose-500" />
                <span>{g.temp}°C</span>
              </div>
            </div>
            <GpuGauge utilization={(g.vram_used / g.vram_total) * 100} label="" />
            <div className="flex justify-between text-[9px] text-slate-600 font-mono">
              <span>ВИТРАТА VRAM</span>
              <span>{g.vram_used} / {g.vram_total} GB</span>
            </div>
          </div>
        ))}
      </div>

    </motion.div>
  );
}

function ResourceMiniStat({ icon: Icon, label, value, percent, color }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-wider">
        <Icon className={cn("w-3 h-3", `text-${color}-500`)} />
        <span>{label}</span>
      </div>
      <div className="text-sm font-bold text-white truncate">{value}</div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={cn("h-full", `bg-${color}-500 shadow-[0_0_8px_rgba(var(--${color}-500),0.3)]`)}
        />
      </div>
    </div>
  );
}

// Ensure Laptop icon is imported if not available in standard lucide
import { Laptop as LaptopIcon } from 'lucide-react';
