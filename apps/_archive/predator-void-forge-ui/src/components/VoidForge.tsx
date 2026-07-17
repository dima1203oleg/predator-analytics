import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface VoidForgeProps {
  telemetry?: {
    cpuLoad: number; // 0 to 1
    gpuLoad: number; // 0 to 1
    latency: number; // ms
  };
}

export function VoidForge({ telemetry = { cpuLoad: 0.1, gpuLoad: 0.2, latency: 45 } }: VoidForgeProps) {
  const ringsRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ringsRef.current) {
      // Speed up rotation based on GPU/CPU load
      const rotationSpeed = 0.5 + (telemetry.gpuLoad + telemetry.cpuLoad) * 2.0;
      ringsRef.current.rotation.y += delta * rotationSpeed * 0.2;
      ringsRef.current.rotation.x += delta * rotationSpeed * 0.1;
      ringsRef.current.rotation.z -= delta * rotationSpeed * 0.15;
    }
  });

  return (
    <group ref={ringsRef}>
      {/* Outer telemetry ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[8, 0.05, 16, 100]} />
        <meshStandardMaterial 
          color="#00E5FF" 
          emissive="#00E5FF" 
          emissiveIntensity={1 + telemetry.gpuLoad * 2} 
          transparent 
          opacity={0.6}
          wireframe
        />
      </mesh>
      
      {/* Inner fast ring */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[6, 0.02, 16, 100]} />
        <meshStandardMaterial 
          color="#FFC107" 
          emissive="#FFC107" 
          emissiveIntensity={1 + telemetry.cpuLoad * 3} 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Middle dashed ring */}
      <mesh rotation={[-Math.PI / 4, 0, Math.PI / 6]}>
        <torusGeometry args={[7, 0.03, 16, 100]} />
        <meshStandardMaterial 
          color="#FFFFFF" 
          emissive="#FFFFFF" 
          emissiveIntensity={0.5} 
          wireframe
          transparent 
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
