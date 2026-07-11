import React from 'react'
import { EffectComposer, Bloom, DepthOfField, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useCognitiveStore } from '../../store/cognitiveStore'

export const PostProcessingEffects: React.FC = () => {
  const isProcessing = useCognitiveStore((state) => state.isProcessing);
  const activeNeuron = useCognitiveStore((state) => state.activeNeuron);
  
  return (
    <EffectComposer multisampling={8}>
      <Bloom 
        luminanceThreshold={0.4} 
        luminanceSmoothing={0.9} 
        intensity={isProcessing || activeNeuron ? 3.0 : 1.2} 
        mipmapBlur 
      />
      <ChromaticAberration 
        blendFunction={BlendFunction.NORMAL} 
        offset={isProcessing ? new THREE.Vector2(0.005, 0.005) : new THREE.Vector2(0.001, 0.001)} 
        radialModulation={true}
        modulationOffset={0.5}
      />
      <Noise opacity={isProcessing ? 0.05 : 0.02} />
      <Vignette eskil={false} offset={0.1} darkness={1.1} />
    </EffectComposer>
  );
}
