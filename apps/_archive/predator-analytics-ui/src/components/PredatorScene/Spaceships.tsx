import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function Spaceships() {
  const { scene } = useGLTF('/models/flying_ships.glb');
  const groupRef = useRef<THREE.Group>(null!);

  const clonedScene = React.useMemo(() => {
    const clone = scene.clone(true);
    // Add some emissive glow to engines if any
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.name.toLowerCase().includes('engine') || mesh.name.toLowerCase().includes('thruster')) {
          if (mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissive = new THREE.Color(0x00e5ff);
            mat.emissiveIntensity = 4.0;
          }
        }
      }
    });
    return clone;
  }, [scene]);

  // Animate the ships flying in a circle around the command center
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.2; // slow orbit
    groupRef.current.position.y = Math.sin(t * 0.5) * 1.5 + 2; // subtle bobbing
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={[0.1, 0.1, 0.1]} position={[15, 0, 0]} />
      <primitive object={clonedScene.clone()} scale={[0.1, 0.1, 0.1]} position={[-15, 2, 5]} rotation={[0, Math.PI, 0]} />
      <primitive object={clonedScene.clone()} scale={[0.1, 0.1, 0.1]} position={[0, -2, -15]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

useGLTF.preload('/models/flying_ships.glb');
