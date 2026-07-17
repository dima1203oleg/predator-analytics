import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

// Based on fake-glow-material-r3f logic for lightweight glow
const FakeGlowMaterial = shaderMaterial(
  {
    falloffAmount: 3.0,
    glowInternalRadius: 2.0,
    glowColor: new THREE.Color('#00ffff'),
    glowSharpness: 0.5,
    opacity: 1.0,
  },
  // Vertex Shader
  `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = normalize(position) * glowInternalRadius;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment Shader
  `
  uniform vec3 glowColor;
  uniform float falloffAmount;
  uniform float glowSharpness;
  uniform float opacity;
  
  varying vec3 vNormal;
  
  void main() {
    // Calculate facing ratio (Fresnel effect)
    float intensity = pow(glowSharpness - dot(vNormal, vec3(0, 0, 1.0)), falloffAmount);
    gl_FragColor = vec4(glowColor, intensity * opacity);
  }
  `
);

extend({ FakeGlowMaterial });

// Add to JSX types (required for React Three Fiber custom materials)
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'fake-glow-material': any;
    }
  }
}

interface CoreNucleusProps {
  isVisible: boolean;
  color?: string;
}

/**
 * CoreNucleus is the central AI entity representing processing state.
 * Uses a custom FakeGlowMaterial to achieve a premium glowing effect 
 * without heavy post-processing overhead.
 */
export const CoreNucleus: React.FC<CoreNucleusProps> = ({ isVisible, color = '#00ffff' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  
  const targetOpacity = isVisible ? 1 : 0;

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }

    if (materialRef.current) {
      // Smooth fade in/out based on visibility
      const currentOpacity = materialRef.current.opacity;
      materialRef.current.opacity = THREE.MathUtils.lerp(currentOpacity, targetOpacity, 0.05);
      
      // Pulse effect
      const pulse = Math.sin(Date.now() * 0.002) * 0.5 + 2.5;
      materialRef.current.falloffAmount = pulse;
    }
  });

  return (
    <mesh ref={meshRef} visible={targetOpacity > 0.01}>
      {/* An Icosahedron gives a crystalline / cyber look */}
      <icosahedronGeometry args={[5, 2]} />
      <fake-glow-material
        ref={materialRef}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        glowColor={new THREE.Color(color)}
      />
    </mesh>
  );
};
