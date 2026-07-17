"use client";

import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function PredatorAvatar() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/models/predator.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play idle animation
    if (actions && Object.keys(actions).length > 0) {
      let idleAction = null;
      for (const key of Object.keys(actions)) {
        if (key.toLowerCase().includes("idle")) {
          idleAction = actions[key];
          break;
        }
      }
      const actionToPlay = idleAction || actions[Object.keys(actions)[0]];
      actionToPlay?.play();
    }
    
    // Quality enhancement: Better materials and emissive glowing
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          // Boost material quality and contrast
          mat.roughness = 0.7;
          mat.metalness = 0.5;

          // Bio-mask / eyes glowing
          if (mesh.name.toLowerCase().includes('mask') || mesh.name.toLowerCase().includes('eye')) {
            mat.emissive = new THREE.Color("#E11D48"); // Deep threat red
            mat.emissiveIntensity = 4;
          }
        }
      }
    });
  }, [scene, actions]);

  useFrame((state) => {
    if (group.current) {
      // Very subtle, heavy breathing effect
      group.current.position.y = -1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.015;
    }
  });

  return (
    // Positioned behind the console (assuming console is at 0, -1, 0)
    <group ref={group} position={[0, -1, -2.5]} rotation={[0, 0, 0]} scale={0.9}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/predator.glb");
