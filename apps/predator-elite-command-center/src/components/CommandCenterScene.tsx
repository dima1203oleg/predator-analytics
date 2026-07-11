'use client';

import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, Stars, Text, Float, Torus, Html } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { RoomEnvironment } from './models/RoomEnvironment';
import { PredatorHeadModel, EmotionState } from './models/PredatorHeadModel';
import { PredatorModel } from './models/PredatorModel';
import { BioMaskModel } from './models/BioMaskModel';
import { HologramGlobe } from './models/HologramGlobe';

interface CommandCenterSceneProps {
  emotion?: EmotionState;
  speakActive?: boolean;
  onPortalSelect?: (portalId: string, label: string) => void;
  lang?: 'uk' | 'en';
}

const EMOTION_COLORS: Record<EmotionState, string> = {
  NEUTRAL: '#00f3ff',
  ANALYTIC: '#0044ff',
  WARNING: '#ffaa00',
  POSITIVE: '#00ff66',
  AGGRESSIVE: '#ff003c',
};

const PORTALS_DATA = [
  { id: 'portal_command', labelUk: 'ЦЕНТР УПРАВЛІННЯ', labelEn: 'COMMAND CENTER', color: '#00f3ff', type: 'ingest' },
  { id: 'portal_simulation', labelUk: 'КІМНАТА СИМУЛЯЦІЙ', labelEn: 'SIMULATION ROOM', color: '#ffaa00', type: 'tornado' },
  { id: 'portal_twin', labelUk: 'ЦИФРОВИЙ ДВІЙНИК', labelEn: 'DIGITAL TWIN', color: '#a855f7', type: 'radar' },
  { id: 'portal_forecast', labelUk: 'ПРОГНОЗУВАННЯ', labelEn: 'FORECAST ENGINE', color: '#3b82f6', type: 'tornado' },
  { id: 'portal_osint', labelUk: 'OSINT РОЗВІДКА', labelEn: 'OSINT INTELLIGENCE', color: '#00ff66', type: 'ingest' },
  { id: 'portal_graph', labelUk: 'ГРАФ ЗВ\'ЯЗКІВ', labelEn: 'NETWORK GRAPH', color: '#eab308', type: 'graph' },
  { id: 'portal_risk', labelUk: 'АНАЛІЗ РИЗИКІВ', labelEn: 'RISK ANALYSIS', color: '#ef4444', type: 'radar' },
  { id: 'portal_docs', labelUk: 'ПОТОЧНІ ДОКУМЕНТИ', labelEn: 'LIVE DOCUMENTS', color: '#06b6d4', type: 'ingest' },
  { id: 'portal_knowledge', labelUk: 'ЯДРО ЗНАНЬ', labelEn: 'KNOWLEDGE CORE', color: '#ec4899', type: 'graph' },
  { id: 'portal_search', labelUk: 'ПОШУК ТА ВИБІРКА', labelEn: 'SEARCH & RETRIEVAL', color: '#10b981', type: 'tornado' }
];

