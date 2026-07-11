"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CommandConsole() {
  const { scene: consoleScene } = useGLTF("/models/console.glb");
  const { scene: globeScene } = useGLTF("/models/earth_globe_hologram.glb");
  
  const globeRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Enhance globe emissive materials for holographic look
    globeScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.transparent = true;
          mat.opacity = 0.8;
          mat.emissive = new THREE.Color("#38BDF8");
          mat.emissiveIntensity = 2;
          mat.wireframe = true; // Makes it look more holographic
        }
      }
    });
  }, [globeScene]);

  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={[0, -1, 0]}>
      {/* Console Base */}
      <primitive object={consoleScene} scale={1.5} position={[0, 0, 0]} />
      
      {/* Holographic Globe hovering above console */}
      <group ref={globeRef} position={[0, 1.2, 0]} scale={0.5}>
        <primitive object={globeScene} />
        {/* Core glow light */}
        <pointLight color="#38BDF8" intensity={2} distance={3} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/console.glb");
useGLTF.preload("/models/earth_globe_hologram.glb");
