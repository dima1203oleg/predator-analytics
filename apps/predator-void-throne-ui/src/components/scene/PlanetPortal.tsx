"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface PlanetPortalProps {
  position: [number, number, number];
  label: string;
  color: string;
}

export function PlanetPortal({ position, label, color }: PlanetPortalProps) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { scene } = useGLTF("/models/animated_sci-fi_globe_test.glb");
  const clone = scene.clone(); // Clone to reuse the same model

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += 0.01;
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
    }
  });

  return (
    <group
      position={position}
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => console.log(`Navigating to ${label}`)}
    >
      <group scale={hovered ? 0.015 : 0.01}>
        <primitive object={clone} />
      </group>
      
      <Html position={[0, 1.5, 0]} center className="pointer-events-none">
        <div className={`transition-all duration-300 ${hovered ? "opacity-100 scale-110" : "opacity-50 scale-100"}`}>
          <div className="bg-black/80 border border-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg whitespace-nowrap font-mono text-sm tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.5)]">
            <span style={{ color }}>●</span> {label}
          </div>
        </div>
      </Html>
    </group>
  );
}

useGLTF.preload("/models/animated_sci-fi_globe_test.glb");
