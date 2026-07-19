import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sphere } from '@react-three/drei';

interface SingularitySphereProps {
  intentActive: boolean;
}

export const SingularitySphere: React.FC<SingularitySphereProps> = ({ intentActive }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Custom shader for the singularity core
  const shaderArgs = {
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color('#38bdf8') }, // Cyan default
      activeColor: { value: new THREE.Color('#f43f5e') }, // Red when intent active
      isActive: { value: intentActive ? 1.0 : 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform float time;
      uniform float isActive;
      
      // Simplex noise function placeholder (using simple sine waves for now)
      void main() {
        vUv = uv;
        vNormal = normal;
        
        vec3 pos = position;
        
        // Deform sphere based on time and activity
        float noise = sin(pos.x * 5.0 + time) * sin(pos.y * 5.0 + time) * sin(pos.z * 5.0 + time);
        float deformation = noise * (0.1 + isActive * 0.3);
        
        pos += normal * deformation;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform float time;
      uniform vec3 color;
      uniform vec3 activeColor;
      uniform float isActive;
      
      void main() {
        // Fresnel effect for glowing edges
        float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        fresnel = pow(fresnel, 3.0);
        
        // Mix colors based on activity
        vec3 finalColor = mix(color, activeColor, isActive);
        
        // Core glow + edge glow
        vec3 glow = finalColor * (0.5 + fresnel * 2.0);
        
        // Add some pulsing
        glow *= 0.8 + 0.2 * sin(time * 5.0);
        
        gl_FragColor = vec4(glow, 0.8);
      }
    `,
    transparent: true,
    wireframe: false,
    side: THREE.DoubleSide
  };

  useFrame((state) => {
    if (meshRef.current) {
      // Rotate the sphere slowly
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
      
      // Update shader uniforms
      const material = meshRef.current.material as THREE.ShaderMaterial;
      if (material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime;
        
        // Smoothly transition isActive uniform
        const targetActive = intentActive ? 1.0 : 0.0;
        material.uniforms.isActive.value += (targetActive - material.uniforms.isActive.value) * 0.1;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial args={[shaderArgs]} />
      
      {/* Add a wireframe cage around it */}
      <Sphere args={[2.1, 16, 16]}>
        <meshBasicMaterial 
          color={intentActive ? '#f43f5e' : '#38bdf8'} 
          wireframe={true} 
          transparent={true}
          opacity={0.1}
        />
      </Sphere>
    </mesh>
  );
};
