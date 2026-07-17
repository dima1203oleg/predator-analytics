import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';
import { Text } from '@react-three/drei';
import { Group } from 'three';

interface MissionQuestPlaqueProps {
  id: string;
  title: string;
  value: string;
  threatLevel: 'NORMAL' | 'HIGH';
  position: [number, number, number];
  onClick: (id: string) => void;
}

export const MissionQuestPlaque = ({ id, title, value, threatLevel, position, onClick }: MissionQuestPlaqueProps) => {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Parallax and float effect
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle float
    groupRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.1;
    
    // Parallax on mouse move
    if (hovered) {
      groupRef.current.rotation.x = state.pointer.y * 0.2;
      groupRef.current.rotation.y = state.pointer.x * 0.2;
    } else {
      groupRef.current.rotation.x = Math.sin(t) * 0.05;
      groupRef.current.rotation.y = Math.cos(t) * 0.05;
    }
  });

  const { scale, outlineColor, emissiveIntensity } = useSpring({
    scale: hovered ? 1.05 : 1,
    outlineColor: hovered 
      ? (threatLevel === 'HIGH' ? '#FF0033' : '#00F5FF') 
      : (threatLevel === 'HIGH' ? '#33000a' : '#002233'),
    emissiveIntensity: hovered ? 0.6 : 0.1,
    config: { tension: 300, friction: 20 },
  });

  return (
    <animated.group
      ref={groupRef}
      position={position}
      scale={scale}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
    >
      {/* Plaque Base (Glassmorphism) */}
      <mesh>
        <boxGeometry args={[4, 1.5, 0.2]} />
        <animated.meshPhysicalMaterial 
          color="#020817"
          metalness={0.5}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
          ior={1.5}
          clearcoat={1}
          emissive={outlineColor as any}
          emissiveIntensity={emissiveIntensity as any}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Neon Edge Outline */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[3.9, 1.4]} />
        <animated.meshBasicMaterial 
          color={outlineColor as any} 
          wireframe 
        />
      </mesh>

      {/* Content */}
      <Text
        position={[-1.7, 0.3, 0.15]}
        fontSize={0.2}
        color={threatLevel === 'HIGH' ? '#FF0033' : '#00F5FF'}
        anchorX="left"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf"
      >
        {title}
      </Text>
      
      <Text
        position={[-1.7, -0.2, 0.15]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf"
      >
        {value}
      </Text>
    </animated.group>
  );
};
