import React, { useRef } from 'react';
import { useGLTF, Float, SpotLight } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const FuturisticModels: React.FC = () => {
  const { scene: globeScene } = useGLTF('/models/globe2.glb');
  const { scene: consoleScene } = useGLTF('/models/console.glb');
  const { scene: skyboxScene } = useGLTF('/models/skybox.glb');
  const { scene: portalScene } = useGLTF('/models/portal.glb');
  
  const globeRef = useRef<THREE.Group>(null);
  const portalRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001; // slower rotation
    }
    if (portalRef.current) {
      portalRef.current.rotation.z += 0.0005; // very slow, majestic rotation
    }
  });

  return (
    <group>
      {/* Precision Grid for analytical scale */}
      <gridHelper args={[200, 200, '#00e5ff', '#00e5ff']} position={[0, -5, 0]} material-opacity={0.15} material-transparent />

      {/* Deep Space Skybox - Enclosing the whole scene */}
      <group position={[0, 0, 0]} scale={[100, 100, 100]}>
        <primitive object={skyboxScene} />
      </group>

      {/* Sci-Fi Portal Gateway - Dramatic backdrop */}
      <group ref={portalRef} position={[0, 0, -25]} scale={[5, 5, 5]} rotation={[0, 0, 0]}>
        <primitive object={portalScene} />
        <pointLight position={[0, 0, 2]} color="#b06aff" intensity={2} distance={30} />
      </group>

      {/* Sci-Fi Console - Placed below the graph */}
      <group position={[0, -4, 2]} scale={[1.2, 1.2, 1.2]} rotation={[0, Math.PI, 0]}>
        <primitive object={consoleScene} />
        <SpotLight position={[0, 10, 0]} color="#00e5ff" intensity={3} distance={20} angle={0.4} penumbra={1} castShadow />
      </group>

      {/* Hologram Globe - Serious analytical visualization */}
      <Float speed={0.5} rotationIntensity={0.05} floatIntensity={0.2}>
        <group ref={globeRef} position={[-12, 1, -8]} scale={[2.5, 2.5, 2.5]}>
          <primitive object={globeScene} />
          <pointLight position={[0, 0, 0]} color="#00f0ff" intensity={2} distance={15} />
        </group>
      </Float>
    </group>
  );
};

// Preload models for faster loading
useGLTF.preload('/models/globe2.glb');
useGLTF.preload('/models/console.glb');
useGLTF.preload('/models/skybox.glb');
useGLTF.preload('/models/portal.glb');
