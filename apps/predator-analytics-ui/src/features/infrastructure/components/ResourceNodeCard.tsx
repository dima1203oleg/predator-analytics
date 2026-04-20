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
        "bg-white/[0.03] border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group transition-all duration-500",
        onClick && "cursor-pointer hover:border-rose-500/30 hover:bg-black/40 shadow-2xl hover:shadow-rose-500/5",
        !isOnline && "opacity-40 grayscale"
      )}
    >
      <div className="absolute top-0 right-0 p-4">
        <div className={cn(
          "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border",
          isOnline ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-slate-800/20 text-slate-500 border-slate-700/30"
        )}>
          {node.status === 'online' ? 'АКТИВНИЙ' : node.status === 'offline' ? 'ОФЛАЙН' : 'ПОМИЛКОВИЙ'}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className={cn(
          "p-3 rounded-2xl bg-white/[0.03] border border-white/5",
          node.type === 'SERVER' ? "text-rose-500" : node.type === 'LAPTOP' ? "text-rose-400" : "text-rose-600"
        )}>
          {node.type === 'SERVER' ? <Box className="w-6 h-6" /> : <LaptopIcon className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="text-lg font-black text-white leading-tight tracking-tight">{node.name}</h3>
          <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">{node.location} • {node.uptime}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <ResourceMiniStat 
          icon={Cpu} 
          label="ЦП" 
          used={node.cpu.used}
          total={node.cpu.total}
          unit={node.cpu.unit}
          percent={(node.cpu.used / node.cpu.total) * 100}
          color="rose"
        />
        <ResourceMiniStat 
          icon={Database} 
          label="ОЗП" 
          used={node.ram.used}
          total={node.ram.total}
          unit={node.ram.unit}
          percent={(node.ram.used / node.ram.total) * 100}
          color="rose"
        />
        <ResourceMiniStat 
          icon={HardDrive} 
          label="ДИСК" 
          used={node.disk.used}
          total={node.disk.total}
          unit={node.disk.unit}
          percent={(node.disk.used / node.disk.total) * 100}
          color="slate"
        />
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ПРИСКОРЮВАЧІ NVIDIA / GPU</span>
          <span className="text-[10px] text-slate-700 font-mono font-black">{node.gpu.length} ОДИНИЦЬ</span>
        </div>
        
        {node.gpu.map((g, i) => {
          const freeVram = g.vram_total - g.vram_used;
          return (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-200 font-black uppercase tracking-tight">{g.model}</span>
                <div className="flex items-center gap-2 text-rose-500">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span className="font-black font-mono">{g.temp}°C</span>
                </div>
              </div>
              <GpuGauge utilization={(g.vram_used / g.vram_total) * 100} label="" />
              <div className="flex justify-between text-[9px] text-slate-500 font-black uppercase">
                <span>Зайнято: <span className="text-slate-300">{g.vram_used.toFixed(1)} GB</span></span>
                <span>Вільно: <span className="text-emerald-400">{freeVram.toFixed(1)} GB</span> ({g.vram_total} GB)</span>
              </div>
            </div>
          );
        })}
      </div>

    </motion.div>
  );
}

function ResourceMiniStat({ icon: Icon, label, used, total, unit, percent, color }: any) {
  const barColor = color === 'rose' ? 'bg-rose-500' : 'bg-slate-500';
  const shadowColor = color === 'rose' ? 'shadow-[0_0_8px_rgba(225,29,72,0.3)]' : 'shadow-[0_0_8px_rgba(100,116,139,0.3)]';
  const iconColor = color === 'rose' ? 'text-rose-500' : 'text-slate-500';

  const free = total - used;
  const isPercent = unit === '%';
  const displayFree = isPercent ? `${free.toFixed(0)}${unit}` : `${free.toFixed(1)}${unit}`;
  const displayUsed = isPercent ? `${used.toFixed(0)}${unit}` : `${used.toFixed(1)}${unit}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
        <Icon className={cn("w-3.5 h-3.5", iconColor)} />
        <span>{label}</span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={cn("h-full rounded-full transition-all duration-1000", barColor, shadowColor)}
        />
      </div>
      <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase mt-2">
        <span>Зайнято: <br/><span className="text-slate-300 text-[10px]">{displayUsed}</span></span>
        <span className="text-right">Вільно: <br/><span className="text-emerald-400 text-[10px]">{displayFree}</span></span>
      </div>
    </div>
  );
}

// Ensure Laptop icon is imported if not available in standard lucide
import { Laptop as LaptopIcon } from 'lucide-react';
