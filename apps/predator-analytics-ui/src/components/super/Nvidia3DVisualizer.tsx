import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Float, MeshDistortMaterial, PerspectiveCamera, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

interface GPUModelProps {
  load: number;
  color: string;
}

const GPUModel: React.FC<GPUModelProps> = ({ load, color }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.rotation.z = Math.sin(t * 0.2) * 0.1;
    meshRef.current.position.y = Math.sin(t * 1) * 0.1;
  });

  return (
    <group ref={meshRef}>
      {/* Main Board */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 2, 0.1]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Glowing Core */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[1.2, 1.2, 0.1]} />
        <MeshDistortMaterial
          color={color}
          speed={load / 20}
          distort={0.3}
          emissive={color}
          emissiveIntensity={2 + (load / 50)}
        />
      </mesh>

      {/* Cooling Fans (Simplified 3D Circles) */}
      {[-1.2, 1.2].map((x, i) => (
        <group key={i} position={[x, 0, 0.15]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.05, 32]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.75, 0.02, 16, 100]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
          </mesh>
        </group>
      ))}

      {/* Connectors / Visual Details */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[3.8, 0.2, 0.05]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const Nvidia3DVisualizer: React.FC<{ load?: number }> = ({ load = 45 }) => {
  const gpuColor = useMemo(() => {
    if (load > 80) return "#ef4444"; // Red for heavy load
    if (load > 50) return "#f59e0b"; // Orange for mid load
    return "#10b981"; // Green for low load
  }, [load]);

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 to-black">
      {/* UI Overlay Labels */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-1">
          <div className={`w-2 h-2 rounded-full animate-ping`} style={{ backgroundColor: gpuColor }} />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">NVIDIA H100 TENSOR CORE</span>
        </div>
        <div className="text-2xl font-black text-slate-400 italic">COMPUTE_ACTIVE</div>
      </div>

      <div className="absolute bottom-6 right-6 z-10 text-right pointer-events-none">
        <div className="text-[32px] font-black font-mono leading-none" style={{ color: gpuColor }}>
          {load}%
        </div>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Node Utilization</div>
      </div>

      <Canvas gl={{ antialias: true }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color={gpuColor} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <GPUModel load={load} color={gpuColor} />
        </Float>

        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} color={gpuColor} />
      </Canvas>
    </div>
  );
};

// Required for threejs in React
// 3D Engine Visualization v45.0.0

export default Nvidia3DVisualizer;
