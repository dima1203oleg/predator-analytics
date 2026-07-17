import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

import { HUDv7 } from './HUD/HUDv7'
import { QuantumBrain } from './QuantumBrain'
import { SynapticMesh } from './SynapticMesh'
import { PostProcessingEffects } from './PostProcessingEffects'
import { GPU_CONFIG } from '../../core/gpuConfig'
import { useCognitiveStore } from '../../store/cognitiveStore'
import { useUIStore } from '../../stores/useUIStore'
import { OSINTGraph } from './KnowledgeUniverse/OSINTGraph'
import { FloatingMetrics } from './FloatingMetrics'

const CinematicCamera = () => {
  const isProcessing = useCognitiveStore(s => s.isProcessing);
  const targetPos = new THREE.Vector3();
  
  useFrame((state) => {
    if (isProcessing) {
      // Cinematic orbit and zoom in when thinking
      const time = state.clock.elapsedTime;
      targetPos.set(Math.sin(time * 0.5) * 5, 2, Math.cos(time * 0.5) * 5);
      state.camera.position.lerp(targetPos, 0.02);
      state.camera.lookAt(0, 0, 0);
    }
  });

  return null;
};

export const VoidForgeScene: React.FC = () => {
  const showKnowledgeGraph = useUIStore(s => s.showKnowledgeGraph);

  return (
    <div className="w-screen h-screen bg-[#05050a] overflow-hidden relative select-none">
      {/* 3D Canvas — base layer */}
      <Canvas
        camera={{ position: [0, 2, 9], fov: 45 }}
        dpr={GPU_CONFIG.DPR_RANGE}
        performance={{ min: GPU_CONFIG.PERFORMANCE_MIN }}
        gl={{ powerPreference: GPU_CONFIG.POWER_PREFERENCE, antialias: true, alpha: true }}
        className="absolute inset-0"
      >
        <color attach="background" args={['#050508']} />
        
        {/* Ambient lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#00f0ff" />
        <directionalLight position={[-10, 5, -5]} intensity={1.0} color="#b06aff" />
        <pointLight position={[0, -5, 0]} intensity={2.0} color="#00f0ff" distance={20} />
        <pointLight position={[-12, -12, -12]} intensity={1.0} color="#ffb700" />

        <SynapticMesh />
        <QuantumBrain />
        <FloatingMetrics />
        <CinematicCamera />

        <OrbitControls enableZoom={true} maxDistance={14} minDistance={4.5} makeDefault />
        <PostProcessingEffects />
      </Canvas>

      {/* HUD overlay — on top of 3D, separate DOM layer */}
      <HUDv7 />

      {/* OSINT Graph overlay */}
      {showKnowledgeGraph && <OSINTGraph />}
    </div>
  );
};
