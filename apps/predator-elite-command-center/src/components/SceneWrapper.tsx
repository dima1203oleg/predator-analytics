"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera, Stars } from "@react-three/drei";
import { Suspense } from "react";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, ToneMapping } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

import { PredatorAvatar } from "./scene/PredatorAvatar";
import { SciFiRoom } from "./scene/SciFiRoom";
import { CommandConsole } from "./scene/CommandConsole";
import { FlyingShips } from "./scene/FlyingShips";

export function SceneWrapper() {
  return (
    <Canvas 
      shadows 
      gl={{ 
        antialias: true, 
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: true
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 1.5, 5]} fov={45} />
      
      <OrbitControls 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2 + 0.05}
        minDistance={2}
        maxDistance={8}
        target={[0, 0.5, 0]}
        enableDamping
        dampingFactor={0.05}
      />

      <color attach="background" args={['#010204']} />
      <fog attach="fog" args={['#010204', 4, 15]} />
      
      {/* High Quality Stars */}
      <Stars radius={50} depth={50} count={7000} factor={3} saturation={0} fade speed={0.5} />

      {/* Cinematic Lighting Setup */}
      <ambientLight intensity={0.05} color="#38BDF8" />
      
      {/* Main Key Light (Console glow reflection) */}
      <pointLight position={[0, 1.5, 0]} intensity={1.5} color="#38BDF8" distance={5} decay={2} />
      
      {/* Rim Light (Red threat glow from behind/above) */}
      <spotLight 
        position={[0, 5, -5]} 
        intensity={2} 
        color="#E11D48" 
        angle={Math.PI / 4} 
        penumbra={0.5} 
        castShadow 
      />

      <Suspense fallback={null}>
        <Environment preset="night" />
        
        {/* Main Objects */}
        <SciFiRoom />
        <CommandConsole />
        <PredatorAvatar />
        <FlyingShips />
      </Suspense>

      {/* High Quality Post Processing */}
      <EffectComposer disableNormalPass multisampling={4}>
        <Bloom 
          luminanceThreshold={0.4} 
          luminanceSmoothing={0.9} 
          mipmapBlur 
          intensity={1.2} 
        />
        <Vignette eskil={false} offset={0.15} darkness={1.2} blendFunction={BlendFunction.MULTIPLY} />
        <Noise opacity={0.015} blendFunction={BlendFunction.OVERLAY} />
        <ChromaticAberration 
          blendFunction={BlendFunction.NORMAL} 
          offset={[0.0005, 0.0005] as any}
        />
        <ToneMapping adaptive={true} resolution={256} middleGrey={0.5} maxLuminance={16.0} averageLuminance={1.0} adaptationRate={1.0} />
      </EffectComposer>
    </Canvas>
  );
}
