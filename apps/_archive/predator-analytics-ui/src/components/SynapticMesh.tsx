import React, { useRef, useMemo, useCallback } from 'react';
import ForceGraph3D from 'r3f-forcegraph';
import * as THREE from 'three';
import { usePredatorStore } from '../stores/usePredatorStore';
import { useUIStore } from '../stores/useUIStore';
import { GraphNode } from '../types/index';
import { GPU_CONFIG } from '../core/gpuConfig';

// Memoized Geometries & Materials for performance
// Оптимізовано для RTX 3050: зменшено деталізацію (полігонаж)
const geometries = {
  person: new THREE.SphereGeometry(0.3, GPU_CONFIG.SPHERE_SEGMENTS, GPU_CONFIG.SPHERE_SEGMENTS),
  company: new THREE.BoxGeometry(0.4, 0.4, 0.4),
  country: new THREE.OctahedronGeometry(0.35, 0),
  offshore: new THREE.ConeGeometry(0.3, 0.6, 4), // Roughly a diamond
  contract: new THREE.PlaneGeometry(0.5, 0.3),
  case: new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6),
  customs: new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8),
  risk: new THREE.TetrahedronGeometry(0.4, 0)
};

const materials = {
  person: new THREE.MeshStandardMaterial({ color: '#00e5ff', roughness: 0.1, metalness: 0.8, emissive: '#00e5ff', emissiveIntensity: 0.2 }),
  company: new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.4, metalness: 0.6 }),
  country: new THREE.MeshPhysicalMaterial({ color: '#4A90D9', roughness: 0.2, metalness: 0.1, transmission: 0.8, transparent: true }),
  offshore: new THREE.MeshStandardMaterial({ color: '#ffb700', roughness: 0.1, metalness: 0.9, emissive: '#ffb700', emissiveIntensity: 0.2 }),
  contract: new THREE.MeshPhysicalMaterial({ color: '#CBD5E1', transmission: 0.9, opacity: 1, transparent: true }),
  case: new THREE.MeshStandardMaterial({ color: '#2D5F8A', metalness: 0.8, roughness: 0.3 }),
  customs: new THREE.MeshStandardMaterial({ color: '#718096', metalness: 0.7, roughness: 0.3 }),
  risk: new THREE.MeshStandardMaterial({ color: '#ff003c', emissive: '#ff003c', emissiveIntensity: 0.8 }) 
};

export const SynapticMesh: React.FC = () => {
  const nodes = usePredatorStore((state) => state.nodes);
  const edges = usePredatorStore((state) => state.edges);
  const selectNode = usePredatorStore((state) => state.selectNode);
  const setHoveredNode = usePredatorStore((state) => state.setHoveredNode);
  const selectedNodeId = usePredatorStore((state) => state.selectedNodeId);
  const riskThreshold = useUIStore((state) => state.riskThreshold);

  // Обрізаємо кількість нод для слабкого GPU
  const graphData = useMemo(() => {
    const limitedNodes = nodes.slice(0, GPU_CONFIG.MAX_GRAPH_NODES);
    const validNodeIds = new Set(limitedNodes.map(n => n.id));
    const limitedEdges = edges.filter(e => validNodeIds.has(e.source as string) && validNodeIds.has(e.target as string));
    return { nodes: limitedNodes, links: limitedEdges };
  }, [nodes, edges]);

  const materialCache = new Map<string, THREE.Material>();

  const nodeThreeObject = useCallback((node: any) => {
    const graphNode = node as GraphNode;
    let geometry: any = geometries.person;
    let baseMaterial: any = materials.person;

    if (geometries[graphNode.type as keyof typeof geometries]) {
      geometry = geometries[graphNode.type as keyof typeof geometries];
      baseMaterial = materials[graphNode.type as keyof typeof materials];
    }

    const group = new THREE.Group();
    
    // Scale by energy
    const scale = graphNode.energy || 1;

    // Fade by confidence or risk threshold
    const isFilteredOut = graphNode.riskScore < riskThreshold;
    const isSelected = selectedNodeId === graphNode.id;
    
    let activeMaterial = baseMaterial;
    
    if (isFilteredOut || (baseMaterial.transparent && 'opacity' in baseMaterial)) {
        // Discretize opacity to 20 levels (0.05 intervals) to maximize cache hits
        const targetOpacity = isFilteredOut ? 0.05 : Math.max(0.2, Math.round(graphNode.confidence * 20) / 20);
        const cacheKey = `${graphNode.type}-${targetOpacity}-${isFilteredOut}`;
        
        if (!materialCache.has(cacheKey)) {
          const matClone = baseMaterial.clone();
          matClone.transparent = true;
          matClone.opacity = targetOpacity;
          if (isFilteredOut) {
              matClone.depthWrite = false;
          }
          materialCache.set(cacheKey, matClone);
        }
        activeMaterial = materialCache.get(cacheKey)! as any;
    }

    const mesh = new THREE.Mesh(geometry, activeMaterial);
    mesh.scale.set(scale, scale, scale);
    group.add(mesh);

    // Додаємо світіння (Glow Aura) для важливих або вибраних нод
    if (!isFilteredOut && (isSelected || graphNode.riskScore > 0.7)) {
      const glowGeo = geometry.clone();
      const glowColor = isSelected ? '#ffb700' : (graphNode.riskScore > 0.8 ? '#ff003c' : '#00e5ff');
      const glowMat = new THREE.MeshBasicMaterial({ 
        color: glowColor, 
        transparent: true, 
        opacity: isSelected ? 0.4 : 0.15,
        side: THREE.BackSide,
        depthWrite: false
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.scale.set(scale * 1.5, scale * 1.5, scale * 1.5);
      group.add(glowMesh);
    }

    return group;
  }, [riskThreshold, selectedNodeId]);

  const linkMaterial = useCallback((link: any) => {
    switch (link.type) {
      case 'confirmed':
        return new THREE.LineBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.3 });
      case 'unconfirmed':
        return new THREE.LineDashedMaterial({ color: '#5A6A7A', dashSize: 0.1, gapSize: 0.1 });
      case 'critical':
        return new THREE.LineBasicMaterial({ color: '#ff003c', linewidth: 2, transparent: true, opacity: 0.6 });
      default:
        return new THREE.LineBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.2 });
    }
  }, []);

  return (
    <ForceGraph3D
      graphData={graphData}
      nodeThreeObject={nodeThreeObject}
      linkMaterial={linkMaterial}
      linkDirectionalParticles={(link: any) => {
        // Лімітуємо кількість частинок для слабкого GPU
        if (edges.length > GPU_CONFIG.MAX_PARTICLE_LINKS) return 0;
        return link.type === 'critical' ? 1 : 0;
      }}
      linkDirectionalParticleWidth={1.5}
      linkDirectionalParticleSpeed={0.006}
      linkDirectionalParticleColor={(link: any) => link.type === 'critical' ? '#ff003c' : '#00e5ff'}
      // @ts-ignore
      nodeRelSize={4}
      numDimensions={3}
      onNodeClick={(node: any) => selectNode((node as GraphNode).id)}
      onNodeHover={(node: any) => setHoveredNode(node ? (node as GraphNode).id : null)}
      enableNodeDrag={true}
      showNavInfo={false}
      warmupTicks={100}
      cooldownTicks={0}
      backgroundColor="#00000000" // transparent to see background
    />
  );
};
