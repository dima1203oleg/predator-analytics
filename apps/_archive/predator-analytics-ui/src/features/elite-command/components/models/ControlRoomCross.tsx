'use client';

import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function ControlRoomCross() {
  const { scene } = useGLTF('/models/scifi_control_room_hq.glb');
  
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
            // Збільшуємо металевість для реалістичного вигляду
            if (mat.metalness !== undefined) {
              mat.metalness = Math.max(mat.metalness, 0.6);
              mat.roughness = Math.min(mat.roughness, 0.4);
            }
            // Підсилюємо світіння для ефекту Bloom
            if (mat.name && mat.name.includes("glow")) {
              mat.emissiveIntensity = 3.0;
            }
            mat.envMapIntensity = 1.5;
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} position={[0, -0.5, 0]} scale={0.015} />;
}

useGLTF.preload('/models/scifi_control_room_hq.glb');
