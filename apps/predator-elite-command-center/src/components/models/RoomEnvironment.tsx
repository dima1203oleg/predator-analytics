'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import { Group, Mesh, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

interface RoomEnvironmentProps {
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
}

export function RoomEnvironment(props: RoomEnvironmentProps) {
  const roomGroup = useRef<Group>(null);
  const shipsGroup = useRef<Group>(null);
  
  const { scene: commandCenter } = useGLTF('/models/new_command_center.glb');
  const { scene: spaceLandscape } = useGLTF('/models/new_space_landscape.glb');
  const { scene: flyingShips } = useGLTF('/models/flying_ships.glb');

  // Fix materials if they are too dark
  useEffect(() => {
    [commandCenter, spaceLandscape, flyingShips].forEach(scene => {
      scene.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          if (mesh.material instanceof MeshStandardMaterial) {
            // Adjust materials if necessary
            mesh.material.envMapIntensity = 1.5;
          }
        }
      });
    });
  }, [commandCenter, spaceLandscape, flyingShips]);

  useFrame((state, delta) => {
    // Animate flying ships slightly if they don't have built-in animations
    if (shipsGroup.current) {
      // Just a slow rotation as placeholder for flying ships
      // If the model has built-in animations, we could use useAnimations instead.
      shipsGroup.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group {...props} dispose={null}>
      {/* The main interior bridge */}
      <group ref={roomGroup}>
        <primitive object={commandCenter} />
      </group>

      {/* The exterior space landscape */}
      <group scale={0.1} position={[0, -5, -40]}>
        <primitive object={spaceLandscape} />
      </group>

      {/* The animated flying ships (scaled down to look like a distant ship) */}
      <group ref={shipsGroup} scale={0.02} position={[-20, 5, -50]}>
        <primitive object={flyingShips} />
      </group>
    </group>
  );
}

useGLTF.preload('/models/new_command_center.glb');
useGLTF.preload('/models/new_space_landscape.glb');
useGLTF.preload('/models/flying_ships.glb');
