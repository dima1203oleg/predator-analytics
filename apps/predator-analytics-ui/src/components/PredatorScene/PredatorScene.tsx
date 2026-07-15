import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Sky } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ControlRoom } from './ControlRoom';
import { Spaceships } from './Spaceships';
import { SynapticMesh } from '../SynapticMesh';
interface PredatorSceneProps {
  onPredatorClick?: () => void;
  activeModule?: string;
}

export function PredatorScene({ onPredatorClick, activeModule }: PredatorSceneProps) {
  // Determine if we need to focus the throne or the table based on activeModule
  const isThroneActive = activeModule === 'throne';

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
      <Canvas
        shadows
        camera={{ position: [0, 4.5, 14], fov: 60 }}
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
      >
        <color attach="background" args={['#000005']} />
        <fog attach="fog" args={['#000008', 0.016, 50]} />

        {/* Ambient and directional lights */}
        <ambientLight intensity={1.2} color="#445588" />
        <directionalLight
          position={[6, 10, 6]}
          color="#ff3030"
          intensity={3.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-7, 5, -5]} color="#00e5ff" intensity={2} />
        <directionalLight position={[0, -3, -10]} color="#ffab00" intensity={1.2} />

        {/* Point Lights */}
        <pointLight position={[-4, 2, 1]} color="#ff1111" intensity={5} distance={22} />
        <pointLight position={[4, 2, -2]} color="#00e5ff" intensity={4} distance={20} />
        <pointLight position={[0, 6, -6]} color="#b44aff" intensity={2.5} distance={16} />

        {/* Environment details */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Holographic Floor Grid */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[20, 64]} />
          <meshStandardMaterial color="#010208" roughness={0.92} metalness={0.55} />
        </mesh>
        <gridHelper args={[40, 40, '#ff1111', '#0a0000']} position={[0, 0, 0]} material-opacity={0.12} material-transparent />

        {/* Rings */}
        {[3, 6, 9, 12, 15, 18].map((r, i) => (
          <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <ringGeometry args={[r - 0.02, r + 0.02, 128]} />
            <meshBasicMaterial 
              color={i % 2 === 0 ? '#ff2020' : '#001133'} 
              transparent 
              opacity={i % 2 === 0 ? 0.28 : 0.08} 
              side={2} 
            />
          </mesh>
        ))}

        {/* Main Character & Assets */}
        <Suspense fallback={null}>
          <ControlRoom />
          <Spaceships />
          {/* The Actual Graph Data Mesh */}
          <group position={[0, 4, -4]} scale={[0.5, 0.5, 0.5]}>
            <SynapticMesh />
          </group>
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enablePan={false}
          minDistance={4}
          maxDistance={24}
          maxPolarAngle={Math.PI * 0.76}
          target={[0, 1.5, 0]}
          autoRotate={isThroneActive}
          autoRotateSpeed={0.35}
        />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} opacity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
