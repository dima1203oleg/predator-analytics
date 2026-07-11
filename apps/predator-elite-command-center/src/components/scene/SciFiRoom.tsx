"use client";

import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

export function SciFiRoom() {
  const { scene } = useGLTF("/models/scifi_room.glb");
  
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Enhance any emissive materials slightly
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive && mat.emissiveIntensity > 0) {
          mat.emissiveIntensity *= 2;
        }
      }
    });
  }, [scene]);

  return (
    <group position={[0, -1.5, 0]} scale={2}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/scifi_room.glb");
