import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CognitiveWakeProps {
  intentActive: boolean;
}

export const CognitiveWake: React.FC<CognitiveWakeProps> = ({ intentActive }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate random points for the data particles
  const particleCount = 2000;
  const [positions, phases] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const phs = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      // Start in a wide orbit
      const radius = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      
      phs[i] = Math.random() * Math.PI * 2;
    }
    return [pos, phs];
  }, [particleCount]);
  
  const shaderArgs = {
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color('#38bdf8') }, // Cyan
      activeColor: { value: new THREE.Color('#f59e0b') }, // Amber/Gold for data wake
      isActive: { value: intentActive ? 1.0 : 0.0 }
    },
    vertexShader: `
      attribute float phase;
      varying vec3 vPos;
      uniform float time;
      uniform float isActive;
      
      void main() {
        vPos = position;
        
        vec3 pos = position;
        
        // If active, pull particles towards the center (Singularity)
        // If inactive, drift slowly
        float pullForce = isActive * 0.8; 
        
        // Dynamic orbiting
        float angle = time * (0.2 + phase * 0.1);
        float s = sin(angle);
        float c = cos(angle);
        
        // Rotate around Y
        float newX = pos.x * c - pos.z * s;
        float newZ = pos.x * s + pos.z * c;
        
        pos.x = mix(newX, newX * 0.3, pullForce);
        pos.z = mix(newZ, newZ * 0.3, pullForce);
        pos.y = mix(pos.y, pos.y * 0.3, pullForce);
        
        // Add some jitter when active
        pos += vec3(sin(time * 10.0 + phase), cos(time * 11.0 + phase), sin(time * 12.0 + phase)) * isActive * 0.2;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Size attenuation
        gl_PointSize = (10.0 + isActive * 20.0) * (1.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform vec3 activeColor;
      uniform float isActive;
      
      void main() {
        // Circular particle
        vec2 xy = gl_PointCoord.xy - vec2(0.5);
        float ll = length(xy);
        if (ll > 0.5) discard;
        
        // Soft edge
        float alpha = (0.5 - ll) * 2.0;
        
        vec3 finalColor = mix(color, activeColor, isActive);
        
        gl_FragColor = vec4(finalColor, alpha * (0.3 + isActive * 0.5));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  };

  useFrame((state) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime;
        
        const targetActive = intentActive ? 1.0 : 0.0;
        material.uniforms.isActive.value += (targetActive - material.uniforms.isActive.value) * 0.05;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-phase"
          count={phases.length}
          array={phases}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial args={[shaderArgs]} />
    </points>
  );
};
