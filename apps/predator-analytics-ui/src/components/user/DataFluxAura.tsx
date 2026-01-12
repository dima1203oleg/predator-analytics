import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { InteractionStatus } from '../../hooks/useVoiceControl';

interface DataFluxAuraProps {
  status: InteractionStatus;
}

export const DataFluxAura: React.FC<DataFluxAuraProps> = ({ status }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Group>(null);

  // Generate particles for the aura - Optimized count dynamically
  const particlesPosition = useMemo(() => {
    // Check if mobile (approximate)
    const width = window.innerWidth;
    const isMobile = width < 768;
    const count = isMobile ? 600 : 1800; // Reduced count for performance, still looks dense enough
    
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      const r = 2.5 + Math.random() * 0.5;
      
      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(theta);
    }
    return positions;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.05;
      pointsRef.current.rotation.z = t * 0.02;
      
      // Pulse effect based on status
      const scale = status === 'PROCESSING' ? 1.1 + Math.sin(t * 10) * 0.05 : 
                    status === 'SPEAKING' ? 1 + Math.sin(t * 15) * 0.1 : 
                    1 + Math.sin(t * 0.5) * 0.02;
      pointsRef.current.scale.setScalar(scale);
    }

    if (coreRef.current) {
        // Core breathing
        const coreScale = status === 'LISTENING' ? 1.5 : 1.0;
        coreRef.current.scale.lerp(new THREE.Vector3(coreScale, coreScale, coreScale), 0.1);
        coreRef.current.rotation.x = t * 0.2;
        coreRef.current.rotation.y = t * 0.3;
    }

    if (outerRingRef.current) {
        outerRingRef.current.rotation.z = -t * 0.1;
        outerRingRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
  });

  // Dynamic colors
  const primaryColor = status === 'PROCESSING' ? '#d946ef' : // Magenta
                       status === 'SPEAKING' ? '#00f0ff' : // Cyan
                       status === 'LISTENING' ? '#10b981' : // Green
                       '#ffc24a'; // Gold (Idle)

  return (
    <group>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Particle Cloud */}
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particlesPosition.length / 3}
              array={particlesPosition}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color={primaryColor}
            transparent
            opacity={0.6}
            sizeAttenuation={true}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Solid Core */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshPhysicalMaterial 
            color={primaryColor}
            wireframe
            transparent
            opacity={0.3}
            roughness={0}
            metalness={1}
            emissive={primaryColor}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Holographic Inner Sphere */}
        <mesh>
            <sphereGeometry args={[0.8, 32, 32]} />
            <meshBasicMaterial color={primaryColor} transparent opacity={0.1} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Rotating Rings */}
        <group ref={outerRingRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.2, 0.01, 16, 100]} />
                <meshBasicMaterial color={primaryColor} transparent opacity={0.3} />
            </mesh>
            <mesh rotation={[0, Math.PI / 4, 0]}>
                <torusGeometry args={[3.5, 0.01, 16, 100]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
            </mesh>
        </group>

        {/* Dynamic Light */}
        <pointLight position={[0, 0, 0]} color={primaryColor} intensity={2} distance={10} decay={2} />
      </Float>
    </group>
  );
};