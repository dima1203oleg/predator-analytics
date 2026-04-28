import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Кастомні OSINT-Локації (Широта, Довгота) -> переведені в 3D координати
const OFFSHORE_NODES = [
  { name: 'Кіпр', lat: 35.1, lng: 33.3, color: '#10b981' },
  { name: 'Панама', lat: 8.9, lng: -79.5, color: '#e11d48' },
  { name: 'Лондон', lat: 51.5, lng: -0.1, color: '#6366f1' },
  { name: 'Британські Віргінські Острови', lat: 18.4, lng: -64.6, color: '#fbbf24' },
];
const UKRAINE_NODE = { lat: 48.3, lng: 31.1, color: '#3b82f6' };

const RADIUS = 2; // � адіус глобуса

function getCoordinates(lat: number, lng: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(RADIUS * Math.sin(phi) * Math.cos(theta));
  const y = RADIUS * Math.cos(phi);
  const z = RADIUS * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

function TransactionArc({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) {
  // Проста дуга: піднімаємо середню точку вище над глобусом
  const midPoint = new THREE.Vector3(
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2
  ).normalize().multiplyScalar(RADIUS + 0.5);

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...start),
    midPoint,
    new THREE.Vector3(...end)
  );
  
  const points = curve.getPoints(30);
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      dashed={true}
      dashScale={5}
      dashSize={0.5}
      transparent
      opacity={0.8}
    />
  );
}

function GlobeBase() {
  const globeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = state.clock.getElapsedTime() * 0.05; // Повільне обертання
    }
  });

  const ukrCoords = getCoordinates(UKRAINE_NODE.lat, UKRAINE_NODE.lng);

  return (
    <group ref={globeRef}>
      {/* 1. Внутрішнє свічення та прозоре ядро */}
      <Sphere args={[RADIUS, 64, 64]}>
        <meshPhongMaterial 
          color="#010204"
          emissive="#1e1b4b"
          emissiveIntensity={0.5}
          transparent
          opacity={0.9}
        />
      </Sphere>
      
      {/* 2. Кібер-сітка (Wireframe) навколо глобуса */}
      <Sphere args={[RADIUS * 1.01, 32, 32]}>
        <meshBasicMaterial 
          color="#4338ca"
          wireframe
          transparent
          opacity={0.15}
        />
      </Sphere>

      {/* 3. Головна точка - Україна */}
      <mesh position={ukrCoords}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={UKRAINE_NODE.color} />
      </mesh>
      {/* Пульсуючий ореол навколо України */}
      <mesh position={ukrCoords}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={UKRAINE_NODE.color} transparent opacity={0.3} />
      </mesh>

      {/* 4. Офшорні вузли та дуги транзакцій */}
      {OFFSHORE_NODES.map((node, i) => {
        const coords = getCoordinates(node.lat, node.lng);
        return (
          <group key={i}>
            {/* Точка офшорної зони */}
            <mesh position={coords}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color={node.color} />
            </mesh>
            
            {/* Анімована дуга від України до Офшору */}
            <TransactionArc start={ukrCoords} end={coords} color={node.color} />
          </group>
        );
      })}
    </group>
  );
}

import { Canvas } from '@react-three/fiber';

export function CyberGlobe() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', backgroundColor: 'transparent' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#6366f1" />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <GlobeBase />
      </Canvas>
    </div>
  );
}

export default CyberGlobe;
