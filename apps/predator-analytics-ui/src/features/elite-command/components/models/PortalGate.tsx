/* ─────────────────────────────────────────────────────────
 * 🌀 PortalGate — реальна 3D sci-fi арка порталу
 * Використовує модель portal_gateway.glb (9 МБ)
 * Матеріали: outer_box, walkway, portal_shell
 * ───────────────────────────────────────────────────────── */
'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text } from '@react-three/drei';
import { Group, Mesh, MeshStandardMaterial, Color, AdditiveBlending, Vector2 } from 'three';
import * as THREE from 'three';

interface PortalGateProps {
  id: string;
  label: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  scale?: number;
  onClick: () => void;
  type?: string;
  modelPath?: string;
}

export function PortalGate({
  id,
  label,
  position,
  rotation = [0, 0, 0],
  color,
  scale = 1.0,
  onClick,
  type = 'ingest',
  modelPath = '/models/portal_gateway.glb',
}: PortalGateProps) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<Group>(null);
  const innerRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<Mesh>(null);
  const portalScene = useRef<THREE.Object3D | null>(null);

  // Клонуємо сцену — щоб кожен портал мав власні матеріали
  useEffect(() => {
    portalScene.current = scene.clone(true);

    // Кастомізуємо матеріали порталу під колір модуля
    portalScene.current.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((mat) => {
          if (mat instanceof MeshStandardMaterial) {
            const cloned = mat.clone();
            const name = cloned.name.toLowerCase();

            if (name.includes('portal_shell') || name.includes('outer_box')) {
              // Зовнішня рамка — темний метал з кольоровим відтінком
              cloned.color = new Color(color).multiplyScalar(0.08);
              cloned.roughness = 0.2;
              cloned.metalness = 0.95;
              cloned.emissive = new Color(color);
              cloned.emissiveIntensity = 0.4;
            } else if (name.includes('walkway')) {
              // Доріжка — темний матеріал з підсвіткою підлоги
              cloned.color = new Color('#050510');
              cloned.roughness = 0.3;
              cloned.metalness = 0.8;
              cloned.emissive = new Color(color);
              cloned.emissiveIntensity = 0.15;
            } else {
              // Решта — підсилення свічення
              cloned.emissive = new Color(color);
              cloned.emissiveIntensity = hovered ? 2.5 : 1.2;
            }

            mesh.material = cloned;
          }
        });
      }
    });
  }, [scene, color]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hovered]);

  // Анімація: гравітаційне свічення порталу
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    // Легке покачування порталу
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.4 + position[0]) * 0.04;
    }

    // Пульсація внутрішнього гравітаційного кола
    if (glowRef.current) {
      const pulse = 0.85 + Math.sin(t * 2.2) * 0.15;
      glowRef.current.scale.setScalar(hovered ? pulse * 1.3 : pulse);
      (glowRef.current.material as MeshStandardMaterial).emissiveIntensity = hovered
        ? 4.5 + Math.sin(t * 3) * 1.5
        : 2.0 + Math.sin(t * 2) * 0.8;
    }
  });

  const colorObj = new Color(color);

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Реальна 3D модель порталу */}
      <group ref={groupRef} scale={scale}>
        {portalScene.current && (
          <primitive object={portalScene.current} />
        )}

        {/* Внутрішній диск гравітаційного ефекту */}
        <mesh ref={glowRef} position={[0, 1.1, 0]}>
          <circleGeometry args={[0.55, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.5}
            transparent
            opacity={hovered ? 0.55 : 0.35}
            side={THREE.DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Внутрішні частки для типу модуля */}
        <group position={[0, 1.1, 0.02]}>
          {type === 'radar' && (
            <mesh>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
            </mesh>
          )}
          {type === 'tornado' && (
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.18, 0.42, 10, 1, true]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
            </mesh>
          )}
          {type === 'graph' && (
            <group>
              {[
                [0, 0.15, 0], [-0.14, -0.09, 0], [0.14, -0.09, 0]
              ].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}>
                  <sphereGeometry args={[0.055, 8, 8]} />
                  <meshBasicMaterial color={color} />
                </mesh>
              ))}
            </group>
          )}
          {type === 'ingest' && (
            <mesh>
              <octahedronGeometry args={[0.2]} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.7} />
            </mesh>
          )}
        </group>

        {/* Точкове джерело світла всередині порталу */}
        <pointLight
          position={[0, 1.1, 0.3]}
          intensity={hovered ? 8 : 3}
          color={color}
          distance={3.5}
          decay={2}
        />
      </group>

      {/* Мітка модуля */}
      <Text
        position={[0, -0.25, 0]}
        fontSize={0.11}
        color={hovered ? '#ffffff' : color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#000000"
        font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff"
      >
        {label}
      </Text>

      {/* Кільце-основа під порталом */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.42, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.6 : 0.25}
          side={THREE.DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/models/portal_gateway.glb');
useGLTF.preload('/models/portal_gate.glb');
useGLTF.preload('/models/portal_gate_3.glb');
