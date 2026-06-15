import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

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
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        backgroundColor="#000000"
        nodeLabel="id"
        nodeColor={(node: any) => node.group === 1 ? '#ef4444' : '#10b981'}
        nodeResolution={16}
        linkColor={() => 'rgba(16, 185, 129, 0.4)'}
        linkWidth={1.5}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => '#3b82f6'}
        linkDirectionalParticleSpeed={d => Math.random() * 0.01 + 0.005}
        nodeThreeObject={(node: any) => {
          // Create glowing spheres
          const isTarget = node.group === 1;
          const geometry = new THREE.SphereGeometry(isTarget ? 8 : 4);
          const material = new THREE.MeshBasicMaterial({ 
            color: isTarget ? '#ef4444' : '#10b981',
            transparent: true,
            opacity: 0.8
          });
          const sphere = new THREE.Mesh(geometry, material);
          
          // Add a glowing halo
          const haloGeo = new THREE.SphereGeometry(isTarget ? 12 : 6);
          const haloMat = new THREE.MeshBasicMaterial({
            color: isTarget ? '#f87171' : '#34d399',
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          sphere.add(halo);
          
          return sphere;
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
