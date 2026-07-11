"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { Suspense } from "react";
import { HunterAvatar } from "./HunterAvatar";
import { VoidThroneRoom } from "./VoidThroneRoom";
import { PlanetPortal } from "./PlanetPortal";
import { ScoutShip } from "./ScoutShip";
import { CommandConsole } from "./CommandConsole";

export function MainScene() {
  return (
    <Canvas shadows>
      <PerspectiveCamera makeDefault position={[0, 1.5, 9.5]} fov={60} far={10000} />
      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2}
        minDistance={2}
        maxDistance={30}
      />
      
      {/* Cinematic Sci-fi Lighting */}
      <ambientLight intensity={0.12} />
      
      {/* Main key light - soft directional fill */}
      <directionalLight 
        position={[5, 12, 5]} 
        intensity={0.8} 
        color="#aaccff" 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />

      {/* Cyan Hologram Light from the central console */}
      <pointLight 
        position={[0, -3.3, 0]} 
        intensity={4.5} 
        color="#00ffff" 
        distance={12} 
        decay={1.8}
        castShadow
        shadow-bias={-0.001}
      />

      {/* Orange console glow from the side */}
      <pointLight 
        position={[2.0, -3.0, -0.5]} 
        intensity={3.0} 
        color="#ff4400" 
        distance={8} 
        decay={2.0}
      />

      {/* Indigo/magenta secondary glow */}
      <pointLight 
        position={[-2.0, -3.0, 0.5]} 
        intensity={2.0} 
        color="#9900ff" 
        distance={8} 
        decay={2.0}
      />
      
      {/* Environment */}
      <Suspense fallback={null}>
        <VoidThroneRoom />
        <CommandConsole />
        <HunterAvatar />
        
        {/* Navigation Portals */}
        <PlanetPortal position={[-4, 1, -2]} label="Ingestion Core" color="#ff0000" />
        <PlanetPortal position={[4, 1.5, -1]} label="Risk Engine" color="#ff5500" />
        <PlanetPortal position={[0, 2, -5]} label="Deep Search" color="#00ffcc" />
        <PlanetPortal position={[-3, 0.5, 3]} label="Graph Analysis" color="#cc00ff" />

        {/* Scout Ships (AI Agents) */}
        <ScoutShip radius={6} speed={0.2} offset={0} yOffset={2} />
        <ScoutShip radius={7} speed={0.3} offset={Math.PI} yOffset={1} />
        <ScoutShip radius={5} speed={0.4} offset={Math.PI / 2} yOffset={3} />
      </Suspense>

      {/* Postprocessing for cinematic look */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1.0} mipmapBlur intensity={0.4} />
        <Vignette eskil={false} offset={0.15} darkness={1.2} />
      </EffectComposer>
    </Canvas>
  );
}
