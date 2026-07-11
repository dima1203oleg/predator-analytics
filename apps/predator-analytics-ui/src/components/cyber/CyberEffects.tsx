// @ts-nocheck
import React from 'react';
import { EffectComposer, Bloom, Glitch, Scanline, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';
import { useCyberStore } from '../../store/useCyberStore';
import * as THREE from 'three';

export const CyberEffects = () => {
  const { aiState } = useCyberStore();

  const isThinking = aiState === 'THINKING';

  return (
    <EffectComposer>
      {/* М'яке кібер-світіння */}
      <Bloom 
        luminanceThreshold={0.8} 
        luminanceSmoothing={0.1} 
        intensity={0.8} 
        kernelSize={3}
      />
      
      {/* Легка хроматична аберація для ефекту "камери/голограми" */}
      <ChromaticAberration 
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.002, 0.002)}
        radialModulation={false}
        modulationOffset={0}
      />
      
      {/* Scanlines (смуги оновлення як на ЕЛТ-моніторі) */}
      <Scanline 
        blendFunction={BlendFunction.OVERLAY} 
        density={2} 
        opacity={0.3}
      />
      
      {/* Шум матриці */}
      <Noise 
        premultiply 
        blendFunction={BlendFunction.ADD} 
        opacity={0.15} 
      />

      {/* Глітч, коли ШІ "думає" або завантажує дані */}
      <Glitch
        delay={new THREE.Vector2(0.5, 1.5)} // min/max delay
        duration={new THREE.Vector2(0.1, 0.3)} // min/max duration
        strength={new THREE.Vector2(0.1, 0.3)} // min/max strength
        mode={GlitchMode.SPORADIC} // sporadic or constant
        active={isThinking}
        ratio={0.85}
      />
    </EffectComposer>
  );
};
