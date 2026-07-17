import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { QuantumMindGraph } from './QuantumMindGraph';
import { CyberAvatar } from './CyberAvatar';
import { CyberEffects } from './CyberEffects';

export const Global3DBackground = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-auto opacity-100">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ 
          antialias: false, 
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <spotLight position={[-5, 5, -5]} intensity={2} color="#0ea5e9" penumbra={1} />
        
        <Suspense fallback={null}>
          <QuantumMindGraph />
          <CyberAvatar />
          <CyberEffects />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Global3DBackground;
