import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ProgressBar, Text, Flex, Metric } from '@tremor/react';

export const FunnelStageNode: React.FC<NodeProps> = ({ data }) => {
  const value = data.value as number || 0;
  const target = data.target as number || 100;
  const percentage = Math.round((value / target) * 100);

  return (
    <div className="min-w-[280px] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-5 shadow-2xl">
      <Handle type="target" position={Position.Top} className="w-4 h-2 rounded-sm bg-slate-500 border-none" />
      
      <Flex alignItems="center" justifyContent="between" className="mb-2">
        <Text className="text-slate-300 font-orbitron uppercase tracking-widest text-xs">{data.label as string}</Text>
        <span className="text-[10px] text-cyan-400 font-rajdhani bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
          STAGE {data.stage as string}
        </span>
      </Flex>
      
      <Metric className="text-white font-rajdhani text-2xl mb-4">{value.toLocaleString()}</Metric>
      
      <Flex className="mb-1">
        <Text className="text-[10px] text-slate-500 font-rajdhani uppercase">Конверсія</Text>
        <Text className="text-[10px] text-cyan-400 font-rajdhani font-bold">{percentage}%</Text>
      </Flex>
      <ProgressBar value={percentage} color="cyan" className="mt-2" />

      <Handle type="source" position={Position.Bottom} className="w-4 h-2 rounded-sm bg-slate-500 border-none" />
    </div>
  );
};
