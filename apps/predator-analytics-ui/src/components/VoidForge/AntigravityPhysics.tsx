import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Physics, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { CognitiveDataNode, CognitiveNodeData } from './CognitiveDataNode';

interface AntigravityPhysicsProps {
  nodes: CognitiveNodeData[];
  mode: 'GRAVITY_CENTER' | 'ANTIGRAVITY';
}

function ForcesController({ mode }: { mode: 'GRAVITY_CENTER' | 'ANTIGRAVITY' }) {
  const { world } = useRapier();
  const { mouse, camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));

  useFrame(() => {
    // Determine cursor position in 3D space
    raycaster.current.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    raycaster.current.ray.intersectPlane(plane.current, target);

    // Apply forces to all rigid bodies
    world.bodies.forEach((body) => {
      const pos = body.translation();
      const bodyPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      
      const force = new THREE.Vector3();

      if (mode === 'GRAVITY_CENTER') {
        // Attract towards center (0,0,0) with inverse square law, but capped
        const dist = Math.max(bodyPos.length(), 2.0);
        const pull = -100.0 / (dist * dist);
        force.copy(bodyPos).normalize().multiplyScalar(pull);
      } else if (mode === 'ANTIGRAVITY') {
        // Repel from cursor
        const distToCursor = bodyPos.distanceTo(target);
        if (distToCursor < 10) {
          const push = 100.0 / Math.max(distToCursor * distToCursor, 1.0);
          force.copy(bodyPos).sub(target).normalize().multiplyScalar(push);
        }
        
        // Brown noise / wandering
        force.x += (Math.random() - 0.5) * 5;
        force.y += (Math.random() - 0.5) * 5;
        force.z += (Math.random() - 0.5) * 5;
        
        // Soft bounding box to keep them in view
        if (bodyPos.length() > 20) {
           const pull = -10.0;
           force.add(bodyPos.clone().normalize().multiplyScalar(pull));
        }
      }

      // Apply force based on body mass
      const mass = body.mass();
      force.multiplyScalar(mass * 0.1); // Tune the force multiplier
      body.applyImpulse(force, true);
    });
  });

  return null;
}

export function AntigravityPhysics({ nodes, mode }: AntigravityPhysicsProps) {
  return (
    <Physics gravity={[0, 0, 0]}>
      {nodes.map((node, i) => {
        // Distribute initially in a sphere
        const phi = Math.acos(-1 + (2 * i) / nodes.length);
        const theta = Math.sqrt(nodes.length * Math.PI) * phi;
        const radius = 10 + Math.random() * 5;
        
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);

        return (
          <CognitiveDataNode 
            key={node.id} 
            data={node} 
            position={[x, y, z]} 
          />
        );
      })}
      
      <ForcesController mode={mode} />
    </Physics>
  );
}