function LoadingScreen() {
  return (
    <Html center>
      <div style={{ color: '#ff0033', fontSize: '24px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
        ІНІЦІАЛІЗАЦІЯ СИСТЕМИ PREDATOR...
      </div>
    </Html>
  );
}

function SceneLighting({ emotion }: { emotion: EmotionState }) {
  const color = EMOTION_COLORS[emotion];
  return (
    <>
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[5, 10, -5]} intensity={2.8} color="#ffffff" castShadow />
      <directionalLight position={[-5, 5, 5]} intensity={1.8} color={color} />
      <pointLight position={[0, 3, 0]} intensity={3.0} color={color} distance={15} decay={2} />
    </>
  );
}

interface HoloPortalProps {
  id: string;
  label: string;
  position: [number, number, number];
  color: string;
  onClick: () => void;
  type: string;
}

function HoloPortal({ id, label, position, color, onClick, type }: HoloPortalProps) {
  const [hovered, setHovered] = useState(false);
  const torusRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Group>(null);
  const targetScale = hovered ? 1.25 : 1.0;
  const currentScale = useRef(1.0);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  useFrame((state, delta) => {
    if (torusRef.current) {
      torusRef.current.rotation.z += delta * 0.5;
      torusRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * (hovered ? 1.8 : 0.6);
    }
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, delta * 8);
    if (torusRef.current) {
      torusRef.current.scale.setScalar(currentScale.current);
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Кільце порталу */}
      <Torus 
        ref={torusRef} 
        args={[0.42, 0.018, 12, 48]} 
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={hovered ? 0.95 : 0.45} 
          blending={THREE.AdditiveBlending}
          wireframe
        />
      </Torus>

      {/* Внутрішня геометрія порталу */}
      <group ref={innerRef}>
        {type === 'radar' && (
          <mesh>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.6} />
          </mesh>
        )}
        {type === 'tornado' && (
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.16, 0.38, 10, 1, true]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.7} />
          </mesh>
        )}
        {type === 'graph' && (
          <group>
            <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color={color} /></mesh>
            <mesh position={[-0.12, -0.08, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color={color} /></mesh>
            <mesh position={[0.12, -0.08, 0]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color={color} /></mesh>
          </group>
        )}
        {type === 'ingest' && (
          <mesh>
            <octahedronGeometry args={[0.18]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.75} />
          </mesh>
        )}
      </group>

      <Text 
        position={[0, -0.65, 0]} 
        fontSize={0.12} 
        color={hovered ? '#ffffff' : color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// Камера керується динамічно
interface CameraControllerProps {
  targetKey: string | null;
  getPortalPosition: (id: string) => [number, number, number] | null;
}

function CameraController({ targetKey, getPortalPosition }: CameraControllerProps) {
  const targetPos = useRef(new THREE.Vector3(0, 2, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.2, 0));

  useEffect(() => {
    if (targetKey === 'globe') {
      targetPos.current.set(0, 1.8, 2.5);
      targetLookAt.current.set(0, 1.2, 0.5);
    } else if (targetKey && targetKey.startsWith('portal_')) {
      const pos = getPortalPosition(targetKey);
      if (pos) {
        const pVec = new THREE.Vector3(...pos);
        const dir = new THREE.Vector3().subVectors(pVec, new THREE.Vector3(0, 1.2, 0)).normalize();
        
        const camPos = new THREE.Vector3().copy(pVec).sub(dir.multiplyScalar(1.2));
        camPos.y += 0.25;
        
        targetPos.current.copy(camPos);
        targetLookAt.current.copy(pVec);
      }
    } else {
      targetPos.current.set(0, 2, 8);
      targetLookAt.current.set(0, 1.2, 0);
    }
  }, [targetKey, getPortalPosition]);

  useFrame((state, delta) => {
    state.camera.position.lerp(targetPos.current, delta * 2.2);
    
    // Плавний поворот камери у бік цілі
    const currentLook = new THREE.Vector3(0, 1.2, 0);
    state.camera.lookAt(targetLookAt.current);
  });

  return null;
}

export function CommandCenterScene({ 
  emotion = 'NEUTRAL', 
  speakActive = false,
  onPortalSelect,
  lang = 'uk'
}: CommandCenterSceneProps) {
  const [cameraFocus, setCameraFocus] = useState<string | null>(null);

  // Радіус для напівкола порталів
  const portalRadius = 4.0;

  // Отримання позиції порталу за індексом
  const getPortalCoords = useCallback((index: number, total: number): [number, number, number] => {
    const angle = -Math.PI * 0.6 + (index / (total - 1)) * (Math.PI * 1.2);
    const x = Math.sin(angle) * portalRadius;
    const z = Math.cos(angle) * portalRadius + 0.4;
    const y = 1.35 + Math.sin(index * 1.5) * 0.08;
    return [x, y, z];
  }, [portalRadius]);

  const getPortalPositionById = useCallback((id: string): [number, number, number] | null => {
    const idx = PORTALS_DATA.findIndex(p => p.id === id);
    if (idx !== -1) {
      return getPortalCoords(idx, PORTALS_DATA.length);
    }
    return null;
  }, [getPortalCoords]);

  const handlePortalClick = (portalId: string, label: string) => {
    setCameraFocus(portalId);
    if (onPortalSelect) {
      setTimeout(() => onPortalSelect(portalId, label), 800);
    }
  };

  return (
    <div className="w-full h-screen bg-black relative">
      {cameraFocus && (
        <button 
          onClick={() => setCameraFocus(null)}
          className="absolute top-24 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-black/60 border border-red-500/40 text-red-500 text-xs font-mono tracking-widest uppercase hover:bg-red-950/40 hover:border-red-500 rounded transition-all duration-300 backdrop-blur-md"
        >
          {lang === 'uk' ? 'повернути камеру' : 'reset camera'}
        </button>
      )}

      <Canvas shadows gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
        
        <OrbitControls 
          enablePan={false} 
          enabled={!cameraFocus}
          maxPolarAngle={Math.PI / 2 + 0.05} 
          minDistance={3} 
          maxDistance={12} 
          target={[0, 1.2, 0]}
        />
        
        <color attach="background" args={['#000000']} />
        
        <Suspense fallback={<LoadingScreen />}>
          <SceneLighting emotion={emotion} />
          <CameraController targetKey={cameraFocus} getPortalPosition={getPortalPositionById} />
          
          <group position={[0, 0, 0]}>
            {/* Реалістичний Інтер'єр */}
            <RoomEnvironment position={[0, 0, 0]} />

            {/* Голографічний глобус над столом */}
            <group 
              position={[0, 1.5, 0.4]} 
              onClick={(e) => { e.stopPropagation(); setCameraFocus(cameraFocus === 'globe' ? null : 'globe'); }}
            >
              <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <HologramGlobe emotion={emotion} scale={1.5} />
              </Float>
            </group>

            {/* Біо-маска */}
            <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
              <BioMaskModel 
                position={[-1.6, 1.45, 0.3]} 
                scale={0.75} 
                rotation={[0, Math.PI / 4.5, 0]} 
                laserActive={emotion === 'AGGRESSIVE' || emotion === 'WARNING' || speakActive}
              />
            </Float>

            {/* Аватар (Повний ріст) Хижака */}
            <PredatorModel 
              position={[0, 0, -1.5]} 
              scale={1.0} 
              rotation={[0, 0, 0]} 
              emotion={emotion}
            />

            {/* Аватар (Голова) Хижака для розмов */}
            {speakActive && (
              <PredatorHeadModel 
                position={[1.5, 1.5, 1.0]} 
                scale={2.0} 
                rotation={[0, -Math.PI / 6, 0]} 
                emotion={emotion}
                speakActive={speakActive}
              />
            )}
            
            {/* 10 Порталів по напівколу */}
            {PORTALS_DATA.map((portal, idx) => {
              const pos = getPortalCoords(idx, PORTALS_DATA.length);
              const label = lang === 'uk' ? portal.labelUk : portal.labelEn;
              return (
                <HoloPortal 
                  key={portal.id}
                  id={portal.id}
                  label={label}
                  position={pos}
                  color={portal.color}
                  type={portal.type}
                  onClick={() => handlePortalClick(portal.id, label)}
                />
              );
            })}
          </group>

          <Environment preset="city" />

          <EffectComposer>
            <Bloom 
              luminanceThreshold={0.25} 
              luminanceSmoothing={0.8} 
              intensity={1.2} 
              mipmapBlur 
            />
            <ChromaticAberration 
              blendFunction={BlendFunction.NORMAL} 
              offset={new THREE.Vector2(0.0012, 0.0012)} 
            />
            <Noise opacity={0.015} />
            <Vignette eskil={false} offset={0.12} darkness={1.15} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
