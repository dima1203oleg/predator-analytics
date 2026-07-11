"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

export function FlyingShips() {
  const shipsRef = useRef<THREE.InstancedMesh>(null);
  
  const shipCount = 15;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Initialize random positions and speeds for ships
  const shipsData = useMemo(() => {
    return Array.from({ length: shipCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        Math.random() * 10 + 2,
        (Math.random() - 0.5) * 40 - 20
      ),
      speed: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2,
    }));
  }, [shipCount]);

  useFrame((state, delta) => {
    if (shipsRef.current) {
      shipsData.forEach((ship, i) => {
        // Move ship
        ship.position.x += Math.sin(ship.angle) * ship.speed * delta;
        ship.position.z += Math.cos(ship.angle) * ship.speed * delta;

        // Wrap around if too far
        if (ship.position.x > 30) ship.position.x = -30;
        if (ship.position.x < -30) ship.position.x = 30;
        if (ship.position.z > 10) ship.position.z = -50;
        if (ship.position.z < -50) ship.position.z = 10;

        dummy.position.copy(ship.position);
        dummy.rotation.y = ship.angle;
        dummy.scale.set(0.2, 0.1, 0.4);
        dummy.updateMatrix();
        shipsRef.current!.setMatrixAt(i, dummy.matrix);
      });
      shipsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={shipsRef} args={[undefined, undefined, shipCount]}>
      <boxGeometry args={[1, 1, 2]} />
      <meshStandardMaterial color="#222" emissive="#38BDF8" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
