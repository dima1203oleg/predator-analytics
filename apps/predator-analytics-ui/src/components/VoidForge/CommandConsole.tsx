import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function CommandConsole() {
  // Using the requested sci-fi console model
  const { scene } = useGLTF('/models/futuristic_sci-fi_command_console.glb');
  
  return (
    <group position={[0, -5, 0]} scale={[2, 2, 2]}>
      <primitive object={scene} />
      {/* Central glow emerging from the console up to the graph */}
      <pointLight position={[0, 5, 0]} color="#00E5FF" intensity={5} distance={20} />
      <spotLight position={[0, 0, 0]} angle={0.5} penumbra={1} color="#FFC107" intensity={10} target-position={[0, 15, 0]} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/futuristic_sci-fi_command_console.glb');
