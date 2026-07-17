"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

export function HunterAvatar() {
  // Load the Jungle Hunter Predator model
  const { scene, animations } = useGLTF("/models/jungle_hunter_predator_draco.glb");
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play the first animation if it exists (usually Idle)
    if (actions && Object.keys(actions).length > 0) {
      const firstActionKey = Object.keys(actions)[0];
      actions[firstActionKey]?.play();
    }
  }, [actions]);

  useFrame((state) => {
    if (group.current) {
      // Gentle breathing animation relative to its children
      group.current.children[0].position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    }
  });

  return (
    <group ref={group} position={[0, -4.0, -1.2]} scale={0.13} rotation={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/jungle_hunter_predator_draco.glb");
