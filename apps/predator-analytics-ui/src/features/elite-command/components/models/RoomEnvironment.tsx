/* ─────────────────────────────────────────────────────────
 * 🏛️ RoomEnvironment — sci-fi фонова кімната командного центру
 * Завантажує scifi_room.glb та spaceship_bridge.glb як оточення.
 * ───────────────────────────────────────────────────────── */
'use client';

import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { Group, Mesh, MeshStandardMaterial, Color } from 'three';

interface RoomEnvironmentProps {
  // Режим: 'room' — sci-fi кімната (маленька, навколо столу)
  //        'bridge' — місток космічного корабля (великий зал)
  variant?: 'room' | 'bridge';
}

// Sci-Fi Control Room (низько полігональна фонова кімната)
export function ScifiRoom(props: any) {
  const { scene } = useGLTF('/models/scifi_room.glb');
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        mesh.receiveShadow = true;
        mesh.castShadow = false;
        // Додаємо легке блакитне забарвлення для sci-fi атмосфери
        if (mesh.material && (mesh.material as MeshStandardMaterial).color) {
          const mat = (mesh.material as MeshStandardMaterial).clone();
          mat.emissive = new Color('#001122');
          mat.emissiveIntensity = 0.15;
          mesh.material = mat;
        }
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/scifi_room.glb');

// Space Landscape (пейзажі космосу за вікном)
export function SpaceshipBridge(props: any) {
  const { scene } = useGLTF('/models/spaceship_bridge_hq.glb');
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        mesh.receiveShadow = true;
        mesh.castShadow = false;
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/spaceship_bridge_hq.glb');

// Main Command Center (Сам командний центр)
export function GalacticBridge(props: any) {
  const { scene } = useGLTF('/models/scifi_control_room_hq.glb');
  const groupRef = useRef<Group>(null);

  const customizedRoom = useEffect(() => {
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          
          materials.forEach((mat) => {
            if (mat instanceof MeshStandardMaterial) {
              const name = mat.name.toLowerCase();
              
              // Boost emissive for existing glow materials to create cinematic bloom
              if (name.includes("blue_glow")) {
                mat.color.set("#00f0ff");
                mat.emissive.set("#00aaff");
                mat.emissiveIntensity = 10.0;
              } else if (name.includes("orange_glow")) {
                mat.color.set("#ff4400");
                mat.emissive.set("#ff2200");
                mat.emissiveIntensity = 12.0;
              } else if (name.includes("green_glow")) {
                mat.color.set("#00ff66");
                mat.emissive.set("#00bb44");
                mat.emissiveIntensity = 10.0;
              } else if (name.includes("white_glow")) {
                mat.color.set("#ffffff");
                mat.emissive.set("#aaccff");
                mat.emissiveIntensity = 6.0;
              } else if (name.includes("tube")) {
                mat.color.set("#0077ff");
                mat.emissive.set("#0044cc");
                mat.emissiveIntensity = 8.0;
              } else if (name.includes("metal")) {
                // Cyberpunk / Sci-fi dark metallic steel with blue-purple shades
                mat.color.set("#0e111a");
                mat.roughness = 0.25;
                mat.metalness = 0.95;
              } else if (name.includes("material.001")) {
                // Carbon fiber / obsidian panels
                mat.color.set("#06070a");
                mat.roughness = 0.15;
                mat.metalness = 0.9;
              } else if (name.includes("railing")) {
                mat.color.set("#1f212d");
                mat.roughness = 0.2;
                mat.metalness = 0.95;
              } else {
                // General glow boost
                if (mat.emissive && (mat.emissive.r > 0 || mat.emissive.g > 0 || mat.emissive.b > 0)) {
                  mat.emissiveIntensity = Math.max(mat.emissiveIntensity * 3.0, 5.0);
                }
              }
            }
          });
        }
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/scifi_control_room_hq.glb');

// Flying Ships (кораблі що літають за вікном в космосі)
export function ShipInterior(props: any) {
  const { scene } = useGLTF('/models/ship_interior_hq.glb');
  const groupRef = useRef<Group>(null);

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as Mesh).isMesh) {
        const mesh = obj as Mesh;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload('/models/ship_interior_hq.glb');
