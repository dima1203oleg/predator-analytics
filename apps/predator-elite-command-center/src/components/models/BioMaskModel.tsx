'use client';

import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { Group, Mesh, AdditiveBlending, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface BioMaskModelProps {
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  laserActive?: boolean;
}

export function BioMaskModel({ laserActive = true, ...props }: BioMaskModelProps) {
  const { scene } = useGLTF('/models/bio_mask.glb');
  const group = useRef<Group>(null);
  const laserGroupRef = useRef<Group>(null);

  useFrame((state) => {
    // 1. Ефект левітування маски (плавна синусоїда)
    if (group.current) {
      const elapsed = state.clock.getElapsedTime();
      group.current.position.y = (props.position?.[1] || 0) + Math.sin(elapsed * 1.5) * 0.08;
      group.current.rotation.y = (props.rotation?.[1] || 0) + Math.cos(elapsed * 0.8) * 0.05;
      group.current.rotation.x = (props.rotation?.[0] || 0) + Math.sin(elapsed * 0.5) * 0.03;
    }

    // 2. Скануючий рух лазерного прицілу
    if (laserGroupRef.current && laserActive) {
      const elapsed = state.clock.getElapsedTime();
      // Легке похитування лазерної сітки
      laserGroupRef.current.rotation.x = Math.sin(elapsed * 2.5) * 0.08;
      laserGroupRef.current.rotation.y = Math.cos(elapsed * 1.8) * 0.08;
    }
  });

  // Лазерні точки: 3 червоні промені, що розходяться у формі трикутника
  const laserTargets = [
    new Vector3(-0.05, -0.05, -3.5),
    new Vector3(0.05, -0.05, -3.5),
    new Vector3(0, 0.05, -3.5)
  ];

  return (
    <group ref={group} {...props} dispose={null}>
      {/* 3D модель маски */}
      <primitive object={scene} />

      {/* Лазерна система сканування (Тріо червоних променів) */}
      {laserActive && (
        <group ref={laserGroupRef} position={[0.22, 0.18, 0.15]}>
          {laserTargets.map((target, idx) => {
            // Розрахуємо довжину і напрямок для циліндра-лазера
            const origin = new Vector3(0, 0, 0);
            const dir = new Vector3().subVectors(target, origin);
            const len = dir.length();
            const pos = new Vector3().addVectors(origin, target).multiplyScalar(0.5);
            
            // Напрямок для орієнтації циліндра уздовж вектора
            const alignRotation = [
              Math.PI / 2, 
              0, 
              Math.atan2(dir.y, dir.x)
            ] as [number, number, number];

            return (
              <group key={idx}>
                {/* Сам лазерний промінь */}
                <mesh position={[target.x / 2, target.y / 2, target.z / 2]} rotation={[Math.atan2(dir.y, Math.sqrt(dir.x*dir.x + dir.z*dir.z)), -Math.atan2(dir.x, dir.z), 0]}>
                  <cylinderGeometry args={[0.003, 0.006, len, 6]} />
                  <meshBasicMaterial 
                    color="#ff0000" 
                    transparent={true} 
                    opacity={0.85} 
                    blending={AdditiveBlending}
                  />
                </mesh>

                {/* Точка контакту лазера (підсвічування в кінці променя) */}
                <mesh position={target}>
                  <sphereGeometry args={[0.02, 8, 8]} />
                  <meshBasicMaterial 
                    color="#ff0000" 
                    transparent={true} 
                    opacity={0.9} 
                    blending={AdditiveBlending}
                  />
                  <pointLight color="#ff0000" intensity={0.8} distance={0.5} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}

useGLTF.preload('/models/bio_mask.glb');
