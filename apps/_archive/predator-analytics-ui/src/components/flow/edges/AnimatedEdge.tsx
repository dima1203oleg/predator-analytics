import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export const AnimatedEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isHighRisk = data?.risk === 'high';
  const color = isHighRisk ? '#ef4444' : '#00e5ff';
  const weight = (data?.weight as number) || 2;

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...style,
          strokeWidth: weight,
          stroke: color,
          opacity: 0.6,
        }}
        className="react-flow__edge-path"
      />
      {/* Animated glowing path over the base edge */}
      <BaseEdge 
        id={`${id}-animated`} 
        path={edgePath} 
        style={{
          ...style,
          strokeWidth: weight,
          stroke: color,
          strokeDasharray: '5, 15',
          animation: 'dashdraw 30s linear infinite',
        }}
        className="react-flow__edge-path"
      />
      
      {data?.label && (
        <g transform={`translate(${labelX},${labelY})`}>
          <rect x="-30" y="-10" width="60" height="20" rx="4" fill="#0f172a" fillOpacity="0.8" stroke={color} strokeWidth="1" />
          <text
            x="0"
            y="0"
            dominantBaseline="central"
            textAnchor="middle"
            fill={color}
            fontSize="10"
            fontFamily="Orbitron"
            letterSpacing="0.05em"
          >
            {data.label as string}
          </text>
        </g>
      )}
      
      <style>{`
        @keyframes dashdraw {
          from {
            stroke-dashoffset: 1000;
          }
        }
      `}</style>
    </>
  );
};
