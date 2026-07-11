import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, Vignette, Noise } from '@react-three/postprocessing';
import { HUDv7 } from './HUD/HUDv7';
import { SynapticMesh } from './SynapticMesh';
import { CommandConsole } from './CommandConsole';
import { useCognitiveStore } from '../store/cognitiveStore';
import * as THREE from 'three';

function Skybox() {
  const { scene } = useGLTF('/models/deep_space_skybox.glb');
  return <primitive object={scene} scale={[100, 100, 100]} />;
}
useGLTF.preload('/models/deep_space_skybox.glb');

export function VoidForgeScene() {
  const { currentState } = useCognitiveStore();

  return (
    <div className="w-full h-screen bg-obsidian overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 15, 30], fov: 45 }}
        gl={{ powerPreference: "high-performance", antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['#050B14']} />
        
        {/* Deep Space Skybox */}
        <Suspense fallback={null}>
          <Skybox />
        </Suspense>

        {/* Cinematic Fog */}
        <fog attach="fog" args={['#050B14', 10, 80]} />

        <ambientLight intensity={0.5} />
        
        <Suspense fallback={null}>
          {/* The Core spaceport/table */}
          <CommandConsole />
          
          {/* The Knowledge Graph projecting from the Core */}
          <SynapticMesh />
          
          {/* Post processing is critical for the "living AI" feel */}
          <EffectComposer>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
            <DepthOfField focusDistance={0.05} focalLength={0.05} bokehScale={3} height={480} />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>

        <OrbitControls 
          enablePan={false}
          minDistance={10}
          maxDistance={60}
          autoRotate={currentState === 'Contemplation' || currentState === 'Discovery'}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2 + 0.1} // Prevent going too far below the "table"
        />
      </Canvas>
      
      <HUDv7 />
    </div>
  );
}
