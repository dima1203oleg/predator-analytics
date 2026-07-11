'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group, Mesh, MeshStandardMaterial, Color } from 'three';
import { useFrame } from '@react-three/fiber';

export function PredatorHeadModel({ emotion = 'NEUTRAL', speakActive = false, ...props }: any) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF('/models/predators_head.glb');

  // Легка анімація голови (наприклад, слідкування за мишкою або дихання)
  useFrame((state, delta) => {
    if (group.current) {
      const targetY = state.mouse.x * 0.15;
      const targetX = -state.mouse.y * 0.15;
      group.current.rotation.y += (targetY - group.current.rotation.y) * delta * 2;
      group.current.rotation.x += (targetX - group.current.rotation.x) * delta * 2;
      
      if (speakActive) {
         group.current.position.y = Math.sin(state.clock.getElapsedTime() * 10) * 0.05;
      } else {
         group.current.position.y = 0;
      }
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/predators_head.glb');
