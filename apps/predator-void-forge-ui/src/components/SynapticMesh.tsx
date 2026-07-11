import React, { useMemo, useRef, useEffect } from 'react';
import ForceGraph3D from 'r3f-forcegraph';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useCognitiveStore } from '../store/cognitiveStore';

interface Node {
  id: string;
  type: string;
  val: number;
}

interface Link {
  source: string;
  target: string;
}

export function SynapticMesh() {
  const { currentState } = useCognitiveStore();
  const group = useRef<THREE.Group>(null);
  
  // Load Globe Model
  const { scene, animations } = useGLTF('/models/earth_globe_hologram_2mb_looping_animation.glb');
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    // Play any available animations
    if (actions) {
      Object.values(actions).forEach(action => action?.play());
    }
  }, [actions]);

  // Generate mock nodes based on the Knowledge Universe concept
  const { nodes, links } = useMemo(() => {
    const generatedNodes: Node[] = [];
    const generatedLinks: Link[] = [];
    
    const types = ['court_decision', 'invoice', 'entity', 'transaction'];
    const numNodes = 150;

    for (let i = 0; i < numNodes; i++) {
      generatedNodes.push({
        id: `node-${i}`,
        type: types[i % types.length],
        val: Math.random() * 5 + 1
      });
    }

    // Connect nodes of similar types
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        if (generatedNodes[i].type === generatedNodes[j].type && Math.random() > 0.8) {
          generatedLinks.push({
            source: generatedNodes[i].id,
            target: generatedNodes[j].id
          });
        }
        // Random cross-type links
        else if (Math.random() > 0.98) {
          generatedLinks.push({
            source: generatedNodes[i].id,
            target: generatedNodes[j].id
          });
        }
      }
    }

    return { nodes: generatedNodes, links: generatedLinks };
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'court_decision': return '#db3737';
      case 'invoice': return '#0f9960';
      case 'entity': return '#137cbd';
      case 'transaction': return '#FFC107';
      default: return '#00E5FF';
    }
  };

  const getLinkColor = () => {
    // Make links neon cyan to match the HUD
    return 'rgba(0, 229, 255, 0.4)';
  };

  return (
    <group ref={group} position={[0, 15, 0]}> {/* Position it above the Core table */}
      <primitive object={scene} scale={[8, 8, 8]} position={[0, 0, 0]} />
      <ForceGraph3D
        graphData={{ nodes, links }}
        nodeColor={(node: any) => getNodeColor(node.type)}
        nodeRelSize={4}
        linkColor={getLinkColor}
        linkWidth={0.5}
        linkOpacity={0.6}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.01}
        linkDirectionalParticleColor={() => '#FFC107'} // Gold particles travelling
      />
    </group>
  );
}
