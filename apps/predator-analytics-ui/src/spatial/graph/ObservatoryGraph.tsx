import React, { useRef, useEffect, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { useDataStore } from '../../stores/dataStore';

interface ObservatoryGraphProps {
  // Option to pass a custom dimension or reference for size
}

export const ObservatoryGraph: React.FC<ObservatoryGraphProps> = () => {
  const fgRef = useRef<any>();
  const nodes = useDataStore((s) => s.nodes);
  const edges = useDataStore((s) => s.edges);

  // Re-format data for react-force-graph-3d
  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(n => ({ ...n, id: n.id, val: n.riskScore || 1 })),
      links: edges.map(e => ({ source: e.source, target: e.target, val: e.weight || 1 }))
    };
  }, [nodes, edges]);

  // Handle custom Node Geometry
  const renderNode = (node: any) => {
    // Basic rules from THE OBSERVATORY spec
    const color = node.riskScore > 80 ? 0xef4444 : node.riskScore > 50 ? 0xf59e0b : 0x06b6d4;

    if (node.type === 'company') {
      // Hexagonal / Polyhedron structure
      const geometry = new THREE.IcosahedronGeometry(1.5, 0);
      const material = new THREE.MeshPhysicalMaterial({
        color,
        transmission: 0.9,
        opacity: 1,
        metalness: 0.8,
        roughness: 0.1,
        ior: 1.5,
        thickness: 2.0,
      });
      return new THREE.Mesh(geometry, material);
    } else if (node.type === 'person') {
      // Sphere with glow
      const geometry = new THREE.SphereGeometry(1.2, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.5,
      });
      return new THREE.Mesh(geometry, material);
    } else if (node.type === 'document') {
      // Octahedron
      const geometry = new THREE.OctahedronGeometry(1, 0);
      const material = new THREE.MeshPhongMaterial({
        color: 0x9ca3af, // gray
        shininess: 100,
      });
      return new THREE.Mesh(geometry, material);
    }

    // Default node
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    return new THREE.Mesh(geometry, material);
  };

  useEffect(() => {
    // Add cool forces
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-150); // Push nodes apart
      fgRef.current.d3Force('link').distance(40);     // Link distance
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-auto" style={{ zIndex: 10 }}>
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeThreeObject={renderNode}
        backgroundColor="rgba(0,0,0,0)" // Transparent so we can see EnergyCore and map
        linkColor={() => 'rgba(255, 255, 255, 0.2)'}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        linkDirectionalParticleColor={() => '#3b82f6'} // Blue particles moving
        linkDirectionalParticleSpeed={0.01}
        showNavInfo={false}
        enableNodeDrag={true}
        nodeLabel="label"
        onNodeClick={(node) => {
          // Focus node on click
          const distance = 40;
          const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
          
          if(fgRef.current) {
            fgRef.current.cameraPosition(
              { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, 
              node, // lookAt ({ x, y, z })
              3000  // ms transition duration
            );
          }
        }}
      />
    </div>
  );
};
