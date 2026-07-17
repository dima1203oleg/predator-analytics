import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Torus, Html } from '@react-three/drei';
import * as THREE from 'three';

export const HolographicCore = () => {
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.005;
      coreRef.current.rotation.x += 0.005;
      // Пульсація ядра
      const scale = 1 + Math.sin(time * 2) * 0.05;
      coreRef.current.scale.set(scale, scale, scale);
    }
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(time * 0.5) * 0.2;
      ring1Ref.current.rotation.y += 0.01;
    }
    
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 3;
      ring2Ref.current.rotation.y -= 0.015;
      ring2Ref.current.rotation.z = Math.cos(time * 0.3) * 0.2;
    }

    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = -Math.PI / 4;
      ring3Ref.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={[0, 2, 0]}>
      {/* Світіння навколо ядра */}
      <pointLight color="#00e5ff" intensity={5} distance={10} decay={2} />
      <pointLight color="#bc13fe" intensity={3} distance={8} decay={2} position={[0, -1, 0]} />

      {/* Центральне ядро */}
      <Sphere ref={coreRef} args={[1, 64, 64]}>
        <meshStandardMaterial 
          color="#00f3ff"
          emissive="#00e5ff"
          emissiveIntensity={0.8}
          wireframe={true}
          transparent={true}
          opacity={0.6}
        />
      </Sphere>

      {/* Внутрішнє кільце */}
      <Torus ref={ring1Ref} args={[1.5, 0.02, 16, 100]}>
        <meshStandardMaterial 
          color="#0aff0a"
          emissive="#0aff0a"
          emissiveIntensity={2}
        />
      </Torus>

      {/* Середнє кільце (з переривчастою структурою) */}
      <Torus ref={ring2Ref} args={[2.2, 0.05, 16, 50]}>
        <meshStandardMaterial 
          color="#bc13fe"
          emissive="#bc13fe"
          emissiveIntensity={1.5}
          wireframe={true}
        />
      </Torus>

      {/* Зовнішнє кільце */}
      <Torus ref={ring3Ref} args={[3, 0.01, 16, 200]}>
        <meshStandardMaterial 
          color="#fff300"
          emissive="#fff300"
          emissiveIntensity={1}
          transparent={true}
          opacity={0.5}
        />
      </Torus>

      {/* HTML Метрики навколо ядра */}
      <Html position={[3.5, 1, 0]} center className="pointer-events-none">
        <div className="bg-slate-950/80 border border-cyan-500/30 p-3 rounded backdrop-blur-md shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          <div className="text-[10px] font-mono text-cyan-500/70 mb-1 tracking-widest">SYSTEM_LOAD</div>
          <div className="flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">GPU CORE</span>
              <span className="text-emerald-400 font-bold">92%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">CPU CLUSTER</span>
              <span className="text-cyan-400 font-bold">45%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">RAM V-POOL</span>
              <span className="text-purple-400 font-bold">18.4TB</span>
            </div>
          </div>
        </div>
      </Html>

      <Html position={[-3.5, -1, 0]} center className="pointer-events-none">
        <div className="bg-slate-950/80 border border-purple-500/30 p-3 rounded backdrop-blur-md shadow-[0_0_15px_rgba(188,19,254,0.2)]">
          <div className="text-[10px] font-mono text-purple-500/70 mb-1 tracking-widest">AI_AGENTS_ONLINE</div>
          <div className="text-2xl font-black text-purple-400 tracking-wider">1,402</div>
          <div className="text-[9px] font-mono text-slate-500 mt-1 uppercase">Active RAG queries: 84</div>
        </div>
      </Html>
    </group>
  );
};
