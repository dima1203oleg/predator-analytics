import React, { Suspense } from 'react';
import { useGLTF, Environment as DreiEnvironment } from '@react-three/drei';
import { useMoodStore } from '../stores/useMoodStore';

const ModelFallback = ({ position, scale = 1, type = 'box' }: { position: [number, number, number], scale?: number, type?: 'box' | 'cylinder' }) => (
  <mesh position={position} scale={scale}>
    {type === 'cylinder' ? <cylinderGeometry args={[1, 1, 2, 16]} /> : <boxGeometry args={[1, 1, 1]} />}
    <meshStandardMaterial 
      color="#00e5ff" 
      wireframe 
      transparent 
      opacity={0.3} 
      emissive="#00e5ff" 
      emissiveIntensity={0.5} 
    />
  </mesh>
);

const PlanetaryMap = () => {
  const { scene } = useGLTF('/models/hologram_planetary_map.glb');
  return <primitive object={scene} position={[0, -1, 0]} scale={1.5} />;
};

const SciFiTable = () => {
  const { scene } = useGLTF('/models/sci-fi_hologram_table.glb');
  return <primitive object={scene} position={[-4, -0.5, -2]} scale={1.2} />;
};

const CelestialTable = () => {
  const { scene } = useGLTF('/models/celestial_navigation_table.glb');
  return <primitive object={scene} position={[4, -0.5, -2]} scale={0.8} />;
};

const HoloDesk = () => {
  const { scene } = useGLTF('/models/holo_desk.glb');
  return <primitive object={scene} position={[-3, -1, 3]} scale={0.6} />;
};

const BaseHologramTable = () => {
  const { scene } = useGLTF('/models/hologram_table.glb');
  return <primitive object={scene} position={[3, -1, 3]} scale={0.7} />;
};


export const Environment: React.FC = () => {
  const weather = useMoodStore((state) => state.weather);
  
  // Base light color based on weather
  const getLightColor = () => {
    switch (weather) {
      case 'calm': return '#4A90D9'; // Cyan
      case 'exploration': return '#D69E2E'; // Amber
      case 'storm': return '#7B4FBF'; // Purple
      case 'conflict': return '#7B4FBF'; // Purple
      case 'overload': return '#9B2C2C'; // Red
      case 'insight': return '#E2E8F0'; // White
      default: return '#4A90D9';
    }
  };

  return (
    <>
      <color attach="background" args={['#050507']} />
      <fogExp2 attach="fog" color="#0A1128" density={0.002} />
      
      {/* Lights */}
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 0, 0]} intensity={2} distance={20} color={getLightColor()} />
      <spotLight position={[0, 5, -10]} intensity={1} angle={0.5} penumbra={1} color="#4A90D9" />

      {/* Models */}
      <Suspense fallback={null}>
        <PlanetaryMap />
        <SciFiTable />
        <CelestialTable />
        <HoloDesk />
        <BaseHologramTable />
      </Suspense>

      {/* Optional HDRI */}
      <DreiEnvironment preset="city" background={false} blur={1} />
    </>
  );
};

// Preload models
useGLTF.preload('/models/hologram_planetary_map.glb');
useGLTF.preload('/models/sci-fi_hologram_table.glb');
useGLTF.preload('/models/celestial_navigation_table.glb');
useGLTF.preload('/models/holo_desk.glb');
useGLTF.preload('/models/hologram_table.glb');
