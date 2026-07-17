import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { useGraphStore } from '../../core/state/graph.store';
import { useSpatialStore } from '../../core/state/spatial.store';

/**
 * Graph3DEngine is the heavy WebGL component that renders the relational graph.
 * It is meant to be lazy-loaded to prevent SSR issues and optimize initial bundle.
 */
const Graph3DEngine: React.FC = () => {
  const fgRef = useRef<any>();
  const nodes = useGraphStore((state) => state.nodes);
  const links = useGraphStore((state) => state.links);
  const isTimelineMode = useGraphStore((state) => state.isTimelineMode);
  
  const setSelectedNodeId = useGraphStore((state) => state.setSelectedNodeId);
  const setHoveredNodeId = useGraphStore((state) => state.setHoveredNodeId);
  const setGraphEngineRef = useGraphStore((state) => state.setGraphEngineRef);
  const hoveredNodeId = useGraphStore((state) => state.hoveredNodeId);
  
  const focusOnEntity = useSpatialStore((state) => state.focusOnEntity);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  // Register the ForceGraph instance in Zustand so other parts of the app can call emitParticle
  useEffect(() => {
    if (fgRef.current) {
      setGraphEngineRef(fgRef.current);
    }
  }, [setGraphEngineRef]);

  // Handle node click to trigger spatial navigation
  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNodeId(node.id);
      if (node.x !== undefined && node.y !== undefined && node.z !== undefined) {
        focusOnEntity({ x: node.x, y: node.y, z: node.z });
      }
    },
    [setSelectedNodeId, focusOnEntity]
  );

  const handleNodeHover = useCallback(
    (node: any) => {
      setHoveredNodeId(node ? node.id : null);
    },
    [setHoveredNodeId]
  );

  // Pre-create materials to avoid recreating them on every node
  const materials = useMemo(() => {
    // 1. Компанії: Темне скло з металевим відблиском
    const companyMat = new THREE.MeshPhysicalMaterial({
      color: '#1a202c', // Dark slate
      transmission: 0.9,
      opacity: 1,
      metalness: 0.8,
      roughness: 0.1,
      ior: 1.5,
      thickness: 2.0,
      side: THREE.DoubleSide,
      transparent: true,
    });

    // 2. Люди: Бірюзове світіння (базовий матеріал)
    const personMat = new THREE.MeshStandardMaterial({
      color: '#4fd1c5',
      emissive: '#319795',
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.2,
    });

    // 3. Документи: Інформаційні кристали (жовті)
    const docMat = new THREE.MeshPhysicalMaterial({
      color: '#ecc94b',
      transmission: 0.6,
      opacity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
      clearcoat: 1.0,
      transparent: true,
    });

    // 4. Контейнери: Блоки
    const containerMat = new THREE.MeshStandardMaterial({
      color: '#a0aec0',
      roughness: 0.7,
      metalness: 0.3,
    });

    // Risk material (Red glow)
    const riskMat = new THREE.MeshStandardMaterial({
      color: '#f56565',
      emissive: '#c53030',
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
    });
    
    // Hover material (White highlight)
    const hoverMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 0.5,
      wireframe: true,
    });

    return { companyMat, personMat, docMat, containerMat, riskMat, hoverMat };
  }, []);

  // Pre-create geometries
  const geometries = useMemo(() => ({
    company: new THREE.IcosahedronGeometry(4, 1), // Складний багатогранник
    personOuter: new THREE.TetrahedronGeometry(3),
    personInner: new THREE.SphereGeometry(1.5),
    document: new THREE.OctahedronGeometry(2.5),
    container: new THREE.BoxGeometry(3, 3, 3),
  }), []);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graphData}
      nodeId="id"
      nodeLabel="label"
      
      // DAG Mode for Spatial Timeline
      dagMode={isTimelineMode ? 'zout' : undefined}
      dagLevelDistance={isTimelineMode ? 150 : undefined}
      
      nodeThreeObject={(node: any) => {
        const isHovered = node.id === hoveredNodeId;
        const mat = isHovered ? materials.hoverMat : (node.hasRisk ? materials.riskMat : null);

        if (node.type === 'COMPANY') {
          return new THREE.Mesh(geometries.company, mat || materials.companyMat);
        } else if (node.type === 'PERSON') {
          const group = new THREE.Group();
          const outer = new THREE.Mesh(geometries.personOuter, materials.personMat);
          outer.material.wireframe = true; // Створюємо внутрішню структуру
          const inner = new THREE.Mesh(geometries.personInner, mat || materials.personMat);
          group.add(outer);
          group.add(inner);
          return group;
        } else if (node.type === 'DOCUMENT') {
          return new THREE.Mesh(geometries.document, mat || materials.docMat);
        } else if (node.type === 'CONTAINER') {
          return new THREE.Mesh(geometries.container, mat || materials.containerMat);
        }
        
        // Default
        return new THREE.Mesh(new THREE.SphereGeometry(2), mat || materials.personMat);
      }}
      
      // Particle animations along links (Energy flows)
      linkDirectionalParticles={2}
      linkDirectionalParticleSpeed={(d: any) => d.weight * 0.005}
      linkDirectionalParticleWidth={1.5}
      linkDirectionalParticleColor={(d: any) => (d.hasRisk ? '#f56565' : '#4fd1c5')}
      linkColor={(d: any) => (d.hasRisk ? 'rgba(245, 101, 101, 0.4)' : 'rgba(79, 209, 197, 0.2)')}
      
      // Interactions
      onNodeClick={handleNodeClick}
      onNodeHover={handleNodeHover}
      
      // Physics tweaks for better stability
      d3AlphaDecay={0.05}
      d3VelocityDecay={0.3}
    />
  );
};

export default Graph3DEngine;
