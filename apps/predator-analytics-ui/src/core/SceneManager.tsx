import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { AdaptiveQuality } from './AdaptiveQuality';
import { ParticleSystem } from '../fx/ParticleSystem';
import { useSceneStore } from '../stores/sceneStore';

// Assuming these exist from earlier phases
import CommandCenterScene from '../spatial/scene/CommandCenterScene';

export const SceneManager: React.FC = () => {
  const { isIdle } = useSceneStore();

  return (
    <div className="fixed inset-0 bg-black z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ powerPreference: 'high-performance', antialias: false, alpha: false }}
        dpr={[1, 1.5]} // Limit DPR to 1.5 for performance
      >
        <color attach="background" args={['#000000']} />
        
        <AdaptiveQuality />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <Suspense fallback={null}>
          {!isIdle && <CommandCenterScene />}
          <ParticleSystem />
        </Suspense>

        {!isIdle && (
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.2} 
              luminanceSmoothing={0.9} 
              intensity={1.5} 
            />
            {/* @ts-ignore */}
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new THREE.Vector2(0.002, 0.002)}
            />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};
