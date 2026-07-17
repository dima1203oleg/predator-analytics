import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePredatorStore } from '../stores/usePredatorStore';
import { useMoodStore } from '../stores/useMoodStore';
import { coreVertexShader, coreFragmentShader } from '../shaders/coreFresnel';

export const Core: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const systemLoad = usePredatorStore((state) => state.systemLoad);
  const weather = useMoodStore((state) => state.weather);
  const targetScale = useRef(1.0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLoad: { value: systemLoad },
      uColorBase: { value: new THREE.Color('#4A90D9') }, // Cyan
      uColorDanger: { value: new THREE.Color('#9B2C2C') }, // Red
      uColorInsight: { value: new THREE.Color('#FFFFFF') },
      uIsInsight: { value: 0.0 }
    }),
    []
  );

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      
      // Smoothly interpolate the uniform to the target load
      materialRef.current.uniforms.uLoad.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uLoad.value,
        systemLoad,
        0.1
      );
      
      const isInsightTarget = weather === 'insight' ? 1.0 : 0.0;
      materialRef.current.uniforms.uIsInsight.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uIsInsight.value,
        isInsightTarget,
        0.1
      );
    }
    
    if (meshRef.current) {
      // Rotation speed depends on system load
      let baseRotation = 0.1;
      if (weather === 'insight') baseRotation = 0.01; // Завмирання
      else if (weather === 'storm') baseRotation = 0.5;
      
      const loadRotation = systemLoad * 2.0;
      meshRef.current.rotation.y += (baseRotation + loadRotation) * delta;
      meshRef.current.rotation.x += baseRotation * 0.5 * delta;
      
      // Insight пульсація (стискання)
      if (weather === 'insight') {
         targetScale.current = 0.5 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
      } else {
         targetScale.current = 1.0;
      }
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current), 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {/* 8 details for LOD handling later if needed */}
      <icosahedronGeometry args={[2, 8]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={coreVertexShader}
        fragmentShader={coreFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
};
