
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

const CITY_KYIV = { lat: 50.45, lng: 30.52 };

// Helper to convert lat/lng to 3D vector
const toVector = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
};

export const GlobeThreatMap: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);
    const kyivPos = useMemo(() => toVector(CITY_KYIV.lat, CITY_KYIV.lng, 2), []);

    // Generate random threats
    const threats = useMemo(() => {
        return Array.from({ length: 8 }, () => {
            const lat = (Math.random() - 0.5) * 160;
            const lng = (Math.random() - 0.5) * 360;
            return {
                id: Math.random(),
                start: toVector(lat, lng, 2),
                end: kyivPos,
                color: Math.random() > 0.7 ? '#ef4444' : '#eab308' // Red or Yellow
            };
        });
    }, [kyivPos]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Globe Wireframe */}
            <Sphere args={[2, 32, 32]}>
                <meshBasicMaterial color="#1e293b" wireframe transparent opacity={0.3} />
            </Sphere>
            {/* Globe Core */}
            <Sphere args={[1.95, 32, 32]}>
                <meshBasicMaterial color="#020617" transparent opacity={0.9} />
            </Sphere>

            {/* Kyiv Marker */}
            <mesh position={kyivPos}>
                <sphereGeometry args={[0.05]} />
                <meshBasicMaterial color="#3b82f6" />
            </mesh>
            <Html position={kyivPos} distanceFactor={10}>
                <div className="text-[8px] bg-blue-900/80 text-white px-1 rounded border border-blue-500 whitespace-nowrap">HQ: Kyiv</div>
            </Html>

            {/* Threat Arcs */}
            {threats.map((t) => {
                // Create curve
                const mid = t.start.clone().add(t.end).multiplyScalar(0.5).normalize().multiplyScalar(2.5);
                const curve = new THREE.QuadraticBezierCurve3(t.start, mid, t.end);
                const points = curve.getPoints(20);

                return (
                    <group key={t.id}>
                        <Line points={points} color={t.color} lineWidth={1} transparent opacity={0.5} />
                        {/* Moving Particle */}
                        <mesh position={t.start}>
                            <sphereGeometry args={[0.03]} />
                            <meshBasicMaterial color={t.color} />
                            <Html distanceFactor={10}>
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            </Html>
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};
