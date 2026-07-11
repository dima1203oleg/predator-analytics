import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, vec3 } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export interface CognitiveNodeData {
  id: string;
  type: 'invoice' | 'court_decision' | 'entity' | 'transaction';
  label: string;
  weight: number;
}

interface CognitiveDataNodeProps {
  data: CognitiveNodeData;
  position?: [number, number, number];
}

export function CognitiveDataNode({ data, position = [0, 0, 0] }: CognitiveDataNodeProps) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const [hovered, setHovered] = useState(false);

  // Determine physical properties based on data type
  const mass = data.type === 'court_decision' ? 5 : data.type === 'invoice' ? 0.5 : 2;
  const scale = mass * 0.5;

  // Visuals
  const color = data.type === 'court_decision' ? '#db3737' : data.type === 'invoice' ? '#0f9960' : '#137cbd';

  useFrame(() => {
    if (bodyRef.current && hovered) {
      // Slight upward lift when hovered
      bodyRef.current.applyImpulse({ x: 0, y: 0.1 * mass, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={position}
      mass={mass}
      linearDamping={1.5}
      angularDamping={1.5}
      userData={{ id: data.id, type: data.type }}
    >
      <group 
        scale={[scale, scale, scale]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <mesh>
          <boxGeometry args={[1, 1.4, 0.1]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={hovered ? 2 : 0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Text 
          position={[0, 0, 0.06]} 
          fontSize={0.15} 
          color="#ffffff"
          maxWidth={0.8}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
        >
          {data.label}
        </Text>
      </group>
    </RigidBody>
  );
}
