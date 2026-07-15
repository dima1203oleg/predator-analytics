/**
 * UniverseScene — Головна 3D-сцена живого AI Всесвіту PREDATOR
 * 
 * Об'єднує всі 3D-компоненти:
 * - LivingCore (центральне AI ядро)
 * - DataParticles (живі частинки-сутності)
 * - SynapticLinks (динамічні зв'язки)
 * - CinematicCamera (автономна камера)
 * - Post-processing (Bloom, Vignette)
 * 
 * Оптимізація:
 * - dpr: [1, 2] (адаптивний DPR)
 * - antialias: false (для продуктивності)
 * - frameloop: "always" (постійна анімація)
 */
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { LivingCore } from './LivingCore';
import { DataParticles } from './DataParticles';
import { SynapticLinks } from './SynapticLinks';
import { CinematicCamera } from './CinematicCamera';

/** Навколишнє середовище сцени (освітлення, fog) */
const SceneEnvironment: React.FC = () => (
  <>
    {/* Мінімальне фонове освітлення */}
    <ambientLight intensity={0.15} color="#2a2a4a" />
    
    {/* Основне направлене світло */}
    <directionalLight
      position={[5, 8, 5]}
      intensity={0.3}
      color="#4a6fff"
    />
    
    {/* Акцентне світло знизу (для атмосфери) */}
    <directionalLight
      position={[-3, -5, 2]}
      intensity={0.1}
      color="#ff3366"
    />
    
    {/* Далекий fog для глибини */}
    <fog attach="fog" args={['#050510', 25, 60]} />
  </>
);

/** Пост-ефекти для кінематографічності */
const PostEffects: React.FC = () => (
  <EffectComposer>
    {/* Bloom для свічення ядра та частинок */}
    <Bloom
      intensity={0.8}
      luminanceThreshold={0.2}
      luminanceSmoothing={0.9}
      mipmapBlur
    />
    {/* Vignette для фокусу на центрі */}
    <Vignette
      eskil={false}
      offset={0.3}
      darkness={0.7}
    />
  </EffectComposer>
);

export const UniverseScene: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 2, 12], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          alpha: false,
        }}
        dpr={[1, 1.5]}
        style={{ background: '#050510' }}
        frameloop="always"
      >
        <SceneEnvironment />
        <CinematicCamera />

        <Suspense fallback={null}>
          <LivingCore />
          <DataParticles />
          <SynapticLinks />
        </Suspense>

        <PostEffects />
      </Canvas>
    </div>
  );
};
