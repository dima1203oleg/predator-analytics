'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Line } from '@react-three/drei';
import * as THREE from 'three';

export function PredatorAvatar() {
  const { scene } = useGLTF('/models/jungle_hunter_predator.glb');
  const groupRef = useRef<THREE.Group>(null);
  const laserRef = useRef<THREE.Group>(null);

  // Покращуємо матеріали хижака для реалістичності
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach(m => {
            const mat = m as THREE.MeshStandardMaterial;
            // Трохи більше металевості для обладунків
            if (mat.metalness !== undefined) {
              mat.metalness = Math.max(mat.metalness, 0.3);
              mat.roughness = Math.min(mat.roughness, 0.7);
            }
            mat.envMapIntensity = 1.2;
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [scene]);
  
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      // Idle анімація: плавне дихання
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.03;
    }

    if (laserRef.current) {
      // Лазери злегка пульсують
      laserRef.current.scale.x = 1 + Math.sin(t * 10) * 0.1;
      laserRef.current.scale.z = 1 + Math.sin(t * 10) * 0.1;
    }
  });

  return (
    // position: X=2 — збоку від стола, Y=0 — рівень підлоги, Z=1 — трохи спереду
    // rotation: повернутий до центру стола
    <group ref={groupRef} position={[1.5, 0, 1.5]} scale={0.5} rotation={[0, -Math.PI * 0.75, 0]}>
      <primitive object={scene} />
      {/* Червоне підсвічування від маски */}
      <pointLight color="#ff0000" intensity={1.5} distance={4} position={[0, 5, 0.5]} decay={2} />
      
      {/* Лазери з наплічної гармати (shoulder cannon) */}
      <group ref={laserRef} position={[0.4, 5.2, 0.2]} rotation={[0.2, 0, 0]}>
        {/* Центральний лазер */}
        <Line 
          points={[[0, 0, 0], [0, 0, 15]]} 
          color="#ff0000" 
          lineWidth={3} 
          transparent 
          opacity={0.8}
        />
        {/* Бокові лазери */}
        <Line 
          points={[[0.1, -0.1, 0], [0.1, -0.1, 15]]} 
          color="#ff0000" 
          lineWidth={2} 
          transparent 
          opacity={0.5}
        />
        <Line 
          points={[[-0.1, -0.1, 0], [-0.1, -0.1, 15]]} 
          color="#ff0000" 
          lineWidth={2} 
          transparent 
          opacity={0.5}
        />
      </group>
    </group>
  );
}

useGLTF.preload('/models/jungle_hunter_predator.glb');
