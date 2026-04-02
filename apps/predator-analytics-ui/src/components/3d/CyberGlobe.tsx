import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';

// --- MATH UTILS ---
const RADIUS = 5;

function getCoordinates(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function createArc(lat1: number, lng1: number, lat2: number, lng2: number) {
  const start = getCoordinates(lat1, lng1, RADIUS);
  const end = getCoordinates(lat2, lng2, RADIUS);
  
  const distance = start.distanceTo(end);
  const midPoint = start.clone().lerp(end, 0.5);
  // Elevate the midpoint to create an arc
  midPoint.normalize().multiplyScalar(RADIUS + distance * 0.3);

  const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
  return curve.getPoints(50);
}

// --- DATA ---
// Ukraine coords roughly: Lat 48.3794, Lng 31.1656
const SOURCE = { lat: 48.3794, lng: 31.1656 };

const TARGETS = [
  { name: 'Cyprus', lat: 35.1264, lng: 33.4299, color: '#e11d48' },
  { name: 'Panama', lat: 8.5380, lng: -80.7821, color: '#e11d48' },
  { name: 'BVI', lat: 18.4207, lng: -64.6399, color: '#e11d48' },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, color: '#f59e0b' },
  { name: 'London', lat: 51.5074, lng: -0.1278, color: '#f59e0b' },
];

// --- SUBCOMPONENTS ---

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001; // Slowly rotate the earth
    }
  });

  return (
    <group ref={globeRef}>
      {/* Core Sphere */}
      <Sphere args={[RADIUS, 64, 64]}>
        <meshStandardMaterial 
          color="#0f172a" 
          transparent={true} 
          opacity={0.8} 
          wireframe={false} 
          roughness={0.8}
          metalness={0.2}
        />
      </Sphere>

      {/* Wireframe Overlay to make it look "Cyber" */}
      <Sphere args={[RADIUS * 1.01, 32, 32]}>
        <meshBasicMaterial 
          color="#4338ca" 
          wireframe={true} 
          transparent={true} 
          opacity={0.15} 
        />
      </Sphere>

      {/* Origin Point (Ukraine) */}
      <mesh position={getCoordinates(SOURCE.lat, SOURCE.lng, RADIUS * 1.02)}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Target Points and Arcs */}
      {TARGETS.map((target, idx) => {
        const points = useMemo(() => createArc(SOURCE.lat, SOURCE.lng, target.lat, target.lng), [target.lat, target.lng]);
        const targetPos = getCoordinates(target.lat, target.lng, RADIUS * 1.02);
        
        return (
          <React.Fragment key={idx}>
            {/* The Arc */}
            <Line
              points={points}
              color={target.color}
              lineWidth={2}
              transparent
              opacity={0.6}
            />
            {/* The Destination Pin */}
            <mesh position={targetPos}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshBasicMaterial color={target.color} />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
}

// --- MAIN EXPORT ---
export default function CyberGlobe() {
  return (
    <div className="w-full h-full relative cursor-move">
      <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#6366f1" />
        <pointLight position={[-10, 10, -10]} intensity={1} color="#e11d48" />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <Globe />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      {/* Decorative Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="text-[10px] uppercase font-mono text-indigo-400 tracking-widest bg-slate-900/50 px-2 py-1 rounded border border-indigo-500/20">
          Global Threat Radar
        </div>
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none">
        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          Live Tracking
        </div>
      </div>
    </div>
  );
}
