import React, { useRef, useMemo, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { usePredatorStore } from '../../../stores/usePredatorStore';
import * as THREE from 'three';

export const VoidForgeGraph3D = () => {
  const fgRef = useRef<any>();
  const { nodes, edges, selectNode, selectedNodeId } = usePredatorStore();

  // Map our 'edges' to 'links' for the force graph
  const graphData = useMemo(() => {
    return {
      nodes: nodes.map(n => ({ ...n })),
      links: edges.map(e => ({ ...e, source: e.source, target: e.target }))
    };
  }, [nodes, edges]);

  // Handle zooming to node on select
  const handleNodeClick = useCallback((node: any) => {
    selectNode(node.id);
    
    // Aim at node from outside it
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        node, // lookAt ({ x, y, z })
        3000  // ms transition duration
      );
    }
  }, [selectNode]);

  // Create glowing spheres for nodes
  const nodeThreeObject = useCallback((node: any) => {
    const isSelected = selectedNodeId === node.id;
    const color = isSelected ? '#ffb700' : (node.color || '#00e5ff');
    const radius = node.val ? Math.max(2, Math.min(8, node.val)) : 4;

    const group = new THREE.Group();

    // Core sphere
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Glow aura
    const glowGeometry = new THREE.SphereGeometry(radius * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color, 
      transparent: true, 
      opacity: isSelected ? 0.6 : 0.2, 
      side: THREE.BackSide 
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Outline if selected
    if (isSelected) {
      const outlineGeo = new THREE.SphereGeometry(radius * 1.8, 16, 16);
      const outlineMat = new THREE.MeshBasicMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.5 });
      const outline = new THREE.Mesh(outlineGeo, outlineMat);
      group.add(outline);
    }

    return group;
  }, [selectedNodeId]);

  return (
    <div className="absolute inset-0 z-0 bg-[#060A0F]">
      <ForceGraph3D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="label"
        nodeColor="color"
        nodeThreeObject={nodeThreeObject}
        linkWidth={1.5}
        linkColor={() => 'rgba(0, 229, 255, 0.2)'}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        linkDirectionalParticleColor={() => '#00e5ff'}
        onNodeClick={handleNodeClick}
        backgroundColor="#060A0F"
        showNavInfo={false}
      />
    </div>
  );
};
