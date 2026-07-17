import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { usePredatorStore } from '../../store/usePredatorStore'
import { CoreShaderMaterial } from '../../shaders/CoreShader'

export const Core: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const coreState = usePredatorStore((state) => state.coreState);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      
      let targetIntensity = coreState === 'forging' ? 3.5 : coreState === 'processing' ? 1.8 : 0.7;
      let targetSpeed = coreState === 'forging' ? 6.0 : coreState === 'processing' ? 2.5 : 0.8;

      materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uIntensity.value, targetIntensity, 0.1
      );
      materialRef.current.uniforms.uStateSpeed.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uStateSpeed.value, targetSpeed, 0.1
      );
    }

    if (meshRef.current) {
      const rotationMultiplier = coreState === 'forging' ? 3.0 : coreState === 'processing' ? 1.5 : 0.5;
      meshRef.current.rotation.y += 0.005 * rotationMultiplier;
      meshRef.current.rotation.x += 0.002 * rotationMultiplier;
      
      const scaleBase = coreState === 'forging' ? 1.35 : coreState === 'processing' ? 1.15 : 1.0;
      const pulse = scaleBase + Math.sin(time * (coreState === 'forging' ? 8.0 : 2.5)) * 0.06;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.8, 0.02, 16, 120]} />
        <meshStandardMaterial color="#ffb700" emissive="#ffb700" emissiveIntensity={coreState === 'forging' ? 3.0 : 0.8} roughness={0.05} metalness={1.0} />
      </mesh>
      
      <mesh rotation={[0, -Math.PI / 4, 0]}>
        <torusGeometry args={[2.4, 0.01, 8, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} wireframe />
      </mesh>

      <mesh ref={meshRef}>
        <boxGeometry args={[1.6, 1.6, 1.6]} />
        <shaderMaterial ref={materialRef} vertexShader={CoreShaderMaterial.vertexShader} fragmentShader={CoreShaderMaterial.fragmentShader} uniforms={CoreShaderMaterial.uniforms} transparent />
      </mesh>
    </group>
  );
}
