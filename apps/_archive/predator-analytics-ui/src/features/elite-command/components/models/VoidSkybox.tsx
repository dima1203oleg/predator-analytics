'use client';

import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Космічний пейзаж deep_space_skybox.glb — сфера-skybox навколо сцени
export function VoidSkybox() {
  const { scene } = useGLTF('/models/deep_space_landscape.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          // Зробити самосвітним щоб видно без освітлення сцени
          if (mat.map) {
            mat.emissiveMap = mat.map;
            mat.emissive = new THREE.Color('#ffffff');
            mat.emissiveIntensity = 2.0;
          }
          // Skybox не має отримувати тіні чи освітлення
          mat.depthWrite = false;
          mat.toneMapped = false;
          mat.side = THREE.FrontSide;
          mat.needsUpdate = true;
        });
      }
    });
  }, [scene]);

  // Від'ємний масштаб по X "виверне" сферу — текстура буде видна зсередини
  return (
    <primitive
      object={scene}
      position={[0, -5, 0]}
      scale={[-150, 150, 150]}
      renderOrder={-1}
    />
  );
}

useGLTF.preload('/models/deep_space_landscape.glb');
