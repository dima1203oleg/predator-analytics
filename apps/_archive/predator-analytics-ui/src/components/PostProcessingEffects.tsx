import React from 'react';
import { EffectComposer, Bloom, DepthOfField, Glitch, Noise, Vignette, SSAO } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import { useMoodStore } from '../stores/useMoodStore';
import { usePredatorStore } from '../stores/usePredatorStore';
import { useUIStore } from '../stores/useUIStore';
import { GPU_CONFIG } from '../core/gpuConfig';
import * as THREE from 'three';

/**
 * Оптимізований конвеєр пост-обробки для RTX 3050.
 * Об'єднує Bloom + DepthOfField в один ефективний прохід
 * через mipmapBlur та зменшений multisampling (2 замість 4).
 */
export const PostProcessingEffects: React.FC = () => {
  const weather = useMoodStore(state => state.weather);
  const systemLoad = usePredatorStore(state => state.systemLoad);
  const cameraMode = useUIStore(state => state.cameraMode);

  return (
    <EffectComposer multisampling={GPU_CONFIG.MULTISAMPLING}>
      <Bloom 
        intensity={weather === 'insight' ? 2.5 : 1.5} 
        luminanceThreshold={0.4} 
        luminanceSmoothing={0.9} 
        mipmapBlur 
      />
      <DepthOfField 
        focusDistance={cameraMode === 'investigation' ? 0.01 : 0.05} 
        focalLength={weather === 'insight' ? 0.05 : 0.1} 
        bokehScale={weather === 'insight' ? 4 : 2} 
        height={480} 
      />
      <Noise opacity={0.02} />
      
      {
        // @ts-ignore
        <SSAO 
          samples={GPU_CONFIG.SSAO_SAMPLES} 
          radius={0.1} 
          intensity={20} 
          luminanceInfluence={0.6} 
          color={new THREE.Color('black')} 
          worldDistanceThreshold={10}
          worldDistanceFalloff={10}
          worldProximityThreshold={10}
          worldProximityFalloff={10}
        />
      }
      
      <Vignette 
        eskil={false} 
        offset={cameraMode === 'investigation' ? 0.3 : 0.1} 
        darkness={cameraMode === 'investigation' ? 1.2 : 0.8} 
      />
      
      {(weather === 'conflict' || weather === 'overload' || systemLoad > 0.9) ? (
        <Glitch
          delay={new THREE.Vector2(1.5, 3.5)}
          duration={new THREE.Vector2(0.1, 0.3)}
          strength={new THREE.Vector2(0.1, 0.4)}
          mode={weather === 'overload' ? GlitchMode.CONSTANT_WILD : GlitchMode.SPORADIC}
          active
          ratio={0.85}
        />
      ) : <></>}
    </EffectComposer>
  );
};
