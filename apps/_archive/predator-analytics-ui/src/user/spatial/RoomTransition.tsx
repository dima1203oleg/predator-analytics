/**
 * ═══════════════════════════════════════════════════════════════════
 * RoomTransition — Animated camera "fly-through" between rooms
 *
 * When user clicks a portal:
 *   1. Camera zooms toward the portal (entering)
 *   2. Scene cross-fades to room content (active)
 *   3. On return — camera pulls back to hub (exiting)
 * ═══════════════════════════════════════════════════════════════════
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRoomStore, ROOMS, type RoomId } from '../stores/roomStore';

// Target camera positions for each room
const ROOM_CAMERA_TARGETS: Partial<Record<RoomId, { position: THREE.Vector3; lookAt: THREE.Vector3 }>> = {
  simulation:    { position: new THREE.Vector3(0, 3, 8),   lookAt: new THREE.Vector3(0, 1, 0) },
  twin:          { position: new THREE.Vector3(0, 2.5, 6), lookAt: new THREE.Vector3(0, 1.5, 0) },
  graph:         { position: new THREE.Vector3(0, 6, 14),  lookAt: new THREE.Vector3(0, 0, 0) },
  osint:         { position: new THREE.Vector3(0, 3, 8),   lookAt: new THREE.Vector3(0, 1, 0) },
  intake:        { position: new THREE.Vector3(0, 4, 10),  lookAt: new THREE.Vector3(0, 0, 0) },
  forecast:      { position: new THREE.Vector3(0, 3, 8),   lookAt: new THREE.Vector3(0, 1, 0) },
  investigation: { position: new THREE.Vector3(0, 2, 7),   lookAt: new THREE.Vector3(0, 1, 0) },
  anomaly:       { position: new THREE.Vector3(0, 4, 10),  lookAt: new THREE.Vector3(0, 0, 0) },
  risk:          { position: new THREE.Vector3(0, 3, 8),   lookAt: new THREE.Vector3(0, 1, 0) },
  market:        { position: new THREE.Vector3(0, 3, 8),   lookAt: new THREE.Vector3(0, 1, 0) },
};

const HUB_CAMERA = {
  position: new THREE.Vector3(0, 4, 12),
  lookAt: new THREE.Vector3(0, 0, 0),
};

export function RoomTransition() {
  const { camera } = useThree();
  const activeRoom = useRoomStore((s) => s.activeRoom);
  const transitionPhase = useRoomStore((s) => s.transitionPhase);
  const transitionTarget = useRoomStore((s) => s.transitionTarget);
  const completeTransition = useRoomStore((s) => s.completeTransition);

  const targetPos = useRef(new THREE.Vector3().copy(HUB_CAMERA.position));
  const targetLook = useRef(new THREE.Vector3().copy(HUB_CAMERA.lookAt));
  const currentLook = useRef(new THREE.Vector3().copy(HUB_CAMERA.lookAt));

  // When entering a room — fly camera toward portal first
  useEffect(() => {
    if (transitionPhase === 'entering' && transitionTarget) {
      const roomDef = ROOMS.find((r) => r.id === transitionTarget);
      if (roomDef) {
        // Fly toward the portal position first
        const portalX = Math.cos(roomDef.angle) * roomDef.radius;
        const portalZ = Math.sin(roomDef.angle) * roomDef.radius;
        targetPos.current.set(portalX * 0.5, 3, portalZ * 0.5);
        targetLook.current.set(portalX, 0, portalZ);
      }
    }
  }, [transitionPhase, transitionTarget]);

  // When room becomes active — set final camera position
  useEffect(() => {
    if (transitionPhase === 'active' && activeRoom !== 'hub') {
      const cam = ROOM_CAMERA_TARGETS[activeRoom];
      if (cam) {
        targetPos.current.copy(cam.position);
        targetLook.current.copy(cam.lookAt);
      }
    }
  }, [transitionPhase, activeRoom]);

  // When exiting back to hub
  useEffect(() => {
    if (transitionPhase === 'exiting') {
      targetPos.current.copy(HUB_CAMERA.position);
      targetLook.current.copy(HUB_CAMERA.lookAt);
    }
  }, [transitionPhase]);

  // When hub is re-entered — reset camera
  useEffect(() => {
    if (activeRoom === 'hub' && transitionPhase === 'idle') {
      targetPos.current.copy(HUB_CAMERA.position);
      targetLook.current.copy(HUB_CAMERA.lookAt);
    }
  }, [activeRoom, transitionPhase]);

  useFrame(() => {
    const speed = transitionPhase === 'idle' ? 0.02 : 0.05;

    // Smoothly interpolate camera position
    camera.position.lerp(targetPos.current, speed);

    // Smoothly interpolate lookAt target
    currentLook.current.lerp(targetLook.current, speed);
    camera.lookAt(currentLook.current);

    // Auto-complete transition when close enough
    if (transitionPhase === 'active' || transitionPhase === 'exiting') {
      const dist = camera.position.distanceTo(targetPos.current);
      if (dist < 0.1) {
        completeTransition();
      }
    }
  });

  return null;
}
