import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function ControlRoom() {
  const { scene } = useGLTF('/models/scifi_control_room_draco.glb');

  // Clone the scene and apply gorgeous materials and emissive lights
  const customizedRoom = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              const name = mat.name.toLowerCase();
              
              // Boost emissive for existing glow materials to create cinematic bloom
              if (name.includes("blue_glow")) {
                mat.color.set("#00f0ff");
                mat.emissive.set("#00aaff");
                mat.emissiveIntensity = 10.0;
              } else if (name.includes("orange_glow")) {
                mat.color.set("#ff4400");
                mat.emissive.set("#ff2200");
                mat.emissiveIntensity = 12.0;
              } else if (name.includes("green_glow")) {
                mat.color.set("#00ff66");
                mat.emissive.set("#00bb44");
                mat.emissiveIntensity = 10.0;
              } else if (name.includes("white_glow")) {
                mat.color.set("#ffffff");
                mat.emissive.set("#aaccff");
                mat.emissiveIntensity = 6.0;
              } else if (name.includes("tube")) {
                mat.color.set("#0077ff");
                mat.emissive.set("#0044cc");
                mat.emissiveIntensity = 8.0;
              } else if (name.includes("metal")) {
                // Cyberpunk / Sci-fi dark metallic steel with blue-purple shades
                mat.color.set("#0e111a");
                mat.roughness = 0.25;
                mat.metalness = 0.95;
              } else if (name.includes("material.001")) {
                // Carbon fiber / obsidian panels
                mat.color.set("#06070a");
                mat.roughness = 0.15;
                mat.metalness = 0.9;
              } else if (name.includes("railing")) {
                mat.color.set("#1f212d");
                mat.roughness = 0.2;
                mat.metalness = 0.95;
              } else {
                // General glow boost
                if (mat.emissive && (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0)) {
                  mat.emissiveIntensity = Math.max(mat.emissiveIntensity * 3.0, 5.0);
                }
              }
            }
          });
        }
      }
    });
    return clone;
  }, [scene]);

  // Scale S=0.055, center X=0.31, floor Y=0.37 (align floor at y=0), center Z=-0.1
  return (
    <group position={[0.31, 0.37, -0.1]} scale={0.055} rotation={[0, Math.PI, 0]}>
      <primitive object={customizedRoom} />
    </group>
  );
}

useGLTF.preload('/models/scifi_control_room_draco.glb');
