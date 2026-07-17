import React, { useRef, useMemo, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import R3fForceGraph, { ForceGraphMethods } from 'r3f-forcegraph'
import * as THREE from 'three'
import { usePredatorStore, SynapticNode } from '../../store/usePredatorStore'

export const SynapticMesh: React.FC = () => {
  const fgRef = useRef<ForceGraphMethods>(null);
  const graphData = usePredatorStore((state) => state.graphData);
  const coreState = usePredatorStore((state) => state.coreState);
  const setHoveredNode = usePredatorStore((state) => state.setHoveredNode);

  // Deep clone once for r3f-forcegraph
  const localData = useMemo(() => {
    return JSON.parse(JSON.stringify(graphData));
  }, []);

  useFrame(() => {
    if (fgRef.current) fgRef.current.tickFrame();
  });

  // Physics setup
  useEffect(() => {
    if (fgRef.current) {
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        // @ts-ignore
        chargeForce.strength(-300); // Stronger repulsion
      }
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        // @ts-ignore
        linkForce.distance(30);
      }
      
      // Pull towards center to form a dense brain-like core
      const radialForce = fgRef.current.d3Force('radial');
      if (!radialForce) {
        import('d3-force-3d').then(d3 => {
          // @ts-ignore
          fgRef.current?.d3Force('radial', d3.forceRadial(15, 0, 0, 0).strength(0.8));
        });
      }
    }
  }, [localData]);

  const createTextSprite = (text: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = 'bold 36px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillText(text.toUpperCase(), 256, 80); // Uppercase for Palantir aesthetic
    }
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(7, 1.75, 1);
    sprite.position.set(0, 2.2, 0);
    return sprite;
  };

  const nodeThreeObject = useMemo(() => {
    return (node: any) => {
      const sNode = node as SynapticNode;
      const container = new THREE.Group();
      
      const radius = sNode.group === 'core' ? sNode.val * 0.05 : sNode.val * 0.03;
      
      // Geometric core - Emissive Data Center
      const coreGeo = new THREE.IcosahedronGeometry(radius * 0.5, 1);
      const coreMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(sNode.color),
        emissive: new THREE.Color(sNode.color),
        emissiveIntensity: 2.0,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.9
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      
      // Wireframe inner shell
      const wireGeo1 = new THREE.IcosahedronGeometry(radius * 0.8, 1);
      const wireMat1 = new THREE.MeshBasicMaterial({
        color: new THREE.Color(sNode.color),
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      const wireMesh1 = new THREE.Mesh(wireGeo1, wireMat1);

      // Wireframe outer shell (larger, more complex)
      const wireGeo2 = new THREE.IcosahedronGeometry(radius, 2);
      const wireMat2 = new THREE.MeshBasicMaterial({
        color: new THREE.Color(sNode.color),
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const wireMesh2 = new THREE.Mesh(wireGeo2, wireMat2);
      
      container.add(coreMesh);
      container.add(wireMesh1);
      container.add(wireMesh2);
      container.add(createTextSprite(sNode.label, sNode.color));

      return container;
    };
  }, [coreState]);

  const handleNodeHover = useCallback((node: any) => {
    if (node) {
      setHoveredNode(node as SynapticNode);
      document.body.style.cursor = 'crosshair';
    } else {
      setHoveredNode(null);
      document.body.style.cursor = 'default';
    }
  }, [setHoveredNode]);

  return (
    <group position={[0, 0.5, 0]}>
      <R3fForceGraph
        ref={fgRef}
        graphData={localData}
        nodeId="id"
        nodeThreeObject={nodeThreeObject}
        // @ts-expect-error - r3f-forcegraph types might be missing onNodeHover
        onNodeHover={handleNodeHover}
        linkWidth={(link: any) => link.value * 0.1}
        linkColor={(link: any) => {
          const sourceNode = localData.nodes.find((n: any) => n.id === (typeof link.source === 'object' ? link.source.id : link.source));
          return sourceNode ? `${sourceNode.color}15` : 'rgba(0, 240, 255, 0.05)'; // Very dim optical fibers
        }}
        linkCurvature={0.2}
        linkDirectionalParticles={(link: any) => Math.floor(link.value * 3)}
        linkDirectionalParticleSpeed={(link: any) => link.value * 0.008} // Faster data packets
        linkDirectionalParticleWidth={(link: any) => link.value * 0.6 + 0.8} // Thicker packets
        linkDirectionalParticleColor={(link: any) => {
           const sourceNode = localData.nodes.find((n: any) => n.id === (typeof link.source === 'object' ? link.source.id : link.source));
           return sourceNode ? sourceNode.color : '#00f0ff';
        }}
      />
    </group>
  );
}
