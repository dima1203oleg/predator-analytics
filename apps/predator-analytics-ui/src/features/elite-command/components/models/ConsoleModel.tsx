'use client';

import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { Group } from 'three';

export function ConsoleModel(props: any) {
  const { scene } = useGLTF('/models/command_console_draco.glb');
  const group = useRef<Group>(null);

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/command_console_draco.glb');
