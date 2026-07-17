import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ShieldAlert, Building2, User } from 'lucide-react';

export type EntityType = 'company' | 'person' | 'account' | 'address' | 'vessel' | 'transaction' | 'unknown';

export interface EntityNodeData {
  label: string;
  type: EntityType;
  risk?: 'low' | 'medium' | 'high' | 'critical';
  country?: string;
  riskScore?: number;
  details?: string;
  [key: string]: unknown;
}


export const EntityNode: React.FC<NodeProps> = ({ data }) => {
  const isHighRisk = data.risk === 'high' || data.risk === 'critical';
  const Icon = data.type === 'company' ? Building2 : User;

  return (
    <div className={`
      relative min-w-[200px] bg-slate-900/80 backdrop-blur-md 
      border ${isHighRisk ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-cyan-500/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]'}
      rounded-lg p-4 transition-all hover:scale-105
    `}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-400 border-none" />
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isHighRisk ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="text-white font-rajdhani font-bold text-sm tracking-wider">{data.label as string}</h3>
          <p className="text-[10px] text-slate-400 font-orbitron uppercase tracking-widest">{data.type as string}</p>
        </div>
        {isHighRisk && (
          <div className="ml-auto">
            <ShieldAlert size={16} className="text-red-400 animate-pulse" />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-400 border-none" />
    </div>
  );
};
