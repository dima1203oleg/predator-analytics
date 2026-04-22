import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 🌌 Neural Core Visualization | v58.5-ELITE
 * Центральна 3D-візуалізація серця системи PREDATOR.
 */

const PulseSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.cos(t / 4) / 8;
      meshRef.current.rotation.y = Math.sin(t / 4) / 8;
      meshRef.current.rotation.z = Math.sin(t / 4) / 8;
      
      // Dynamic pulsing scale
      const scale = 1 + Math.sin(t * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color="#e11d48"
        roughness={0}
        metalness={1}
        distort={0.4}
        speed={2}
        transparent
        opacity={0.6}
        emissive="#e11d48"
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
};

const DataParticles = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const distance = 1.2 + Math.random() * 0.8;
      
      pos[i * 3] = distance * Math.sin(theta) * Math.cos(phi);
      pos[i * 3 + 1] = distance * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = distance * Math.cos(theta);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.002;
      pointsRef.current.rotation.z += 0.001;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#D4AF37"
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const ConnectionLines = () => {
  const lineRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.rotation.y -= 0.001;
    }
  });

  return (
    <group ref={lineRef}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
          <ringGeometry args={[1.5, 1.51, 64]} />
          <meshBasicMaterial color="#e11d48" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

export const NeuralCore: React.FC = () => {
  return (
    <div className="w-full h-full relative group">
      {/* Overlay Vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,2,2,0.8)_80%)]" />
      
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#e11d48" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#D4AF37" />
        
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <PulseSphere />
          <DataParticles />
          <ConnectionLines />
        </Float>
      </Canvas>
      
      {/* Tactical Data HUD Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center gap-4">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-48 h-48 border border-rose-500/20 rounded-full flex items-center justify-center"
        >
          <div className="w-40 h-40 border border-dashed border-rose-500/10 rounded-full animate-spin-slow" />
        </motion.div>
      </div>
    </div>
  );
};

export default NeuralCore;
