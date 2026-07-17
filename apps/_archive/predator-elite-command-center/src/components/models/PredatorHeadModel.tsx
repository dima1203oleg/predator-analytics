'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group, Mesh, MeshStandardMaterial, Color, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';

export type EmotionState = 'NEUTRAL' | 'ANALYTIC' | 'WARNING' | 'POSITIVE' | 'AGGRESSIVE';

interface PredatorHeadModelProps {
  emotion?: EmotionState;
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  speakActive?: boolean;
}

const EMOTION_COLORS: Record<EmotionState, string> = {
  NEUTRAL: '#00f3ff',
  ANALYTIC: '#0044ff',
  WARNING: '#ffaa00',
  POSITIVE: '#00ff66',
  AGGRESSIVE: '#ff003c',
};

export function PredatorHeadModel({ 
  emotion = 'NEUTRAL', 
  speakActive = false,
  ...props 
}: PredatorHeadModelProps) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF('/models/predators_head.glb');
  
  const glowMaterialsRef = useRef<MeshStandardMaterial[]>([]);

  useEffect(() => {
    const materials: MeshStandardMaterial[] = [];
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const mat = mesh.material as MeshStandardMaterial;
        if (mat && mat.emissive) {
          materials.push(mat);
        }
      }
    });
    glowMaterialsRef.current = materials;
  }, [scene]);

  useFrame((state, delta) => {
    const targetColor = new Color(EMOTION_COLORS[emotion]);
    
    glowMaterialsRef.current.forEach((mat) => {
      if (mat.emissive) {
        mat.emissive.lerp(targetColor, delta * 2);
        mat.emissiveIntensity = MathUtils.lerp(mat.emissiveIntensity || 0, speakActive ? 1.5 : 0.5, delta * 4);
      }
    });

    if (group.current) {
      const targetY = state.mouse.x * 0.4;
      const targetX = -state.mouse.y * 0.3;
      
      group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, targetY, delta * 3);
      group.current.rotation.x = MathUtils.lerp(group.current.rotation.x, targetX, delta * 3);

      if (speakActive) {
        const breathing = Math.sin(state.clock.getElapsedTime() * 12) * 0.015;
        group.current.position.y = (props.position?.[1] || 0) + breathing;
      } else {
        group.current.position.y = MathUtils.lerp(group.current.position.y, props.position?.[1] || 0, delta * 2);
      }
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
      <pointLight 
        position={[0, 0.2, 0.5]} 
        color={EMOTION_COLORS[emotion]} 
        intensity={speakActive ? 1.5 : 0.5} 
        distance={2} 
        decay={2}
      />
    </group>
  );
}

useGLTF.preload('/models/predators_head.glb');
