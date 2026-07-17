/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PREDATOR Command Center — Quantum Cursor
 *
 * 3D курсор з ефектом trail (хвіст) та динамічним світлом.
 * Реагує на фокус вузлів та інтегрується в сцену замість системного.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useRef, useMemo, memo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCommandStore } from '../store/useCommandStore';

const PARTICLE_COUNT = 15;

function QuantumCursorInner() {
  const { mouse, camera, gl } = useThree();
  const lightRef = useRef<THREE.PointLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.InstancedMesh>(null);

  const focusedNodeId = useCommandStore((s) => s.focusedNodeId);

  // Ховаємо системний курсор на Canvas
  useEffect(() => {
    gl.domElement.style.cursor = 'none';
    return () => {
      gl.domElement.style.cursor = 'auto';
    };
  }, [gl]);

  // Стан для хвоста
  const trailPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    // Отримуємо 3D позицію курсора на Z=0
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    
    // Щоб курсор не стрибав, коли камера рухається, проектуємо його на площину Z=0
    // Якщо камера дуже близько (напр. Z=2), то cursor буде перед графом
    const planeZ = 5; // Позиція площини для курсора
    const distance = (planeZ - camera.position.z) / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    if (meshRef.current) {
      meshRef.current.position.lerp(pos, 0.4);
      
      // Анімація обертання та зміни розміру при фокусі
      meshRef.current.rotation.z += 0.05;
      const targetScale = focusedNodeId ? 1.5 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (lightRef.current) {
      lightRef.current.position.lerp(pos, 0.4);
      lightRef.current.intensity = focusedNodeId ? 3 : 1;
    }

    // Оновлення хвоста
    if (trailRef.current && meshRef.current) {
      // Зміщуємо всі позиції назад
      for (let i = PARTICLE_COUNT - 1; i > 0; i--) {
        trailPositions[i * 3] = trailPositions[(i - 1) * 3];
        trailPositions[i * 3 + 1] = trailPositions[(i - 1) * 3 + 1];
        trailPositions[i * 3 + 2] = trailPositions[(i - 1) * 3 + 2];
      }
      // Додаємо поточну
      trailPositions[0] = meshRef.current.position.x;
      trailPositions[1] = meshRef.current.position.y;
      trailPositions[2] = meshRef.current.position.z;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        dummy.position.set(
          trailPositions[i * 3],
          trailPositions[i * 3 + 1],
          trailPositions[i * 3 + 2]
        );
        dummy.scale.setScalar(Math.max(0, 1 - Math.pow(i / PARTICLE_COUNT, 0.5)));
        
        // Ротація частинок
        dummy.rotation.z = meshRef.current.rotation.z - i * 0.1;
        dummy.updateMatrix();
        trailRef.current.setMatrixAt(i, dummy.matrix);
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} color="#00f0ff" distance={5} intensity={1} />
      
      <mesh ref={meshRef}>
        <ringGeometry args={[0.08, 0.12, 16]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      <instancedMesh ref={trailRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <planeGeometry args={[0.06, 0.06]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.3} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

export const QuantumCursor = memo(QuantumCursorInner);
