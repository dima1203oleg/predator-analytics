// @ts-nocheck
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
  Scanline,
  Glitch,
} from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';
import { LivingCore } from './LivingCore';
import { DataParticles } from './DataParticles';
import { SynapticLinks } from './SynapticLinks';
import { CinematicCamera } from './CinematicCamera';
import { useUniverseStore } from '../../store/useUniverseStore';

/** Навколишнє середовище сцени (освітлення, fog) */
const SceneEnvironment: React.FC = () => (
  <>
    {/* Мінімальне фонове освітлення */}
    <ambientLight intensity={0.15} color="#2a2a4a" />

    {/* Основне направлене світло */}
    <directionalLight position={[5, 8, 5]} intensity={0.3} color="#4a6fff" />

    {/* Акцентне світло знизу (для атмосфери) */}
    <directionalLight position={[-3, -5, 2]} intensity={0.1} color="#ff3366" />

    {/* Далекий fog для глибини */}
    <fog attach="fog" args={['#050510', 25, 60]} />
  </>
);

/** Покращені пост-ефекти — кінематографічний стиль */
const PostEffects: React.FC = () => {
  const { aiMode } = useUniverseStore();
  const isActive = aiMode === 'inference' || aiMode === 'discovery';

  return (
    // disableNormalPass=false (за замовчуванням) — дозволяємо depth buffer для коректного рендерингу
    <EffectComposer multisampling={4}>
      {/* Широкий Bloom — неонове сяйво (рівень 1) */}
      <Bloom
        mipmapBlur
        intensity={1.2}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.5}
        kernelSize={4}
      />

      {/* Гострий Bloom — яскраві ядра (рівень 2) */}
      <Bloom
        mipmapBlur
        intensity={2.8}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.05}
        kernelSize={2}
      />

      {/* Хроматична аберація */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(isActive ? 0.004 : 0.0015, isActive ? 0.004 : 0.0015)}
        radialModulation={false}
        modulationOffset={0}
      />

      {/* Scanlines — рядки ЕЛТ */}
      <Scanline
        blendFunction={BlendFunction.OVERLAY}
        density={1.8}
        opacity={0.12}
      />

      {/* Шум — живий фотонний фон */}
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.06}
      />

      {/* Спорадичний глітч при активних режимах */}
      <Glitch
        delay={new THREE.Vector2(2.0, 5.0)}
        duration={new THREE.Vector2(0.06, 0.2)}
        strength={new THREE.Vector2(0.02, 0.15)}
        mode={GlitchMode.SPORADIC}
        active={isActive}
        ratio={0.9}
      />

      {/* Кінематографічна віньєтка */}
      <Vignette eskil={false} offset={0.2} darkness={1.1} />
    </EffectComposer>
  );
};

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
