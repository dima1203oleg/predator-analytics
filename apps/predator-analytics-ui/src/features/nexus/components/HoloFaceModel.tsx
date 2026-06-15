import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { useAppStore } from "../../../store/useAppStore";

// Типізація GLTF структури нашої нейро-маски
type GLTFResult = GLTF & {
  nodes: {
    Mesh_Head_Placeholder: THREE.Mesh;
    // Fallback names in case the model is different
    [key: string]: THREE.Object3D;
  };
  materials: {
    [key: string]: THREE.Material;
  };
};

interface HoloFaceModelProps {
  audioAnalyser: AnalyserNode | null;
  systemStatus: "HEALTHY" | "RISK";
}

export const HoloFaceModel: React.FC<HoloFaceModelProps> = ({ audioAnalyser, systemStatus }) => {
  // Завантаження placeholder геометрії голови з локального репозиторію
  const { nodes } = useGLTF("/models/head.glb") as unknown as GLTFResult;
  
  const groupRef = useRef<THREE.Group>(null);
  const gearTopRef = useRef<THREE.Mesh>(null);
  const gearBottomRef = useRef<THREE.Mesh>(null);
  
  const { size, mouse } = useThree();
  const dataArray = useRef(new Uint8Array(0));

  const activeColor = systemStatus === "RISK" ? "#bd00ff" : "#00f5ff";

  // Створення єдиного кастомного голографічного матеріалу
  const holoMaterial = useRef(
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(activeColor),
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    })
  );

  // Оновлення кольору матеріалу при зміні статусу системи
  useEffect(() => {
    holoMaterial.current.color.set(activeColor);
  }, [activeColor]);

  useEffect(() => {
    if (audioAnalyser) {
      dataArray.current = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
  }, [audioAnalyser]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (groupRef.current) {
      // 1. Idle-Анімація: Легка левітація (плавання у просторі)
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.05;

      // 2. Ефект Perspective Parallax: Обличчя плавно повертається за курсором миші
      const targetX = (mouse.x * size.width) / size.width * 0.3;
      const targetY = (mouse.y * size.height) / size.height * 0.2;
      
      groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.1;
      groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.1;
    }

    // 3. Обертання технологічних 3D-шестерень над головою відповідно до навантаження
    if (gearTopRef.current) gearTopRef.current.rotation.y = t * 0.5;
    if (gearBottomRef.current) gearBottomRef.current.rotation.y = -t * 0.8;

    // 4. Реалізація Real-Time Lip-Sync або Імітації для нативного TTS
    const headMesh = nodes.Mesh_Head_Placeholder || Object.values(nodes).find(n => n.type === 'Mesh' || n.type === 'SkinnedMesh') as THREE.Mesh;
    
    if (headMesh && headMesh.morphTargetInfluences) {
      if (audioAnalyser && dataArray.current.length > 0) {
        audioAnalyser.getByteFrequencyData(dataArray.current);
        
        // Обчислення середньої амплітуди звукової хвилі (гучності)
        let sum = 0;
        for (let i = 0; i < dataArray.current.length; i++) {
          sum += dataArray.current[i];
        }
        const averageVolume = sum / dataArray.current.length;
        const normalizedVolume = averageVolume / 128.0; // Нормалізація в діапазон 0.0 - 1.0

        // Індекс 0 за замовчуванням береться як індекс руху щелепи
        headMesh.morphTargetInfluences[0] = normalizedVolume * 1.5;
      } else {
        // Фоллбек для нативного SpeechSynthesis (де немає доступу до AudioNode)
        const isSpeaking = useAppStore.getState().aiState.isSpeaking;
        if (isSpeaking) {
          // Симуляція артикуляції
          const fakeVolume = Math.sin(t * 15) * 0.3 + Math.sin(t * 25) * 0.2 + 0.3;
          headMesh.morphTargetInfluences[0] = Math.max(0, fakeVolume);
        } else {
          // Плавне закриття рота
          headMesh.morphTargetInfluences[0] += (0 - headMesh.morphTargetInfluences[0]) * 0.2;
        }
      }
    }
  });

  // Знайти головний меш, якщо він називається інакше
  const headMesh = nodes.Mesh_Head_Placeholder || Object.values(nodes).find(n => n.type === 'Mesh' || n.type === 'SkinnedMesh') as THREE.Mesh;

  return (
    <group ref={groupRef}>
      {/* Декоративні голографічні шестерні когнітивного процесу */}
      <mesh ref={gearTopRef} position={[0, 1.1, 0]}>
        <torusGeometry args={[0.4, 0.02, 8, 24]} />
        <primitive object={holoMaterial.current} attach="material" />
      </mesh>
      <mesh ref={gearBottomRef} position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.3, 6]} />
        <primitive object={holoMaterial.current} attach="material" />
      </mesh>

      {/* Головний меш кібер-обличчя */}
      {headMesh && (
        <mesh 
          geometry={headMesh.geometry} 
          material={holoMaterial.current}
          castShadow
          receiveShadow
        />
      )}
    </group>
  );
};

// Попереднє завантаження ассету в кеш Drei для усунення затримок рендерингу
useGLTF.preload("/models/head.glb");
