import React, { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Physics } from '@react-three/rapier';
import { OrbitControls } from '@react-three/drei';
import { EnergyCore } from '../spatial/core/EnergyCore';

interface EngineProps {
  children: ReactNode;
}

export const Engine: React.FC<EngineProps> = ({ children }) => {
  return (
    <Canvas
      camera={{ position: [0, 3, 12], fov: 45 }}
      dpr={[1, 2]}
      gl={{ 
        antialias: true, 
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
      style={{ width: '100vw', height: '100vh', background: '#050507' }} // Deep Navy / Obsidian
    >
      <Physics gravity={[0, 0, 0]}>
        {children}
      </Physics>
      <EnergyCore threatLevel={65} position={[0, 0, 0]} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
    </Canvas>
  );
};
