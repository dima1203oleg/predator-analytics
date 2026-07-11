'use client';

import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group, Mesh, MeshStandardMaterial, Color } from 'three';
import { useFrame } from '@react-three/fiber';

export type EmotionState = 'NEUTRAL' | 'ANALYTIC' | 'WARNING' | 'POSITIVE' | 'AGGRESSIVE';

interface HologramGlobeProps {
  emotion?: EmotionState;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
}

const EMOTION_COLORS: Record<EmotionState, string> = {
  NEUTRAL: '#00f3ff',
  ANALYTIC: '#0044ff',
  WARNING: '#ffaa00',
  POSITIVE: '#00ff66',
  AGGRESSIVE: '#ff003c',
};

export function HologramGlobe({ emotion = 'NEUTRAL', ...props }: HologramGlobeProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/new_globe.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstActionKey = Object.keys(actions)[0];
      const action = actions[firstActionKey];
      if (action) {
        action.play();
      }
    }
  }, [actions]);

  useEffect(() => {
    const targetColor = new Color(EMOTION_COLORS[emotion]);
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (mesh.material instanceof MeshStandardMaterial) {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.8;
          mesh.material.emissive = targetColor;
          mesh.material.emissiveIntensity = 1.0;
        }
      }
    });
  }, [scene, emotion]);

  useFrame((state, delta) => {
    if (group.current) {
      // Add slight floating effect
      group.current.position.y = (props.position?.[1] || 0) + Math.sin(state.clock.elapsedTime) * 0.05;
      // Add slow rotation if it doesn't rotate automatically
      group.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
      <pointLight 
        position={[0, 0, 0]} 
        color={EMOTION_COLORS[emotion]} 
        intensity={2.0} 
        distance={3} 
        decay={2} 
      />
    </group>
  );
}

useGLTF.preload('/models/new_globe.glb');
