// @ts-nocheck
import React from 'react';
import { EffectComposer, Bloom, Glitch, Scanline, ChromaticAberration, Noise, SMAA, Vignette } from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';
import { useCyberStore } from '../../store/useCyberStore';
import * as THREE from 'three';

// ПРИМІТКА: DepthOfField видалено — несумісне з disableNormalPass.
// Кінематографічний ефект досягається через подвійний Bloom + Vignette.
export const CyberEffects = () => {
  const { aiState } = useCyberStore();

  const isThinking = aiState === 'THINKING';
  const isHighRisk = aiState === 'ANALYZING';

  return (
    <EffectComposer disableNormalPass>
      <SMAA />

      {/* Широкий Bloom — м'яке неонове сяйво (рівень 1) */}
      <Bloom
        mipmapBlur
        luminanceThreshold={0.45}
        luminanceSmoothing={0.3}
        intensity={1.4}
        kernelSize={4}
      />

      {/* Гострий Bloom — яскраві ядра вузлів (рівень 2) */}
      <Bloom
        mipmapBlur
        luminanceThreshold={0.85}
        luminanceSmoothing={0.05}
        intensity={2.5}
        kernelSize={2}
      />

      {/* Хроматична аберація — реагує на стан ШІ */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(
          isThinking ? 0.005 : 0.002,
          isThinking ? 0.005 : 0.002
        )}
        radialModulation={false}
        modulationOffset={0}
      />

      {/* Scanlines — рядки оновлення ЕЛТ */}
      <Scanline
        blendFunction={BlendFunction.OVERLAY}
        density={2.2}
        opacity={isThinking ? 0.45 : 0.18}
      />

      {/* Шум матриці — "живий" фотонний шум */}
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.08}
      />

      {/* Глітч — активується при аналізі або підвищеному ризику */}
      <Glitch
        delay={new THREE.Vector2(1.5, 3.5)}
        duration={new THREE.Vector2(0.08, 0.25)}
        strength={new THREE.Vector2(0.05, 0.25)}
        mode={GlitchMode.SPORADIC}
        active={isThinking || isHighRisk}
        ratio={0.85}
      />

      {/* Кінематографічна віньєтка */}
      <Vignette eskil={false} offset={0.15} darkness={1.2} />
    </EffectComposer>
  );
};
