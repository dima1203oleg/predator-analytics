/**
 * ═══════════════════════════════════════════════════════════════════
 * RoomPortalHub — 3D Хаб з кільцем порталів кімнат
 *
 * Розміщує всі кімнати у кільці навколо аватара.
 * Показується тільки коли activeRoom === 'hub'.
 * ═══════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { ROOMS, useRoomStore } from '../stores/roomStore';
import { RoomPortal } from './RoomPortal';

/** Rotating outer decorative ring for the hub */
function HubOrbitRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * speed;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.04, 80]} />
      <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function RoomPortalHub() {
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const transitionPhase = useRoomStore((s) => s.transitionPhase);
  const groupRef = useRef<THREE.Group>(null);

  const isVisible = activeRoom === 'hub' && transitionPhase !== 'entering';

  // Fade in/out
  useFrame(() => {
    if (!groupRef.current) return;
    const target = isVisible ? 1 : 0;
    const mat = groupRef.current;
    // Use opacity via scale (simpler than material traversal)
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, isVisible ? 1 : 0.85, 0.04);
    groupRef.current.scale.set(newScale, newScale, newScale);
    groupRef.current.visible = currentScale > 0.05;
  });

  // Compute 3D positions in a circle on the XZ plane
  const portalPositions = useMemo(() => {
    return ROOMS.map((room) => {
      const x = Math.cos(room.angle) * room.radius;
      const z = Math.sin(room.angle) * room.radius;
      return [x, 0, z] as [number, number, number];
    });
  }, []);

  return (
    <group ref={groupRef}>
      {/* Decorative hub orbit rings */}
      <HubOrbitRing radius={13}  speed={0.08}  color="#00f0ff" />
      <HubOrbitRing radius={14.5} speed={-0.05} color="#a855f7" />
      <HubOrbitRing radius={16}  speed={0.03}  color="#22c55e" />

      {/* Central hub marker */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 8, 8]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.15} />
      </mesh>

      {/* "PREDATOR HUB" label */}
      <Text
        position={[0, 4.5, 0]}
        fontSize={0.5}
        color="#00f0ff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.3}
      >
        ANTIGRAVITY HUB
      </Text>
      <Text
        position={[0, 3.8, 0]}
        fontSize={0.22}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        Обери кімнату для аналізу
      </Text>

      {/* Room portals */}
      {ROOMS.map((room, i) => (
        <RoomPortal
          key={room.id}
          room={room}
          position={portalPositions[i]}
          index={i}
        />
      ))}
    </group>
  );
}
