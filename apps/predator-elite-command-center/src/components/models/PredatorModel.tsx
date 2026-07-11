'use client';

import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group, MathUtils, MeshStandardMaterial, Mesh, Color } from 'three';
import { useFrame } from '@react-three/fiber';

export type EmotionState = 'NEUTRAL' | 'ANALYTIC' | 'WARNING' | 'POSITIVE' | 'AGGRESSIVE';

interface PredatorModelProps {
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

export function PredatorModel({ emotion = 'NEUTRAL', ...props }: PredatorModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/predator.glb');
  const { actions } = useAnimations(animations, group);

  const glowMaterialsRef = useRef<MeshStandardMaterial[]>([]);

  // Collect emissive materials for emotion coloring
  useEffect(() => {
    const materials: MeshStandardMaterial[] = [];
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        if (mesh.material instanceof MeshStandardMaterial && mesh.material.emissive) {
          materials.push(mesh.material);
        }
      }
    });
    glowMaterialsRef.current = materials;
  }, [scene]);

  // Play animation
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.keys(actions)[0];
      actions[firstAction]?.play();
    }
  }, [actions]);

  useFrame((state, delta) => {
    // Make the predator slowly follow the mouse with its rotation
    if (group.current) {
      const targetRotationY = state.mouse.x * 0.5;
      group.current.rotation.y = MathUtils.lerp(group.current.rotation.y, targetRotationY, delta * 2);
    }

    // Pulse emission color based on emotion
    const targetColor = new Color(EMOTION_COLORS[emotion]);
    glowMaterialsRef.current.forEach(mat => {
      mat.emissive.lerp(targetColor, delta * 3);
    });
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
      <pointLight 
        position={[0, 1.5, 0.5]} 
        color={EMOTION_COLORS[emotion]} 
        intensity={0.5} 
        distance={2} 
        decay={2} 
      />
    </group>
  );
}

useGLTF.preload('/models/predator.glb');
