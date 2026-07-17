"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export function ScoutShip({ radius = 8, speed = 0.5, offset = 0, yOffset = 0 }) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/light_fighter_spaceship_-_free_-.glb");
  const clone = scene.clone();

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime * speed + offset;
      
      // Calculate circular orbit
      const x = Math.cos(t) * radius;
      const z = Math.sin(t) * radius;
      const y = Math.sin(t * 2) * 0.5 + yOffset;

      group.current.position.set(x, y, z);
      
      // Face the direction of travel
      const nextX = Math.cos(t + 0.1) * radius;
      const nextZ = Math.sin(t + 0.1) * radius;
      const nextY = Math.sin((t + 0.1) * 2) * 0.5 + yOffset;
      
      group.current.lookAt(nextX, nextY, nextZ);
    }
  });

  return (
    <group ref={group} scale={0.05}>
      <primitive object={clone} />
      <pointLight color="#ff0000" intensity={2} distance={3} />
    </group>
  );
}

useGLTF.preload("/models/light_fighter_spaceship_-_free_-.glb");
