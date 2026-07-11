'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import * as THREE from 'three';

interface TeleportNodeProps {
  id: string;
  label: string;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  scale?: number;
  modelPath: string;
  onClick: (id: string) => void;
}

export function TeleportNode({
  id,
  label,
  position,
  rotation,
  color,
  scale = 0.5,
  modelPath,
  onClick
}: TeleportNodeProps) {
  const { scene: portalScene } = useGLTF(modelPath);
  
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      // Кільце повільно обертається для привернення уваги
      ringRef.current.rotation.z += delta * 1.5;
    }
    if (glowRef.current) {
      // Пульсація свічення
      const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Портал */}
      <primitive object={portalScene.clone()} />

      {/* Пульсуючий диск-індикатор на підлозі */}
      <mesh
        ref={glowRef}
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[3, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Клікабельне кільце */}
      <mesh
        ref={ringRef}
        position={[0, 0.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(id);
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <ringGeometry args={[2, 2.5, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Вертикальний промінь світла */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.05, 0.3, 10, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Світло порталу */}
      <pointLight position={[0, 2, 0]} color={color} intensity={2} distance={10} />

      {/* Назва модуля */}
      <Text
        position={[0, 5.5, 0]}
        fontSize={0.5}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.03}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
}

useGLTF.preload('/models/portal_gateway.glb');
useGLTF.preload('/models/portal_gate.glb');
useGLTF.preload('/models/portal_gate_3.glb');
