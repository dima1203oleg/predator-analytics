"use client";

import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export function CommandConsole() {
  const { scene } = useGLTF("/models/command_console_draco.glb");
  const group = useRef<THREE.Group>(null);

  return (
    <group ref={group} position={[0, -4.0, 0]} scale={0.11} rotation={[0, Math.PI, 0]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/command_console_draco.glb");
