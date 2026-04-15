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
    meshRef.current.rotation.y = t * 0.4;
    meshRef.current.rotation.z = Math.sin(t * 0.2) * 0.05;
    meshRef.current.position.y = Math.sin(t * 0.8) * 0.15;
  });

  return (
    <group ref={meshRef}>
      {/* Main Board - Ultra Dark Coal */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4.2, 2.2, 0.15]} />
        <meshStandardMaterial color="#020617" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Glowing Core - Sovereign Gold/Rose Fusion */}
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[1.4, 1.4, 0.15]} />
        <MeshDistortMaterial
          color={color}
          speed={load / 12}
          distort={0.45}
          emissive={color}
          emissiveIntensity={4 + (load / 30)}
        />
      </mesh>

      {/* Cooling Fans (Sovereign Gold Rings) */}
      {[-1.3, 1.3].map((x, i) => (
        <group key={i} position={[x, 0, 0.18]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.8, 0.8, 0.08, 64]} />
            <meshStandardMaterial color="#030712" metalness={1} roughness={0} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.85, 0.03, 32, 128]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
          </mesh>
          {/* Fan detailing */}
          <mesh position={[0, 0, 0.05]}>
             <sphereGeometry args={[0.2, 16, 16]} />
             <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
          </mesh>
        </group>
      ))}

      {/* Connectors / Elite Gold Trim */}
      <mesh position={[0, -1.05, 0]}>
        <boxGeometry args={[4, 0.25, 0.1]} />
        <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={2} />
      </mesh>
      
      {/* Structural Bars */}
      {[1.9, -1.9].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
           <boxGeometry args={[0.1, 2, 0.2]} />
           <meshStandardMaterial color="#D4AF37" opacity={0.4} transparent />
        </mesh>
      ))}
    </group>
  );
};

const Nvidia3DVisualizer: React.FC<{ load?: number }> = ({ load = 45 }) => {
  const gpuColor = useMemo(() => {
    if (load > 85) return "#E11D48"; // Elite Rose Peak
    if (load > 60) return "#F59E0B"; // Sovereign Gold High
    return "#D4AF37"; // Pure Gold Operational
  }, [load]);

  return (
    <div className="w-full h-full min-h-[350px] relative rounded-[40px] overflow-hidden bg-black shadow-3xl">
      {/* UI Overlay Labels */}
      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_25px_rgba(212,175,55,1)] animate-pulse" />
          <span className="text-sm font-black text-white uppercase tracking-[0.4em]">H100 SOVEREIGN_CORE_ELITE</span>
        </div>
        <div className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter opacity-30 select-none">NODE_READY</div>
      </div>

      <div className="absolute bottom-10 right-10 z-10 text-right pointer-events-none">
        <div className="text-[64px] font-black font-mono leading-none tracking-tighter italic" style={{ color: gpuColor, textShadow: `0 0 40px ${gpuColor}66` }}>
          {load}%
        </div>
        <div className="text-[11px] text-yellow-600 font-black uppercase tracking-[0.5em] mt-3">COMPUTE_EXHAUST</div>
      </div>

      <Canvas gl={{ antialias: true, alpha: true, stencil: true }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <Stars radius={120} depth={70} count={12000} factor={8} saturation={1} fade speed={3} />
        <ambientLight intensity={0.5} />
        <pointLight position={[12, 12, 12]} intensity={3} color={gpuColor} />
        <spotLight position={[-12, 12, 12]} angle={0.25} penumbra={1} intensity={2.5} castShadow color="#D4AF37" />
        <pointLight position={[0, -5, 5]} intensity={1} color="#E11D48" />

        <Float speed={4} rotationIntensity={1} floatIntensity={1.2}>
          <GPUModel load={load} color={gpuColor} />
        </Float>

        <ContactShadows position={[0, -3.5, 0]} opacity={0.7} scale={15} blur={4} far={6} color={gpuColor} />
      </Canvas>
      
      {/* Elite Digital Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-yellow-500/10 rounded-[40px]" />
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-1/2 left-0 w-full h-[1px] bg-yellow-500/30 blur-[2px]" />
         <div className="absolute top-0 left-1/2 w-[1px] h-full bg-yellow-500/30 blur-[2px]" />
      </div>
    </div>
  );
};

export default Nvidia3DVisualizer;
