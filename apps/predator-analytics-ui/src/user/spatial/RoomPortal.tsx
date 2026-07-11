/**
 * ═══════════════════════════════════════════════════════════════════
 * RoomPortal — Один 3D-портал в хабі
 *
 * Голограмне кільце з назвою кімнати. При наведенні — підсвічується.
 * При кліці — запускає навігаційний перехід.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useRef, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, Ring } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDefinition } from '../stores/roomStore';
import { useRoomStore } from '../stores/roomStore';

interface RoomPortalProps {
  room: RoomDefinition;
  position: [number, number, number];
  index: number;
}

export function RoomPortal({ room, position, index }: RoomPortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const navigateTo = useRoomStore((s) => s.navigateTo);
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const isActive = activeRoom === room.id;

  const color = new THREE.Color(room.color);
  const pulseOffset = index * 0.4; // stagger pulse per portal

  useFrame((state) => {
    if (!groupRef.current || !ringRef.current) return;
    const t = state.clock.elapsedTime + pulseOffset;

    // Float animation
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.3;

    // Ring rotation
    ringRef.current.rotation.z = t * (hovered ? 1.5 : 0.3);

    // Pulse scale on hover or active
    const targetScale = hovered || isActive ? 1.15 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (hovered ? 0.25 : 0.08) + Math.sin(t * 2) * 0.04;
    }
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    navigateTo(room.id);
  }, [navigateTo, room.id]);

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Outer glow disc */}
      <mesh ref={glowRef}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Main portal ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[1.4, 1.6, 48]} />
        <meshBasicMaterial
          color={hovered || isActive ? color : new THREE.Color(room.color).multiplyScalar(0.6)}
          transparent
          opacity={hovered || isActive ? 0.9 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner accent ring */}
      <mesh rotation={[0, 0, Math.PI / 6]}>
        <ringGeometry args={[0.9, 0.95, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Icon label in center */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.55}
        color={room.color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {room.icon}
      </Text>

      {/* Room name below */}
      <Text
        position={[0, -2.1, 0]}
        fontSize={0.28}
        color={hovered || isActive ? '#ffffff' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
      >
        {room.labelUK}
      </Text>

      {/* Active indicator dot */}
      {isActive && (
        <mesh position={[0, -2.55, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={room.color} />
        </mesh>
      )}
    </group>
  );
}
