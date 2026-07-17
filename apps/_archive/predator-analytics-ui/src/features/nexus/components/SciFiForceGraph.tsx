import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface SciFiForceGraphProps {
  data: {
    nodes: any[];
    links: any[];
  };
}

export const SciFiForceGraph = ({ data }: SciFiForceGraphProps) => {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ cursor: 'crosshair' }}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        backgroundColor="#000000"
        nodeLabel="id"
        nodeColor={(node: any) => node.group === 1 ? '#ef4444' : '#10b981'}
        linkColor={() => 'rgba(16, 185, 129, 0.4)'}
        linkWidth={1.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => '#3b82f6'}
        linkDirectionalParticleSpeed={d => Math.random() * 0.01 + 0.005}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const isTarget = node.group === 1;
          const color = isTarget ? '#ef4444' : '#10b981';
          const size = isTarget ? 8 : 4;
          
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Glow effect
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI, false);
          ctx.fillStyle = isTarget ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
          ctx.fill();
        }}
      />
      {/* Sci-Fi Targeting Overlay */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-32 h-32 rounded-full border border-emerald-500/20 flex items-center justify-center">
          <div className="w-1 h-2 absolute top-0 bg-emerald-500"></div>
          <div className="w-1 h-2 absolute bottom-0 bg-emerald-500"></div>
          <div className="w-2 h-1 absolute left-0 bg-emerald-500"></div>
          <div className="w-2 h-1 absolute right-0 bg-emerald-500"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500/50"></div>
        </div>
      </div>
    </div>
  );
};
